const svc = require('./notifications.service');

const getNotifications = async (req, res, next) => {
  try { res.json({ data: await svc.getNotifications(req.user.user_id) }); }
  catch (e) { next(e); }
};
const markAsRead = async (req, res, next) => {
  try { res.json({ data: await svc.markAsRead(req.user.user_id, req.params.id) }); }
  catch (e) { next(e); }
};
const markAllAsRead = async (req, res, next) => {
  try { res.json({ data: await svc.markAllAsRead(req.user.user_id) }); }
  catch (e) { next(e); }
};
const getUnreadCount = async (req, res, next) => {
  try { res.json({ data: await svc.getUnreadCount(req.user.user_id) }); }
  catch (e) { next(e); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
