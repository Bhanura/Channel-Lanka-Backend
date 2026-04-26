const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./payments.controller');

router.get('/breakdown/:sessionId', c.getBreakdown); // Public — for booking page
router.post('/process', optionalAuth, c.processPayment); // Guest or patient
router.get('/all', requireAuth, requireRole('platform_admin'), c.getAllPayments);

module.exports = router;
