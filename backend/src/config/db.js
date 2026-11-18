const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./index');

// Set public DNS servers for resolving MongoDB Atlas SRV records reliably
if (config.mongoUri && config.mongoUri.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {
    console.warn('[DNS Warning]: Could not set custom DNS servers', dnsErr.message);
  }
}

const connectDB = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
      });
      console.log(`[MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (error) {
      console.error(`[MongoDB Connection Error (attempt ${attempt}/${retries})]: ${error.message}`);
      if (attempt === retries) {
        if (config.nodeEnv === 'production') {
          process.exit(1);
        }
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
};

module.exports = connectDB;

