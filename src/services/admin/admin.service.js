/**
 * services/admin/admin.service.js
 * Platform admin: full system control — approve/reject entities, manage all records,
 * configure payment rules, add admins, view system logs.
 */
const { supabaseAdmin } = require('../../config/supabase');
const notificationsService = require('../notifications/notifications.service');

// ---- Doctor Management ----

const getAllDoctors = async ({ status, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  let query = supabaseAdmin.from('doctors')
    .select('*, users!doctors_user_id_fkey(email)', { count: 'exact' });
  if (status) query = query.eq('verification_status', status);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (error) throw { statusCode: 500, message: error.message };
  return { doctors: data, total: count };
};

const verifyDoctor = async (adminUserId, doctorId, { status, reason }) => {
  const { data: doctor, error } = await supabaseAdmin
    .from('doctors')
    .update({ verification_status: status, verified_by: adminUserId })
    .eq('doctor_id', doctorId)
    .select('*, users!doctors_user_id_fkey(user_id)')
    .single();

  if (error) throw { statusCode: 500, message: error.message };

  // Log the action
  await logAction(adminUserId, 'VERIFY_DOCTOR', `Doctor ${doctorId} marked ${status}. ${reason || ''}`, doctor.users?.user_id);

  // Notify the doctor
  if (doctor.users?.user_id) {
    await notificationsService.createNotification({
      userId: doctor.users.user_id,
      title: status === 'approved' ? '✅ Account Approved' : '❌ Account Rejected',
      body: status === 'approved'
        ? 'Your doctor account has been approved. You can now receive bookings.'
        : `Your doctor account was rejected. Reason: ${reason || 'Not specified'}`,
      type: 'verification',
      relatedId: doctorId,
    });
  }

  return doctor;
};

/** Admin creates a doctor account (pre-verified) */
const createDoctorAccount = async (adminUserId, doctorData) => {
  const tempPassword = Math.random().toString(36).slice(-10).toUpperCase();

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: doctorData.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role: 'doctor' },
  });
  if (authErr) throw { statusCode: 400, message: authErr.message };

  const userId = authData.user.id;
  await supabaseAdmin.from('users').insert({ user_id: userId, email: doctorData.email, role: 'doctor' });

  const { data: doctor } = await supabaseAdmin
    .from('doctors')
    .insert({
      user_id: userId,
      name: doctorData.name,
      specialization: doctorData.specialization,
      license_number: doctorData.licenseNumber,
      nic: doctorData.nic,
      phone: doctorData.phone,
      bio: doctorData.bio,
      verification_status: 'approved', // Admin-created = pre-verified
      verified_by: adminUserId,
    })
    .select()
    .single();

  await logAction(adminUserId, 'CREATE_DOCTOR', `Admin created doctor account for ${doctorData.email}`);

  return { doctor, tempPassword };
};

const deleteDoctor = async (adminUserId, doctorId) => {
  const { data: doc } = await supabaseAdmin.from('doctors').select('user_id').eq('doctor_id', doctorId).single();
  await supabaseAdmin.from('doctors').delete().eq('doctor_id', doctorId);
  await supabaseAdmin.auth.admin.deleteUser(doc.user_id);
  await logAction(adminUserId, 'DELETE_DOCTOR', `Doctor ${doctorId} deleted`);
  return { success: true };
};

// ---- Center Management ----

const getAllCenters = async ({ status, page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  let query = supabaseAdmin.from('channeling_centers').select('*', { count: 'exact' });
  if (status) query = query.eq('verification_status', status);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (error) throw { statusCode: 500, message: error.message };
  return { centers: data, total: count };
};

const verifyCenter = async (adminUserId, centerId, { status, reason }) => {
  const { data: center, error } = await supabaseAdmin
    .from('channeling_centers')
    .update({ verification_status: status, verified_by: adminUserId })
    .eq('center_id', centerId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };

  // Notify the center owner
  const { data: owner } = await supabaseAdmin
    .from('center_admins').select('user_id').eq('center_id', centerId).eq('center_role', 'owner').single();

  if (owner) {
    await notificationsService.createNotification({
      userId: owner.user_id,
      title: status === 'approved' ? '✅ Center Approved' : '❌ Center Rejected',
      body: status === 'approved'
        ? 'Your channeling center has been approved. You can now create sessions.'
        : `Your center was rejected. Reason: ${reason || 'Not specified'}`,
      type: 'verification',
      relatedId: centerId,
    });
  }

  await logAction(adminUserId, 'VERIFY_CENTER', `Center ${centerId} marked ${status}`);
  return center;
};

const deleteCenter = async (adminUserId, centerId) => {
  await supabaseAdmin.from('channeling_centers').delete().eq('center_id', centerId);
  await logAction(adminUserId, 'DELETE_CENTER', `Center ${centerId} deleted`);
  return { success: true };
};

// ---- Patient Management ----

const getAllPatients = async ({ page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('patients')
    .select('*, users(email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw { statusCode: 500, message: error.message };
  return { patients: data, total: count };
};

const getAllAppointments = async ({ page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('appointments')
    .select('*, channel_sessions(date, start_time, doctors(name)), patients(name), payments!appointments_payment_id_fkey(total_amount)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw { statusCode: 500, message: error.message };
  return { appointments: data, total: count };
};

// ---- Platform Admins ----

const getAllAdmins = async () => {
  const { data, error } = await supabaseAdmin
    .from('users').select('user_id, email, created_at').eq('role', 'platform_admin');
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

const addAdmin = async (adminUserId, { email, password }) => {
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { role: 'platform_admin' },
  });
  if (authErr) throw { statusCode: 400, message: authErr.message };

  await supabaseAdmin.from('users').insert({ user_id: authData.user.id, email, role: 'platform_admin' });
  await logAction(adminUserId, 'ADD_ADMIN', `New platform admin added: ${email}`);
  return { userId: authData.user.id, email };
};

// ---- Payment Config ----

const getPaymentConfig = async () => {
  const { data } = await supabaseAdmin.from('payment_config').select('*').order('updated_at', { ascending: false }).limit(1).single();
  return data || { platform_fee_pct: 5, tax_pct: 2.5 };
};

const updatePaymentConfig = async (adminUserId, { platformFeePct, taxPct }) => {
  const { data, error } = await supabaseAdmin
    .from('payment_config')
    .insert({ platform_fee_pct: platformFeePct, tax_pct: taxPct, updated_by: adminUserId })
    .select().single();
  if (error) throw { statusCode: 500, message: error.message };
  await logAction(adminUserId, 'UPDATE_PAYMENT_CONFIG', `Platform fee: ${platformFeePct}%, Tax: ${taxPct}%`);
  return data;
};

// ---- System Logs ----

const getSystemLogs = async ({ page = 1, limit = 50 }) => {
  const from = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('system_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw { statusCode: 500, message: error.message };
  return { logs: data, total: count };
};

// ---- System Stats ----

const getSystemStats = async () => {
  const [
    { count: patients }, { count: doctors }, { count: centers },
    { count: bookings }, { count: pendingDoctors }, { count: pendingCenters },
  ] = await Promise.all([
    supabaseAdmin.from('patients').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('doctors').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('channeling_centers').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('doctors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabaseAdmin.from('channeling_centers').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
  ]);
  return { patients, doctors, centers, bookings, pendingDoctors, pendingCenters };
};

// ---- Helper ----
const logAction = async (performedBy, action, description, affectingUser = null) => {
  const { error } = await supabaseAdmin.from('system_logs').insert({
    action, description, performed_by: performedBy, affecting_user: affectingUser,
  });
  if (error) console.error('[logAction]', error.message);
};

module.exports = {
  getAllDoctors, verifyDoctor, createDoctorAccount, deleteDoctor,
  getAllCenters, verifyCenter, deleteCenter,
  getAllPatients, getAllAppointments,
  getAllAdmins, addAdmin,
  getPaymentConfig, updatePaymentConfig,
  getSystemLogs, getSystemStats,
};
