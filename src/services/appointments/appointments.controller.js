/**
 * services/appointments/appointments.controller.js + routes.js (combined for brevity)
 */
const svc = require('./appointments.service');

const bookAppointment = async (req, res, next) => {
  try {
    // optionalAuth sets req.user = null for guests
    const result = await svc.bookAppointment(req.user?.user_id || null, req.body);
    res.status(201).json({
      message: 'Appointment booked successfully',
      data: result,
    });
  } catch (e) { next(e); }
};

const getAppointmentById = async (req, res, next) => {
  try { res.json({ data: await svc.getAppointmentById(req.params.id) }); }
  catch (e) { next(e); }
};

const cancelAppointment = async (req, res, next) => {
  try { res.json({ message: 'Appointment cancelled', data: await svc.cancelAppointment(req.user.user_id, req.params.id) }); }
  catch (e) { next(e); }
};

const getSessionAppointments = async (req, res, next) => {
  try { res.json({ data: await svc.getSessionAppointments(req.params.sessionId) }); }
  catch (e) { next(e); }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw { statusCode: 400, message: 'Status is required' };
    res.json({ message: 'Appointment status updated', data: await svc.updateAppointmentStatus(req.user.user_id, req.params.id, status) });
  } catch (e) { next(e); }
};

module.exports = { bookAppointment, getAppointmentById, cancelAppointment, getSessionAppointments, updateAppointmentStatus };
