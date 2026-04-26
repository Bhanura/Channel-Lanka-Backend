const svc = require('./payments.service');

const getBreakdown = async (req, res, next) => {
  try { res.json({ data: await svc.getPaymentBreakdown(req.params.sessionId) }); }
  catch (e) { next(e); }
};
const processPayment = async (req, res, next) => {
  try { res.status(201).json({ message: 'Payment processed', data: await svc.processPayment(req.body) }); }
  catch (e) { next(e); }
};
const getAllPayments = async (req, res, next) => {
  try { res.json({ data: await svc.getAllPayments(req.query) }); }
  catch (e) { next(e); }
};

module.exports = { getBreakdown, processPayment, getAllPayments };
