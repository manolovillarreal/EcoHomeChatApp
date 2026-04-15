const jwt = require('jsonwebtoken');

const { config } = require('./config');

function extractSocketToken(socket) {
  return socket.handshake.auth && socket.handshake.auth.token;
}

function verifySocketToken(socket) {
  const token = extractSocketToken(socket);

  if (!token) {
    throw new Error('Authentication token is required');
  }

  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  verifySocketToken
};
