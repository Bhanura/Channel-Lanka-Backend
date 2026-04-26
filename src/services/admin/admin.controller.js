const svc = require('./admin.service');

const wrapAsync = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (e) { next(e); }
};

module.exports = {
  getAllDoctors: wrapAsync(async (req, res) => res.json({ data: await svc.getAllDoctors(req.query) })),
  verifyDoctor: wrapAsync(async (req, res) => res.json({ data: await svc.verifyDoctor(req.user.user_id, req.params.id, req.body) })),
  createDoctorAccount: wrapAsync(async (req, res) => res.status(201).json({ data: await svc.createDoctorAccount(req.user.user_id, req.body) })),
  deleteDoctor: wrapAsync(async (req, res) => res.json({ data: await svc.deleteDoctor(req.user.user_id, req.params.id) })),
  getAllCenters: wrapAsync(async (req, res) => res.json({ data: await svc.getAllCenters(req.query) })),
  verifyCenter: wrapAsync(async (req, res) => res.json({ data: await svc.verifyCenter(req.user.user_id, req.params.id, req.body) })),
  deleteCenter: wrapAsync(async (req, res) => res.json({ data: await svc.deleteCenter(req.user.user_id, req.params.id) })),
  getAllPatients: wrapAsync(async (req, res) => res.json({ data: await svc.getAllPatients(req.query) })),
  getAllAppointments: wrapAsync(async (req, res) => res.json({ data: await svc.getAllAppointments(req.query) })),
  getAllAdmins: wrapAsync(async (req, res) => res.json({ data: await svc.getAllAdmins() })),
  addAdmin: wrapAsync(async (req, res) => res.status(201).json({ data: await svc.addAdmin(req.user.user_id, req.body) })),
  getPaymentConfig: wrapAsync(async (req, res) => res.json({ data: await svc.getPaymentConfig() })),
  updatePaymentConfig: wrapAsync(async (req, res) => res.json({ data: await svc.updatePaymentConfig(req.user.user_id, req.body) })),
  getSystemLogs: wrapAsync(async (req, res) => res.json({ data: await svc.getSystemLogs(req.query) })),
  getSystemStats: wrapAsync(async (req, res) => res.json({ data: await svc.getSystemStats() })),
};
