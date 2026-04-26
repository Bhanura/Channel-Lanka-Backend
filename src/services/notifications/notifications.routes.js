const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const c = require('./notifications.controller');

router.use(requireAuth);
router.get('/', c.getNotifications);
router.get('/unread-count', c.getUnreadCount);
router.patch('/:id/read', c.markAsRead);
router.patch('/read-all', c.markAllAsRead);

module.exports = router;
