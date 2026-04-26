/**
 * services/centers/centers.controller.js
 */
const svc = require('./centers.service');

const getMyCenters = async (req, res, next) => {
  try { res.json({ data: await svc.getMyCenters(req.user.user_id) }); } catch (e) { next(e); }
};
const getCenterById = async (req, res, next) => {
  try { res.json({ data: await svc.getCenterById(req.params.id) }); } catch (e) { next(e); }
};
const updateCenter = async (req, res, next) => {
  try { res.json({ message: 'Center updated', data: await svc.updateCenter(req.user.user_id, req.params.id, req.body) }); } catch (e) { next(e); }
};
const getRooms = async (req, res, next) => {
  try { res.json({ data: await svc.getRooms(req.params.centerId) }); } catch (e) { next(e); }
};
const createRoom = async (req, res, next) => {
  try { res.status(201).json({ message: 'Room created', data: await svc.createRoom(req.user.user_id, req.params.centerId, req.body) }); } catch (e) { next(e); }
};
const getRegisteredDoctors = async (req, res, next) => {
  try { res.json({ data: await svc.getRegisteredDoctors(req.params.centerId) }); } catch (e) { next(e); }
};
const sendDoctorRequest = async (req, res, next) => {
  try { res.status(201).json({ message: 'Request sent', data: await svc.sendDoctorRequest(req.user.user_id, req.params.centerId, req.body) }); } catch (e) { next(e); }
};
const getDoctorRequests = async (req, res, next) => {
  try { res.json({ data: await svc.getDoctorRequests(req.params.centerId) }); } catch (e) { next(e); }
};
const respondToRequest = async (req, res, next) => {
  try { res.json({ message: 'Response recorded', data: await svc.respondToRequest(req.user.user_id, req.params.centerId, req.params.requestId, req.body.status) }); } catch (e) { next(e); }
};
const getStaff = async (req, res, next) => {
  try { res.json({ data: await svc.getStaff(req.user.user_id, req.params.centerId) }); } catch (e) { next(e); }
};
const addStaff = async (req, res, next) => {
  try { res.status(201).json({ message: 'Staff added', data: await svc.addStaff(req.user.user_id, req.params.centerId, req.body) }); } catch (e) { next(e); }
};
const getPayments = async (req, res, next) => {
  try { res.json({ data: await svc.getPayments(req.params.centerId) }); } catch (e) { next(e); }
};
const getStats = async (req, res, next) => {
  try { res.json({ data: await svc.getStats(req.user.user_id, req.params.centerId) }); } catch (e) { next(e); }
};

module.exports = { getMyCenters, getCenterById, updateCenter, getRooms, createRoom, getRegisteredDoctors, sendDoctorRequest, getDoctorRequests, respondToRequest, getStaff, addStaff, getPayments, getStats };
