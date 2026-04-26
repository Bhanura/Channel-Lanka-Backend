/**
 * services/sessions/sessions.controller.js + routes.js
 */
const svc = require('./sessions.service');

const createSession = async (req, res, next) => {
  try { res.status(201).json({ message: 'Session created', data: await svc.createSession(req.user.user_id, req.params.centerId, req.body) }); }
  catch (e) { next(e); }
};
const getCenterSessions = async (req, res, next) => {
  try { res.json({ data: await svc.getCenterSessions(req.params.centerId) }); }
  catch (e) { next(e); }
};
const getSessionDetail = async (req, res, next) => {
  try { res.json({ data: await svc.getSessionDetail(req.params.sessionId) }); }
  catch (e) { next(e); }
};
const updateSession = async (req, res, next) => {
  try { res.json({ message: 'Session updated', data: await svc.updateSession(req.user.user_id, req.params.centerId, req.params.sessionId, req.body) }); }
  catch (e) { next(e); }
};
const getAvailableSessions = async (req, res, next) => {
  try { res.json({ data: await svc.getAvailableSessions(req.query) }); }
  catch (e) { next(e); }
};
const cancelSessionByDoctor = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw { statusCode: 400, message: 'Cancellation reason is required' };
    res.json({ message: 'Session cancelled successfully', data: await svc.cancelSessionByDoctor(req.user.user_id, req.params.sessionId, reason) });
  } catch (e) { next(e); }
};

module.exports = { createSession, getCenterSessions, getSessionDetail, updateSession, getAvailableSessions, cancelSessionByDoctor };
