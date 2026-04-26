/**
 * services/auth/auth.routes.js
 * Express router for authentication endpoints.
 * All routes are public (no auth required).
 */
const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// POST /api/v1/auth/register/patient
router.post('/register/patient', authController.registerPatient);

// POST /api/v1/auth/register/doctor
router.post('/register/doctor', authController.registerDoctor);

// POST /api/v1/auth/register/center
router.post('/register/center', authController.registerCenterAdmin);

// POST /api/v1/auth/login
router.post('/login', authController.login);

module.exports = router;
