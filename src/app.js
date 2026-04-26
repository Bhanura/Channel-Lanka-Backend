/**
 * src/app.js — Channel Lanka Express Application
 * Mounts all service routers under /api/v1/
 * Each service is independently maintained in its own services/ subdirectory.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { errorHandler } = require('./middleware/error.middleware');

// ---- Service Routers ----
const authRoutes         = require('./services/auth/auth.routes');
const patientsRoutes     = require('./services/patients/patients.routes');
const doctorsRoutes      = require('./services/doctors/doctors.routes');
const centersRoutes      = require('./services/centers/centers.routes');
const sessionsRoutes     = require('./services/sessions/sessions.routes');
const appointmentsRoutes = require('./services/appointments/appointments.routes');
const paymentsRoutes     = require('./services/payments/payments.routes');
const notificationsRoutes = require('./services/notifications/notifications.routes');
const messagesRoutes     = require('./services/messages/messages.routes');
const adminRoutes        = require('./services/admin/admin.routes');
const searchRoutes       = require('./services/search/search.routes');

const app = express();

// ---- Security Middleware ----
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ---- Rate Limiting ----
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ---- Body Parsing ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Request Logging ----
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Channel Lanka API', timestamp: new Date().toISOString() });
});

// ---- Mount Service Routers ----
app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/patients',      patientsRoutes);
app.use('/api/v1/doctors',       doctorsRoutes);
app.use('/api/v1/centers',       centersRoutes);
app.use('/api/v1/sessions',      sessionsRoutes);
app.use('/api/v1/appointments',  appointmentsRoutes);
app.use('/api/v1/payments',      paymentsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/messages',      messagesRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/search',        searchRoutes);

// ---- 404 Handler ----
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ---- Global Error Handler (must be last) ----
app.use(errorHandler);

module.exports = app;
