const express = require('express');

const handleHealthCheck = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'cold-call-copilot-api'
  });
};

function createHealthRouter() {
  const router = express.Router();
  router.get('/', handleHealthCheck);
  router.get('/health', handleHealthCheck);
  return router;
}

module.exports = createHealthRouter;
