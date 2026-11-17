require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

const defaultSupabase = require('./lib/supabase');
const defaultAiService = require('./lib/ai');
const createHealthRouter = require('./routes/health');
const createCallsRouter = require('./routes/calls');
const createStagesRouter = require('./routes/stages');
const createAiRouter = require('./routes/ai');

function createApp({ supabaseClient = defaultSupabase, aiService = defaultAiService } = {}) {
  const app = express();

  app.use(cors({
    origin: (origin, callback) => {
      if (isDev || !origin) {
        return callback(null, true);
      }
      if (origin === FRONTEND_URL || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use('/api/health', createHealthRouter());
  app.use('/api/calls', createCallsRouter({ supabaseClient, aiService }));
  app.use('/api', createStagesRouter({ supabaseClient }));
  app.use('/api/ai', createAiRouter({ aiService }));

  app.get('/', (req, res) => {
    res.json({
      name: 'Cold Call Copilot API',
      status: 'running',
      health: '/api/health'
    });
  });

  app.use((req, res, next) => {
    res.status(404).json({ error: `Not Found: ${req.method} ${req.originalUrl}` });
  });

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    console.error('Unhandled server error:', { status, type: err.type || err.name || 'Error' });
    res.status(status).json({
      error: status >= 500
        ? 'Internal Server Error'
        : err.type === 'entity.parse.failed'
        ? 'Malformed JSON request'
        : 'Bad request'
    });
  });

  return app;
}

const app = createApp();

// Start the server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cold Call Copilot API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
