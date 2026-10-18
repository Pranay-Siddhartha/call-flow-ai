require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health');
const callsRouter = require('./routes/calls');
const stagesRouter = require('./routes/stages');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    // In development or when no origin is present (e.g. server-to-server, curl), allow
    if (isDev || !origin) {
      return callback(null, true);
    }
    // In production, allow FRONTEND_URL or localhost origins
    if (origin === FRONTEND_URL || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request body
app.use(express.json());

// Mount routes
app.use('/api/health', healthRouter);
app.use('/api/calls', callsRouter);
app.use('/api', stagesRouter); // Paths become /api/calls/:id/stages
app.use('/api/ai', aiRouter);

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    name: 'Cold Call Copilot API',
    status: 'running',
    health: '/api/health'
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start the server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cold Call Copilot API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });
}

module.exports = app;
