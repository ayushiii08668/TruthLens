const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const aiService = require('./services/aiService');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Allow Swagger UI inline assets
}));

// CORS Configuration with Multi-Origin and Vercel Deployment Support
const allowedOrigins = (config.clientUrl || '')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow configured origins or wildcard
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Support all Vercel production and preview deployment URLs
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not permitted by CORS policy`));
  },
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
  app.use('/api', apiLimiter);
}

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'TruthLens API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Root & Health Check Endpoints
app.get(['/health', '/api/health'], async (req, res) => {
  const aiHealth = await aiService.checkHealth();
  res.status(200).json({
    status: 'ok',
    service: 'truthlens-backend',
    aiServiceUrl: config.aiServiceUrl,
    aiServiceConnected: aiHealth.status === 'ok' || aiHealth.status === 'operational',
    aiServiceStatus: aiHealth,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Welcome to TruthLens Main API',
    tagline: "Don't Just Believe It. Verify It.",
    documentation: '/api/docs',
    version: '1.0.0'
  });
});

// Mount All Domain Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

module.exports = app;
