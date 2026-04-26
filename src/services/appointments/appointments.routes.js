/**
 * services/appointments/appointments.routes.js
 */
const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./appointments.controller');

// Guest or logged-in patient can book
router.post('/book', optionalAuth, c.bookAppointment);

// Authenticated routes
router.get('/:id', requireAuth, c.getAppointmentById);
router.patch('/:id/cancel', requireAuth, requireRole('patient'), c.cancelAppointment);

// Center admin — view session appointments
router.get('/session/:sessionId', requireAuth, requireRole('center_admin'), c.getSessionAppointments);

module.exports = router;
