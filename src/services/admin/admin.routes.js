const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./admin.controller');

router.use(requireAuth, requireRole('platform_admin'));

// Doctors
router.get('/doctors', c.getAllDoctors);
router.patch('/doctors/:id/verify', c.verifyDoctor);
router.post('/doctors', c.createDoctorAccount);
router.delete('/doctors/:id', c.deleteDoctor);

// Centers
router.get('/centers', c.getAllCenters);
router.patch('/centers/:id/verify', c.verifyCenter);
router.delete('/centers/:id', c.deleteCenter);

// Patients & Appointments
router.get('/patients', c.getAllPatients);
router.get('/appointments', c.getAllAppointments);

// Admins
router.get('/admins', c.getAllAdmins);
router.post('/admins', c.addAdmin);

// Payment config
router.get('/payment-config', c.getPaymentConfig);
router.post('/payment-config', c.updatePaymentConfig);

// System
router.get('/logs', c.getSystemLogs);
router.get('/stats', c.getSystemStats);

module.exports = router;
