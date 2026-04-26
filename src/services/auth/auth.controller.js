/**
 * services/auth/auth.controller.js
 * HTTP request handlers for authentication routes.
 * Delegates business logic to auth.service.js
 */
const authService = require('./auth.service');

/** POST /api/v1/auth/register/patient */
const registerPatient = async (req, res, next) => {
  try {
    const result = await authService.registerPatient(req.body);
    res.status(201).json({ message: 'Patient registered successfully', data: result });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/auth/register/doctor */
const registerDoctor = async (req, res, next) => {
  try {
    const result = await authService.registerDoctor(req.body);
    res.status(201).json({
      message: 'Doctor registered successfully. Awaiting admin verification.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/auth/register/center */
const registerCenterAdmin = async (req, res, next) => {
  try {
    const result = await authService.registerCenterAdmin(req.body);
    res.status(201).json({
      message: 'Center registered successfully. Awaiting admin verification.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/auth/login */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ message: 'Login successful', data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerPatient, registerDoctor, registerCenterAdmin, login };
