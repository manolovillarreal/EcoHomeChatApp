const jwt = require('jsonwebtoken');

const { config } = require('./config');

function extractBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    return null;
  }

  const [scheme, token] = headerValue.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

function extractSocketToken(socket) {
  return socket.handshake.auth && socket.handshake.auth.token;
}

function verifyToken(token) {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  return jwt.verify(token, config.jwtSecret);
}

function verifySocketToken(socket) {
  return verifyToken(extractSocketToken(socket));
}

function authenticateHttpRequest(req, res, next) {
  try {
    req.user = verifyToken(extractBearerToken(req.headers.authorization));
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = {
  authenticateHttpRequest,
  extractBearerToken,
  verifyToken,
  verifySocketToken
};
