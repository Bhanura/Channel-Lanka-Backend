const svc = require('./search.service');
const express = require('express');
const router = express.Router();

// All search routes are public
router.get('/doctors', async (req, res, next) => {
  try { res.json({ data: await svc.searchDoctors(req.query) }); } catch (e) { next(e); }
});
router.get('/centers', async (req, res, next) => {
  try { res.json({ data: await svc.searchCenters(req.query) }); } catch (e) { next(e); }
});
router.get('/specializations', async (req, res, next) => {
  try { res.json({ data: await svc.getSpecializations() }); } catch (e) { next(e); }
});

module.exports = router;
