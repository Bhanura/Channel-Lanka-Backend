const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth.middleware');
const c = require('./messages.controller');

router.use(requireAuth);
router.get('/threads', c.getMyThreads);
router.get('/thread', c.getThread); // ?doctorId=&centerId=
router.post('/send', c.sendMessage);
router.patch('/thread/:centerId/read', c.markThreadRead);

module.exports = router;
