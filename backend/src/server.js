const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

const startServer = async () => {
  const server = app.listen(config.port, () => {
    console.log(`[TruthLens Backend] Running on port ${config.port} in ${config.nodeEnv} mode`);
  });

  // Connect to MongoDB
  connectDB().catch(err => {
    console.error('[MongoDB Error]: Could not establish initial connection', err.message);
  });

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = startServer;

