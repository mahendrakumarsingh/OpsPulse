const express = require('express');
const {
  getIncidents,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  getIncidentStats
} = require('../controllers/incidents');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply Authentication Requirement globally to all incident routes
router.use(protect);

// Incident logs and stats read operations
router.get('/', getIncidents);
router.get('/stats', getIncidentStats);

// Incident lifecycle modifications (restricted to Admin & Responder)
router.post('/', authorize('Admin', 'Responder'), createIncident);
router.put('/:id/acknowledge', authorize('Admin', 'Responder'), acknowledgeIncident);
router.put('/:id/resolve', authorize('Admin', 'Responder'), resolveIncident);

module.exports = router;
