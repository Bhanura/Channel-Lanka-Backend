/**
 * services/centers/centers.service.js
 * Business logic for channeling center management.
 * Covers: profile, rooms, staff, doctor requests, session overview, payments.
 */
const { supabaseAdmin } = require('../../config/supabase');

/** Get the center(s) administered by this user */
const getMyCenters = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('center_admins')
    .select('center_role, channeling_centers(*, center_ratings(rate_value))')
    .eq('user_id', userId);
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get center by ID (public) */
const getCenterById = async (centerId) => {
  const { data, error } = await supabaseAdmin
    .from('channeling_centers')
    .select('*, center_ratings(rate_value, review), center_facilities(facilities(name))')
    .eq('center_id', centerId)
    .single();
  if (error) throw { statusCode: 404, message: 'Center not found' };

  const ratings = data.center_ratings || [];
  data.avg_rating = ratings.length
    ? (ratings.reduce((s, r) => s + r.rate_value, 0) / ratings.length).toFixed(1)
    : null;
  return data;
};

/** Update center profile */
const updateCenter = async (userId, centerId, updates) => {
  await assertCenterAdmin(userId, centerId);
  const { data, error } = await supabaseAdmin
    .from('channeling_centers').update(updates).eq('center_id', centerId).select().single();
  if (error) throw { statusCode: 400, message: error.message };
  return data;
};

/** List rooms in a center */
const getRooms = async (centerId) => {
  const { data, error } = await supabaseAdmin
    .from('rooms').select('*, room_facilities(facilities(name))').eq('center_id', centerId);
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Create a room */
const createRoom = async (userId, centerId, { name, charge }) => {
  await assertCenterAdmin(userId, centerId);
  const { data, error } = await supabaseAdmin
    .from('rooms').insert({ center_id: centerId, name, charge }).select().single();
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** List registered doctors for a center */
const getRegisteredDoctors = async (centerId) => {
  const { data, error } = await supabaseAdmin
    .from('registered_doctors')
    .select('*, doctors(user_id, name, specialization, avatar_url, verification_status)')
    .eq('center_id', centerId);
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Center sends doctor request */
const sendDoctorRequest = async (userId, centerId, { doctorId, offerDetails }) => {
  await assertCenterAdmin(userId, centerId);

  // Check for existing pending
  const { data: existing } = await supabaseAdmin
    .from('doctor_requests')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('center_id', centerId)
    .eq('request_status', 'pending')
    .single();
  if (existing) throw { statusCode: 409, message: 'A pending request already exists for this doctor' };

  const adminRecord = await getCenterAdminRecord(userId, centerId);

  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .insert({
      initiated_by_role: 'center',
      requesting_center_admin_id: adminRecord.id,
      doctor_id: doctorId,
      center_id: centerId,
      offer_details: offerDetails,
      request_status: 'pending',
    })
    .select()
    .single();
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get all doctor requests for this center */
const getDoctorRequests = async (centerId) => {
  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .select('*, doctors!doctor_requests_doctor_id_fkey(name, specialization, avatar_url)')
    .eq('center_id', centerId)
    .order('created_at', { ascending: false });
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Center responds to a doctor-initiated request */
const respondToRequest = async (userId, centerId, requestId, status) => {
  await assertCenterAdmin(userId, centerId);

  const { data: req } = await supabaseAdmin
    .from('doctor_requests').select('*').eq('id', requestId).single();
  if (!req || req.center_id !== centerId) throw { statusCode: 403, message: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('doctor_requests')
    .update({ request_status: status })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw { statusCode: 500, message: error.message };

  if (status === 'accepted') {
    await supabaseAdmin.from('registered_doctors')
      .upsert({ doctor_id: req.doctor_id, center_id: centerId }, { onConflict: 'doctor_id,center_id' });
  }
  return data;
};

/** Get center staff (sub-admins) */
const getStaff = async (userId, centerId) => {
  await assertCenterAdmin(userId, centerId);
  const { data, error } = await supabaseAdmin
    .from('center_admins')
    .select('*, users!center_admins_user_id_fkey(email)')
    .eq('center_id', centerId);
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Add a sub-admin to the center */
const addStaff = async (userId, centerId, { email, password, role }) => {
  // Only owner can add staff
  const adminRecord = await getCenterAdminRecord(userId, centerId);
  if (adminRecord.center_role !== 'owner') throw { statusCode: 403, message: 'Only the owner can add staff' };

  // 1. Check if user already exists in public.users
  let { data: targetUser } = await supabaseAdmin
    .from('users').select('user_id, role').eq('email', email).maybeSingle();

  if (!targetUser) {
    // 2. If not, create a new auth user using provided password
    if (!password) throw { statusCode: 400, message: 'Password is required for new accounts' };

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'center_admin' },
    });

    if (authError) {
      throw { statusCode: 400, message: `Auth error: ${authError.message}` };
    }

    const newUserId = authData.user.id;

    // 3. Insert into public.users
    const { error: userError } = await supabaseAdmin
      .from('users').insert({ user_id: newUserId, email, role: 'center_admin' });
    
    if (userError) throw { statusCode: 500, message: `Failed to mirror user: ${userError.message}` };
    
    targetUser = { user_id: newUserId, role: 'center_admin' };
  } else if (targetUser.role !== 'center_admin') {
    // 4. If user exists but is not a center_admin (e.g. they were a patient), 
    // update their role so they can access the center dashboard.
    const { error: updateError } = await supabaseAdmin
      .from('users').update({ role: 'center_admin' }).eq('user_id', targetUser.user_id);
    
    if (updateError) throw { statusCode: 500, message: `Failed to update user role: ${updateError.message}` };
  }

  // 5. Add as center admin
  const { data, error } = await supabaseAdmin
    .from('center_admins')
    .insert({ 
      center_id: centerId, 
      user_id: targetUser.user_id, 
      center_role: role || 'staff', 
      added_by: userId 
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw { statusCode: 400, message: 'User is already a staff member of this center' };
    throw { statusCode: 500, message: error.message };
  }
  
  return data;
};

/** Get payments for center sessions */
const getPayments = async (centerId) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*, appointments!fk_payments_appointment(appointment_number, status, channel_sessions(date, doctors(name)))')
    .in('appointments.session_id',
      (await supabaseAdmin.from('channel_sessions')
        .select('session_id')
        .in('room_id',
          (await supabaseAdmin.from('rooms').select('room_id').eq('center_id', centerId)).data?.map(r => r.room_id) || []
        )).data?.map(s => s.session_id) || []
    );
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Dashboard stats */
const getStats = async (userId, centerId) => {
  const [{ count: sessions }, { count: bookings }, { count: doctors }] = await Promise.all([
    supabaseAdmin.from('channel_sessions').select('*', { count: 'exact', head: true })
      .in('room_id', (await supabaseAdmin.from('rooms').select('room_id').eq('center_id', centerId)).data?.map(r => r.room_id) || []),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .in('session_id', (await supabaseAdmin.from('channel_sessions').select('session_id').in('room_id', (await supabaseAdmin.from('rooms').select('room_id').eq('center_id', centerId)).data?.map(r => r.room_id) || [])).data?.map(s => s.session_id) || []),
    supabaseAdmin.from('registered_doctors').select('*', { count: 'exact', head: true }).eq('center_id', centerId),
  ]);
  return { sessions, bookings, registeredDoctors: doctors };
};

// ---- Helpers ----
const assertCenterAdmin = async (userId, centerId) => {
  const { data } = await supabaseAdmin
    .from('center_admins').select('id').eq('user_id', userId).eq('center_id', centerId).single();
  if (!data) throw { statusCode: 403, message: 'You are not an admin of this center' };
};

const getCenterAdminRecord = async (userId, centerId) => {
  const { data } = await supabaseAdmin
    .from('center_admins').select('*').eq('user_id', userId).eq('center_id', centerId).single();
  if (!data) throw { statusCode: 403, message: 'Admin record not found' };
  return data;
};

module.exports = { getMyCenters, getCenterById, updateCenter, getRooms, createRoom, getRegisteredDoctors, sendDoctorRequest, getDoctorRequests, respondToRequest, getStaff, addStaff, getPayments, getStats };
