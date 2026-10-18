const express = require('express');
const router = express.Router();

const handleHealthCheck = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'cold-call-copilot-api'
  });
};

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);

module.exports = router;
