/**
 * services/patients/patients.controller.js
 */
const patientsService = require('./patients.service');

const getProfile = async (req, res, next) => {
  try {
    const data = await patientsService.getProfile(req.user.user_id);
    res.json({ data });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await patientsService.updateProfile(req.user.user_id, req.body);
    res.json({ message: 'Profile updated', data });
  } catch (err) { next(err); }
};

const getAppointments = async (req, res, next) => {
  try {
    const data = await patientsService.getAppointments(req.user.user_id);
    res.json({ data });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const data = await patientsService.getStats(req.user.user_id);
    res.json({ data });
  } catch (err) { next(err); }
};

const rateDoctor = async (req, res, next) => {
  try {
    const data = await patientsService.rateDoctor(req.user.user_id, req.body);
    res.status(201).json({ message: 'Rating submitted', data });
  } catch (err) { next(err); }
};

const rateCenter = async (req, res, next) => {
  try {
    const data = await patientsService.rateCenter(req.user.user_id, req.body);
    res.status(201).json({ message: 'Rating submitted', data });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, getAppointments, getStats, rateDoctor, rateCenter };
