require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/truthlens',
  jwtSecret: process.env.JWT_SECRET || 'truthlens_default_dev_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceSecret: process.env.AI_SERVICE_SECRET || 'internal_truthlens_ai_microservice_secret_2026',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};

