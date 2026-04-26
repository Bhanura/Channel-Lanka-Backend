/**
 * services/payments/payments.service.js
 * Dummy payment gateway — simulates payment processing with fee breakdown.
 * NO real money involved. For demonstration only.
 */
const { supabaseAdmin } = require('../../config/supabase');
const { v4: uuidv4 } = require('uuid');
const notificationsService = require('../notifications/notifications.service');

/**
 * Calculate fee breakdown for a session.
 * Returns: { doctor_fee, center_fee, platform_fee, tax, total }
 */
const getPaymentBreakdown = async (sessionId) => {
  // Fetch session + room + platform config
  const [{ data: session }, { data: config }] = await Promise.all([
    supabaseAdmin
      .from('channel_sessions')
      .select('doctor_fee, rooms(charge)')
      .eq('session_id', sessionId)
      .single(),
    supabaseAdmin
      .from('payment_config')
      .select('platform_fee_pct, tax_pct')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  if (!session) throw { statusCode: 404, message: 'Session not found' };

  const doctorFee = parseFloat(session.doctor_fee || 0);
  const centerFee = parseFloat(session.rooms?.charge || 0);
  const subtotal = doctorFee + centerFee;

  const platformFeePct = parseFloat(config?.platform_fee_pct || 5) / 100;
  const taxPct = parseFloat(config?.tax_pct || 2.5) / 100;

  const platformFee = parseFloat((subtotal * platformFeePct).toFixed(2));
  const tax = parseFloat((subtotal * taxPct).toFixed(2));
  const total = parseFloat((subtotal + platformFee + tax).toFixed(2));

  return { doctor_fee: doctorFee, center_fee: centerFee, platform_fee: platformFee, tax, total };
};

/**
 * Process a dummy payment for an appointment.
 * Creates a payment record and updates the appointment status.
 * Accepts ANY card number — this is a demo gateway.
 */
const processPayment = async ({ appointmentId, paymentMethod, cardDetails }) => {
  // Fetch appointment
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('*, channel_sessions(session_id, doctor_fee, doctor_id, rooms(charge))')
    .eq('appointment_id', appointmentId)
    .single();

  if (!appt) throw { statusCode: 404, message: 'Appointment not found' };
  if (appt.status === 'cancelled') throw { statusCode: 400, message: 'Cannot pay for a cancelled appointment' };

  // Check if payment already exists
  const { data: existingPayment } = await supabaseAdmin
    .from('payments').select('payment_id').eq('appointment_id', appointmentId).single();
  if (existingPayment) throw { statusCode: 409, message: 'Payment already processed' };

  // Calculate fees
  const breakdown = await getPaymentBreakdown(appt.session_id);

  // Simulate payment (always succeeds for demo)
  const transactionRef = `CLK-${Date.now()}-${Math.random().toString(36).slice(-4).toUpperCase()}`;

  // Create payment record
  const { data: payment, error } = await supabaseAdmin
    .from('payments')
    .insert({
      appointment_id: appointmentId,
      doctor_fee: breakdown.doctor_fee,
      center_fee: breakdown.center_fee,
      platform_fee: breakdown.platform_fee,
      tax: breakdown.tax,
      total_amount: breakdown.total,
      payment_method: paymentMethod || 'card',
      payment_status: 'paid',
      transaction_ref: transactionRef,
    })
    .select()
    .single();

  if (error) throw { statusCode: 500, message: error.message };

  // Update appointment with payment reference
  await supabaseAdmin
    .from('appointments')
    .update({ payment_id: payment.payment_id, status: 'confirmed' })
    .eq('appointment_id', appointmentId);

  // Notify patient
  if (appt.patient_id) {
    const { data: patient } = await supabaseAdmin
      .from('patients').select('user_id').eq('patient_id', appt.patient_id).single();
    if (patient) {
      await notificationsService.createNotification({
        userId: patient.user_id,
        title: 'Payment Confirmed ✅',
        body: `Your payment of LKR ${breakdown.total} for appointment #${appt.appointment_number} is confirmed. Ref: ${transactionRef}`,
        type: 'payment',
        relatedId: payment.payment_id,
      });
    }
  }

  return { payment, breakdown, transactionRef };
};

/** Get all payments (admin) */
const getAllPayments = async ({ page = 1, limit = 20 }) => {
  const from = (page - 1) * limit;
  const { data, count, error } = await supabaseAdmin
    .from('payments')
    .select('*, appointments(appointment_number, status, patients(name), channel_sessions(date, doctors(name)))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (error) throw { statusCode: 500, message: error.message };
  return { payments: data, total: count, page, limit };
};

module.exports = { getPaymentBreakdown, processPayment, getAllPayments };
