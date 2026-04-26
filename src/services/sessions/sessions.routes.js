/**
 * services/sessions/sessions.routes.js
 */
const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');
const c = require('./sessions.controller');

// Public
router.get('/available', c.getAvailableSessions);
router.get('/:sessionId/detail', c.getSessionDetail);

// Protected — center admin
router.get('/center/:centerId', requireAuth, requireRole('center_admin'), c.getCenterSessions);
router.post('/center/:centerId', requireAuth, requireRole('center_admin'), c.createSession);
router.patch('/center/:centerId/:sessionId', requireAuth, requireRole('center_admin'), c.updateSession);

module.exports = router;
