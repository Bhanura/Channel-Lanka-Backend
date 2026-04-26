/**
 * services/doctors/doctors.routes.js
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./doctors.controller');

// Public — view doctor profile
router.get('/:id/public', c.getDoctorById);

// Protected — doctor-only routes
router.use(requireAuth, requireRole('doctor'));
router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.get('/sessions', c.getSessions);
router.get('/stats', c.getStats);
router.get('/centers', c.getRegisteredCenters);
router.post('/requests/send', c.sendCenterRequest);
router.get('/requests', c.getRequests);
router.patch('/requests/:requestId/respond', c.respondToRequest);

module.exports = router;
