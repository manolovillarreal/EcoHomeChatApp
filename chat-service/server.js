require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { config } = require('./src/config');
const { pool } = require('./src/db');
const { registerChatSocket } = require('./src/socket');

const app = express();
const publicDir = path.join(__dirname, 'public');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get(['/', '/login', '/chat'], (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

registerChatSocket(io);

server.listen(config.port, () => {
  console.log(`chat-service listening on port ${config.port}`);
});

const shutdown = async () => {
  try {
    await pool.end();
  } finally {
    server.close(() => process.exit(0));
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
