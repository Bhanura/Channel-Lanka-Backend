/**
 * services/appointments/appointments.service.js
 * Handles booking creation for both registered patients and guests.
 * Guest flow: create temp account → create patient record → book.
 */
const { supabaseAdmin } = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');
const notificationsService = require('../notifications/notifications.service');

/**
 * Book an appointment.
 * If `userId` is null (guest), creates a temp account automatically.
 */
const bookAppointment = async (userId, { sessionId, patientDetails }) => {
  // ---- 1. Fetch session and check availability ----
  const { data: session, error: sessErr } = await supabaseAdmin
    .from('channel_sessions')
    .select('*, rooms(center_id, charge, channeling_centers(name))')
    .eq('session_id', sessionId)
    .single();

  if (sessErr || !session) throw { statusCode: 404, message: 'Session not found' };
  if (session.status !== 'scheduled') throw { statusCode: 400, message: 'Session is not available for booking' };

  // Count existing appointments
  const { count: bookedCount } = await supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .neq('status', 'cancelled');

  if (bookedCount >= session.patient_limit) {
    throw { statusCode: 409, message: 'Session is fully booked' };
  }

  // ---- 2. Resolve or create patient ----
  let patientId = null;
  let tempPassword = null;
  let isGuestAccount = false;

  if (userId) {
    // Registered patient
    const { data: patient } = await supabaseAdmin
      .from('patients').select('patient_id').eq('user_id', userId).single();
    patientId = patient.patient_id;
  } else {
    // Guest — create account with temp password
    tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    isGuestAccount = true;

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: patientDetails.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role: 'patient' },
    });
    if (authErr) throw { statusCode: 400, message: authErr.message };

    const newUserId = authData.user.id;
    await supabaseAdmin.from('users').insert({ user_id: newUserId, email: patientDetails.email, role: 'patient' });

    const { data: newPatient } = await supabaseAdmin
      .from('patients')
      .insert({
        user_id: newUserId,
        name: patientDetails.name,
        phone: patientDetails.phone,
        gender: patientDetails.gender || 'not_specified',
        dob: patientDetails.dob || null,
        nic: patientDetails.nic || null,
        location: patientDetails.location || null,
      })
      .select().single();

    patientId = newPatient.patient_id;
  }

  // ---- 3. Assign appointment number ----
  const appointmentNumber = bookedCount + 1;

  // ---- 4. Create appointment (initially without paymentId) ----
  const { data: appointment, error: apptErr } = await supabaseAdmin
    .from('appointments')
    .insert({
      session_id: sessionId,
      patient_id: patientId,
      appointment_number: appointmentNumber,
      status: 'booked',
    })
    .select()
    .single();

  if (apptErr) throw { statusCode: 500, message: apptErr.message };

  // ---- 5. Notify doctor and center admin ----
  // Get doctor's user_id
  const { data: doctor } = await supabaseAdmin
    .from('doctors').select('user_id, name').eq('doctor_id', session.doctor_id).single();

  if (doctor) {
    await notificationsService.createNotification({
      userId: doctor.user_id,
      title: 'New Appointment Booked',
      body: `A patient has booked appointment #${appointmentNumber} for your session on ${session.date}`,
      type: 'appointment',
      relatedId: appointment.appointment_id,
    });
  }

  return {
    appointment,
    tempPassword: isGuestAccount ? tempPassword : null,
    appointmentNumber,
  };
};

/** Get appointment by ID */
const getAppointmentById = async (appointmentId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      channel_sessions(date, start_time, end_time, doctor_fee, doctors(name, specialization), rooms(name, charge, channeling_centers(name, location))),
      payments!appointments_payment_id_fkey(*)
    `)
    .eq('appointment_id', appointmentId)
    .single();
  if (error) throw { statusCode: 404, message: 'Appointment not found' };
  return data;
};

/** Cancel an appointment */
const cancelAppointment = async (userId, appointmentId) => {
  const { data: patient } = await supabaseAdmin
    .from('patients').select('patient_id').eq('user_id', userId).single();

  const { data: appt } = await supabaseAdmin
    .from('appointments').select('*').eq('appointment_id', appointmentId).single();

  if (!appt || appt.patient_id !== patient.patient_id) {
    throw { statusCode: 403, message: 'Not authorized to cancel this appointment' };
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('appointment_id', appointmentId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Get all appointments for a session (center admin view) */
const getSessionAppointments = async (sessionId) => {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*, patients(name, phone, gender), payments!appointments_payment_id_fkey(total_amount, payment_status)')
    .eq('session_id', sessionId)
    .order('appointment_number');
  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

/** Update appointment status (for queue management) */
const updateAppointmentStatus = async (userId, appointmentId, status) => {
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('*, channel_sessions(doctor_id, rooms(center_id))')
    .eq('appointment_id', appointmentId)
    .single();

  if (!appt) throw { statusCode: 404, message: 'Appointment not found' };

  const [{ data: doctor }, { data: admin }] = await Promise.all([
    supabaseAdmin.from('doctors').select('doctor_id').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('center_admins').select('id').eq('user_id', userId).eq('center_id', appt.channel_sessions.rooms.center_id).maybeSingle()
  ]);

  if ((!doctor || doctor.doctor_id !== appt.channel_sessions.doctor_id) && !admin) {
    throw { statusCode: 403, message: 'Not authorized to update this appointment' };
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status })
    .eq('appointment_id', appointmentId)
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };
  return data;
};

module.exports = { bookAppointment, getAppointmentById, cancelAppointment, getSessionAppointments, updateAppointmentStatus };
