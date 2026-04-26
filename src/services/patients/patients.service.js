/**
 * services/patients/patients.service.js
 * Business logic for patient profile and appointment queries.
 */
const { supabaseAdmin } = require('../../config/supabase');

/** Get patient profile by user_id */
const getProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw { statusCode: 404, message: 'Patient profile not found' };
  return data;
};

/** Update patient profile */
const updateProfile = async (userId, updates) => {
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('patient_id')
    .eq('user_id', userId)
    .single();

  const { data, error } = await supabaseAdmin
    .from('patients')
    .update(updates)
    .eq('patient_id', patient.patient_id)
    .select()
    .single();
  if (error) throw { statusCode: 400, message: error.message };
  return data;
};

/** Get all appointments for a patient */
const getAppointments = async (userId) => {
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('patient_id')
    .eq('user_id', userId)
    .single();

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      channel_sessions (
        date, start_time, end_time, doctor_fee,
        doctors ( name, specialization, avatar_url ),
        rooms ( name, channeling_centers ( name, location ) )
      ),
      payments ( total_amount, payment_status )
    `)
    .eq('patient_id', patient.patient_id)
    .order('created_at', { ascending: false });

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get appointment stats for dashboard */
const getStats = async (userId) => {
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('patient_id')
    .eq('user_id', userId)
    .single();

  const pid = patient.patient_id;
  const today = new Date().toISOString().split('T')[0];

  const [{ count: upcoming }, { count: completed }, { count: total }] = await Promise.all([
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('patient_id', pid).eq('status', 'booked'),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('patient_id', pid).eq('status', 'completed'),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('patient_id', pid),
  ]);

  return { upcoming, completed, total };
};

/** Rate a doctor */
const rateDoctor = async (userId, { doctorId, rateValue, review }) => {
  const { data: patient } = await supabaseAdmin
    .from('patients').select('patient_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin.from('doctor_ratings').upsert({
    patient_id: patient.patient_id,
    doctor_id: doctorId,
    rate_value: rateValue,
    review,
  }, { onConflict: 'patient_id,doctor_id' }).select().single();

  if (error) throw { statusCode: 400, message: error.message };
  return data;
};

/** Rate a channeling center */
const rateCenter = async (userId, { centerId, rateValue, review }) => {
  const { data: patient } = await supabaseAdmin
    .from('patients').select('patient_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin.from('center_ratings').upsert({
    patient_id: patient.patient_id,
    center_id: centerId,
    rate_value: rateValue,
    review,
  }, { onConflict: 'patient_id,center_id' }).select().single();

  if (error) throw { statusCode: 400, message: error.message };
  return data;
};

module.exports = { getProfile, updateProfile, getAppointments, getStats, rateDoctor, rateCenter };
