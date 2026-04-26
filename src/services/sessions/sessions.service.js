/**
 * services/sessions/sessions.service.js
 * Manages channel sessions (scheduling doctor visits at centers).
 */
const { supabaseAdmin } = require('../../config/supabase');
const notificationsService = require('../notifications/notifications.service');

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
      doctors!inner ( name, specialization, avatar_url ),
      rooms!inner ( name, charge, channeling_centers!inner ( center_id, name, location ) ),
      appointments ( count )
    `)
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0]);

  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (date) query = query.eq('date', date);
  if (centerId) query = query.eq('rooms.center_id', centerId);
  if (specialization) query = query.eq('doctors.specialization', specialization);

  const { data, error } = await query.order('date');
  if (error) throw { statusCode: 500, message: error.message };

  return data.map(s => ({
    ...s,
    booked_count: s.appointments?.[0]?.count || 0,
    is_full: (s.appointments?.[0]?.count || 0) >= s.patient_limit,
  }));
};

/** Cancel session by doctor */
const cancelSessionByDoctor = async (userId, sessionId, reason) => {
  // 1. Get doctor details
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id, name').eq('user_id', userId).single();
  if (!doctor) throw { statusCode: 403, message: 'Doctor not found' };

  // 2. Get session details
  const { data: session } = await supabaseAdmin
    .from('channel_sessions')
    .select('*, rooms(center_id, channeling_centers(name, created_by))')
    .eq('session_id', sessionId)
    .single();

  if (!session) throw { statusCode: 404, message: 'Session not found' };
  if (session.doctor_id !== doctor.doctor_id) throw { statusCode: 403, message: 'Not authorized to cancel this session' };
  if (session.status === 'cancelled') throw { statusCode: 400, message: 'Session is already cancelled' };

  // 3. Update session status
  const { data: updatedSession, error: updateErr } = await supabaseAdmin
    .from('channel_sessions')
    .update({ status: 'cancelled' })
    .eq('session_id', sessionId)
    .select()
    .single();

  if (updateErr) throw { statusCode: 500, message: updateErr.message };

  // 4. Cancel all appointments and refund payments
  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('appointment_id, patient_id, payment_id, patients(user_id, name)')
    .eq('session_id', sessionId)
    .neq('status', 'cancelled');

  if (appointments && appointments.length > 0) {
    const apptIds = appointments.map(a => a.appointment_id);
    const paymentIds = appointments.map(a => a.payment_id).filter(Boolean);

    // Cancel appointments
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled' })
      .in('appointment_id', apptIds);

    // Refund payments
    if (paymentIds.length > 0) {
      await supabaseAdmin
        .from('payments')
        .update({ payment_status: 'refunded' })
        .in('payment_id', paymentIds);
    }

    // Notify patients
    for (const appt of appointments) {
      if (appt.patients?.user_id) {
        await notificationsService.createNotification({
          userId: appt.patients.user_id,
          title: 'Session Cancelled',
          body: `Dr. ${doctor.name}'s session on ${session.date} has been cancelled. Reason: ${reason}. You will be refunded.`,
          type: 'session_cancelled',
          relatedId: sessionId,
        });
      }
    }
  }

  // 5. Notify Center Admin
  const centerId = session.rooms?.center_id;
  if (centerId) {
    const { data: centerAdmins } = await supabaseAdmin
      .from('center_admins')
      .select('user_id')
      .eq('center_id', centerId);

    if (centerAdmins) {
      for (const admin of centerAdmins) {
        await notificationsService.createNotification({
          userId: admin.user_id,
          title: 'Doctor Cancelled Session',
          body: `Dr. ${doctor.name} cancelled their session on ${session.date}. Reason: ${reason}. Patients have been notified and refunded.`,
          type: 'session_cancelled',
          relatedId: sessionId,
        });
      }
    }
  }

  // 6. Log it
  await supabaseAdmin.from('system_logs').insert({
    action: 'doctor_cancelled_session',
    description: `Doctor ${doctor.name} cancelled session ${sessionId}. Reason: ${reason}`,
    performed_by: userId,
  });

  return updatedSession;
};

module.exports = { createSession, getCenterSessions, getSessionDetail, updateSession, getAvailableSessions, cancelSessionByDoctor };
