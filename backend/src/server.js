const http = require('http');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is missing. Server cannot start.');
  process.exit(1);
}

const app = require('./app');
const socketConfig = require('./config/socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
socketConfig.init(server);

// Start listening
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Medical Store Backend Server is running!`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Client Access Allowed: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`===============================================`);

  // Self-ping every 14 minutes to prevent Render free tier cold starts
  const selfPingUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfPingUrl) {
    setInterval(() => {
      https.get(`${selfPingUrl}/healthz`, (res) => {
        console.log(`[Keep-Alive] Self-ping status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.warn(`[Keep-Alive] Self-ping failed: ${err.message}`);
      });
    }, 14 * 60 * 1000); // 14 minutes
    console.log(`[Keep-Alive] Self-ping enabled for: ${selfPingUrl}`);
  }
});
