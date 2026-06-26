const http = require('http');
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
});
