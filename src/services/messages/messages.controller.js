const svc = require('./messages.service');

const getThread = async (req, res, next) => {
  try { res.json({ data: await svc.getThread(req.user.user_id, req.query) }); }
  catch (e) { next(e); }
};
const sendMessage = async (req, res, next) => {
  try { res.status(201).json({ data: await svc.sendMessage(req.user.user_id, req.body) }); }
  catch (e) { next(e); }
};
const getMyThreads = async (req, res, next) => {
  try { res.json({ data: await svc.getMyThreads(req.user.user_id) }); }
  catch (e) { next(e); }
};
const markThreadRead = async (req, res, next) => {
  try { res.json({ data: await svc.markThreadRead(req.user.user_id, req.params.centerId) }); }
  catch (e) { next(e); }
};

module.exports = { getThread, sendMessage, getMyThreads, markThreadRead };
