const express = require('express');
const {
  getServices,
  getServiceMetrics,
  createService,
  updateService,
  deleteService
} = require('../controllers/services');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply Authentication requirement globally to all service routes
router.use(protect);

// Publicly read lists and metrics for authenticated users
router.get('/', getServices);
router.get('/:id/metrics', getServiceMetrics);

// Writing actions restricted to Admin/Responder
router.post('/', authorize('Admin', 'Responder'), createService);
router.put('/:id', authorize('Admin', 'Responder'), updateService);

// Deletion restricted strictly to Admin
router.delete('/:id', authorize('Admin'), deleteService);

module.exports = router;
