/**
 * services/doctors/doctors.controller.js
 */
const doctorsService = require('./doctors.service');

const getProfile = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getProfile(req.user.user_id) }); }
  catch (err) { next(err); }
};

const getDoctorById = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getDoctorById(req.params.id) }); }
  catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try { res.json({ message: 'Profile updated', data: await doctorsService.updateProfile(req.user.user_id, req.body) }); }
  catch (err) { next(err); }
};

const getSessions = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getSessions(req.user.user_id) }); }
  catch (err) { next(err); }
};

const getRegisteredCenters = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getRegisteredCenters(req.user.user_id) }); }
  catch (err) { next(err); }
};

const sendCenterRequest = async (req, res, next) => {
  try { res.status(201).json({ message: 'Request sent', data: await doctorsService.sendCenterRequest(req.user.user_id, req.body) }); }
  catch (err) { next(err); }
};

const getRequests = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getRequests(req.user.user_id) }); }
  catch (err) { next(err); }
};

const respondToRequest = async (req, res, next) => {
  try { res.json({ message: 'Response recorded', data: await doctorsService.respondToRequest(req.user.user_id, req.params.requestId, req.body.status) }); }
  catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try { res.json({ data: await doctorsService.getStats(req.user.user_id) }); }
  catch (err) { next(err); }
};

module.exports = { getProfile, getDoctorById, updateProfile, getSessions, getRegisteredCenters, sendCenterRequest, getRequests, respondToRequest, getStats };
