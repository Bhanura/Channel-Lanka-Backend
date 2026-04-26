/**
 * services/patients/patients.routes.js
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./patients.controller');

router.use(requireAuth, requireRole('patient'));

router.get('/profile', c.getProfile);
router.put('/profile', c.updateProfile);
router.get('/appointments', c.getAppointments);
router.get('/stats', c.getStats);
router.post('/rate/doctor', c.rateDoctor);
router.post('/rate/center', c.rateCenter);

module.exports = router;
