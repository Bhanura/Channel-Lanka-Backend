/**
 * services/sessions/sessions.service.js
 * Manages channel sessions (scheduling doctor visits at centers).
 */
const { supabaseAdmin } = require('../../config/supabase');

/** Create a new session (center admin only) */
const createSession = async (userId, centerId, sessionData) => {
  // Verify the user is admin of this center
  const { data: adminRecord } = await supabaseAdmin
    .from('center_admins').select('id').eq('user_id', userId).eq('center_id', centerId).single();
  if (!adminRecord) throw { statusCode: 403, message: 'Not an admin of this center' };

  // Verify doctor is registered at this center
  const { data: reg } = await supabaseAdmin
    .from('registered_doctors')
    .select('id')
    .eq('doctor_id', sessionData.doctorId)
    .eq('center_id', centerId)
    .single();
  if (!reg) throw { statusCode: 400, message: 'Doctor is not registered at this center' };

  const { data, error } = await supabaseAdmin
    .from('channel_sessions')
    .insert({
      doctor_id: sessionData.doctorId,
      room_id: sessionData.roomId,
      created_by: adminRecord.id,
      date: sessionData.date,
      start_time: sessionData.startTime,
      end_time: sessionData.endTime,
      patient_limit: sessionData.patientLimit,
      doctor_fee: sessionData.doctorFee,
      status: 'scheduled',
      doctor_attendance_status: 'pending',
    })
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get all sessions for a center */
const getCenterSessions = async (centerId) => {
  const roomIds = (await supabaseAdmin.from('rooms').select('room_id').eq('center_id', centerId)).data?.map(r => r.room_id) || [];

  const { data, error } = await supabaseAdmin
    .from('channel_sessions')
    .select(`
      *,
      doctors ( name, specialization, avatar_url ),
      rooms ( name, charge ),
      appointments ( count )
    `)
    .in('room_id', roomIds)
    .order('date', { ascending: false });

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get a single session with patient list */
const getSessionDetail = async (sessionId) => {
  const { data, error } = await supabaseAdmin
    .from('channel_sessions')
    .select(`
      *,
      doctors ( name, specialization, avatar_url, phone ),
      rooms ( name, charge, channeling_centers ( name, location, phone ) ),
      appointments (
        appointment_id, appointment_number, status,
        patients ( name, phone, gender )
      )
    `)
    .eq('session_id', sessionId)
    .single();

  if (error) throw { statusCode: 404, message: 'Session not found' };
  return data;
};

/** Update session (reschedule, cancel, mark attendance) */
const updateSession = async (userId, centerId, sessionId, updates) => {
  const { data: adminRecord } = await supabaseAdmin
    .from('center_admins').select('id').eq('user_id', userId).eq('center_id', centerId).single();
  if (!adminRecord) throw { statusCode: 403, message: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('channel_sessions')
    .update(updates)
    .eq('session_id', sessionId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get available upcoming sessions (public — for booking) */
const getAvailableSessions = async ({ doctorId, centerId, date, specialization }) => {
  let query = supabaseAdmin
    .from('channel_sessions')
    .select(`
      *,
      doctors ( name, specialization, avatar_url ),
      rooms ( name, charge, channeling_centers ( name, location ) ),
      appointments ( count )
    `)
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0]);

  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (date) query = query.eq('date', date);

  const { data, error } = await query.order('date');
  if (error) throw { statusCode: 500, message: error.message };

  // Filter by center and add availability info
  return data
    .filter(s => !centerId || s.rooms?.channeling_centers?.center_id === centerId)
    .map(s => ({
      ...s,
      booked_count: s.appointments?.[0]?.count || 0,
      is_full: (s.appointments?.[0]?.count || 0) >= s.patient_limit,
    }));
};

module.exports = { createSession, getCenterSessions, getSessionDetail, updateSession, getAvailableSessions };
