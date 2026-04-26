/**
 * services/doctors/doctors.service.js
 * Business logic for doctor profile, sessions, center relationships and requests.
 */
const { supabaseAdmin } = require('../../config/supabase');

/** Get doctor profile by user_id */
const getProfile = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('doctors')
    .select('*, doctor_qualifications(*), doctor_ratings(rate_value)')
    .eq('user_id', userId)
    .single();
  if (error) throw { statusCode: 404, message: 'Doctor profile not found' };

  // Compute average rating
  const ratings = data.doctor_ratings || [];
  data.avg_rating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rate_value, 0) / ratings.length).toFixed(1)
    : null;

  return data;
};

/** Get doctor by doctor_id (public) */
const getDoctorById = async (doctorId) => {
  const { data, error } = await supabaseAdmin
    .from('doctors')
    .select('*, doctor_qualifications(*), doctor_ratings(rate_value, review, created_at)')
    .eq('doctor_id', doctorId)
    .single();
  if (error) throw { statusCode: 404, message: 'Doctor not found' };

  const ratings = data.doctor_ratings || [];
  data.avg_rating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rate_value, 0) / ratings.length).toFixed(1)
    : null;
  return data;
};

/** Update doctor profile */
const updateProfile = async (userId, updates) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin
    .from('doctors')
    .update(updates)
    .eq('doctor_id', doctor.doctor_id)
    .select()
    .single();
  if (error) throw { statusCode: 400, message: error.message };
  return data;
};

/** Get sessions for a doctor */
const getSessions = async (userId) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin
    .from('channel_sessions')
    .select(`
      *,
      rooms ( name, charge, channeling_centers ( center_id, name, location ) ),
      appointments ( count )
    `)
    .eq('doctor_id', doctor.doctor_id)
    .order('date', { ascending: false });

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get registered centers for a doctor */
const getRegisteredCenters = async (userId) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin
    .from('registered_doctors')
    .select('*, channeling_centers(*)')
    .eq('doctor_id', doctor.doctor_id);

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Doctor sends a request to a channeling center */
const sendCenterRequest = async (userId, { centerId, offerDetails }) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  // Check no duplicate pending request
  const { data: existing } = await supabaseAdmin
    .from('doctor_requests')
    .select('id')
    .eq('doctor_id', doctor.doctor_id)
    .eq('center_id', centerId)
    .eq('request_status', 'pending')
    .single();

  if (existing) throw { statusCode: 409, message: 'A pending request already exists for this center' };

  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .insert({
      initiated_by_role: 'doctor',
      requesting_doctor_id: doctor.doctor_id,
      doctor_id: doctor.doctor_id,
      center_id: centerId,
      offer_details: offerDetails,
      request_status: 'pending',
    })
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get all requests sent/received by this doctor */
const getRequests = async (userId) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .select('*, channeling_centers(name, location, logo_url)')
    .eq('doctor_id', doctor.doctor_id)
    .order('created_at', { ascending: false });

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Doctor responds to a center-initiated request */
const respondToRequest = async (userId, requestId, status) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const { data: req } = await supabaseAdmin
    .from('doctor_requests').select('*').eq('id', requestId).single();

  if (!req || req.doctor_id !== doctor.doctor_id) {
    throw { statusCode: 403, message: 'Not authorized to respond to this request' };
  }

  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .update({ request_status: status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };

  // If accepted, create registered_doctors record
  if (status === 'accepted') {
    await supabaseAdmin.from('registered_doctors')
      .upsert({ doctor_id: doctor.doctor_id, center_id: req.center_id }, { onConflict: 'doctor_id,center_id' });
  }

  return data;
};

/** Get dashboard stats */
const getStats = async (userId) => {
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('doctor_id').eq('user_id', userId).single();

  const today = new Date().toISOString().split('T')[0];
  const did = doctor.doctor_id;

  const [{ count: todaySessions }, { count: totalSessions }, { count: centers }] = await Promise.all([
    supabaseAdmin.from('channel_sessions').select('*', { count: 'exact', head: true })
      .eq('doctor_id', did).eq('date', today),
    supabaseAdmin.from('channel_sessions').select('*', { count: 'exact', head: true })
      .eq('doctor_id', did),
    supabaseAdmin.from('registered_doctors').select('*', { count: 'exact', head: true })
      .eq('doctor_id', did),
  ]);

  return { todaySessions, totalSessions, registeredCenters: centers };
};

module.exports = { getProfile, getDoctorById, updateProfile, getSessions, getRegisteredCenters, sendCenterRequest, getRequests, respondToRequest, getStats };
