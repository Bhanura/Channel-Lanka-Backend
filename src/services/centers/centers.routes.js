/**
 * services/centers/centers.routes.js
 */
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./centers.controller');

// Public
router.get('/:id/public', c.getCenterById);

// Protected — center_admin only
router.use(requireAuth, requireRole('center_admin'));
router.get('/my', c.getMyCenters);
router.put('/:id', c.updateCenter);
router.get('/:centerId/rooms', c.getRooms);
router.post('/:centerId/rooms', c.createRoom);
router.get('/:centerId/doctors', c.getRegisteredDoctors);
router.post('/:centerId/doctors/request', c.sendDoctorRequest);
router.get('/:centerId/doctors/requests', c.getDoctorRequests);
router.patch('/:centerId/doctors/requests/:requestId/respond', c.respondToRequest);
router.get('/:centerId/staff', c.getStaff);
router.post('/:centerId/staff', c.addStaff);
router.get('/:centerId/payments', c.getPayments);
router.get('/:centerId/stats', c.getStats);

module.exports = router;
