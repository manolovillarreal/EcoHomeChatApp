const { verifySocketToken } = require('./auth');

const {
  createMessage,
  getRecentMessages,
  getRecentPrivateMessages,
  MAX_HISTORY_MESSAGES,
  MESSAGE_TYPES,
  resolveUserId,
  resolveUserNameSnapshot
} = require('./services/messageService');

const connectedUsers = new Map();

function addConnectedUser(userId, username, socketId) {
  const entry = connectedUsers.get(userId) || {
    userId,
    username: username || null,
    socketIds: new Set()
  };

  if (username && !entry.username) {
    entry.username = username;
  }

  entry.socketIds.add(socketId);
  connectedUsers.set(userId, entry);
}

function removeConnectedUser(userId, socketId) {
  const entry = connectedUsers.get(userId);

  if (!entry) {
    return;
  }

  entry.socketIds.delete(socketId);

  if (entry.socketIds.size === 0) {
    connectedUsers.delete(userId);
    return;
  }

  connectedUsers.set(userId, entry);
}

function getOnlineUsersList() {
  return Array.from(connectedUsers.values()).map(({ userId, username }) => ({
    userId,
    username
  }));
}

function emitOnlineUsers(io) {
  io.emit('users:online', getOnlineUsersList());
}

function emitToUserSockets(io, userId, eventName, payload, sentSocketIds = new Set()) {
  const entry = connectedUsers.get(userId);

  if (!entry) {
    return;
  }

  for (const socketId of entry.socketIds) {
    if (sentSocketIds.has(socketId)) {
      continue;
    }

    io.to(socketId).emit(eventName, payload);
    sentSocketIds.add(socketId);
  }
}

function validateMessageText(text, socket, eventName = 'chat-error') {
  if (!text) {
    socket.emit(eventName, { message: 'Message text is required' });
    return false;
  }

  if (text.length > 1000) {
    socket.emit(eventName, { message: 'Message text is too long' });
    return false;
  }

  return true;
}

function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      socket.user = verifySocketToken(socket);
      return next();
    } catch (_error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = resolveUserId(socket.user);
    const username = resolveUserNameSnapshot(socket.user);

    addConnectedUser(userId, username, socket.id);
    emitOnlineUsers(io);

    try {
      const messages = await getRecentMessages(MAX_HISTORY_MESSAGES);
      socket.emit('message-history', messages);
      socket.emit('users:online', getOnlineUsersList());
    } catch (error) {
      socket.emit('chat-error', { message: 'Failed to load message history' });
      console.error('Failed to load message history', error);
    }

    socket.on('new-message', async (payload) => {
      try {
        if (!socket.user) {
          socket.emit('chat-error', { message: 'Unauthorized' });
          return;
        }

        const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

        if (!validateMessageText(text, socket)) {
          return;
        }

        const message = await createMessage({
          userId,
          text,
          userNameSnapshot: username,
          type: MESSAGE_TYPES.GLOBAL
        });

        io.emit('new-message', message);
      } catch (error) {
        socket.emit('chat-error', { message: 'Failed to save message' });
        console.error('Failed to save message', error);
      }
    });

    socket.on('private-message', async (payload) => {
      try {
        if (!socket.user) {
          socket.emit('chat-error', { message: 'Unauthorized' });
          return;
        }

        const toUserId = typeof payload?.toUserId === 'string' ? payload.toUserId.trim() : '';
        const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

        if (!toUserId) {
          socket.emit('chat-error', { message: 'Recipient user id is required' });
          return;
        }

        if (!validateMessageText(text, socket)) {
          return;
        }

        const message = await createMessage({
          userId,
          toUserId,
          text,
          userNameSnapshot: username,
          type: MESSAGE_TYPES.PRIVATE
        });

        const deliveredSocketIds = new Set();
        emitToUserSockets(io, userId, 'private-message', message, deliveredSocketIds);
        emitToUserSockets(io, toUserId, 'private-message', message, deliveredSocketIds);
      } catch (error) {
        socket.emit('chat-error', { message: 'Failed to save private message' });
        console.error('Failed to save private message', error);
      }
    });

    socket.on('private-history', async (payload) => {
      try {
        if (!socket.user) {
          socket.emit('chat-error', { message: 'Unauthorized' });
          return;
        }

        const otherUserId = typeof payload?.userId === 'string' ? payload.userId.trim() : '';

        if (!otherUserId) {
          socket.emit('chat-error', { message: 'Target user id is required' });
          return;
        }

        const messages = await getRecentPrivateMessages({
          userId,
          otherUserId,
          limit: MAX_HISTORY_MESSAGES
        });

        socket.emit('private-message-history', {
          userId: otherUserId,
          messages
        });
      } catch (error) {
        socket.emit('chat-error', { message: 'Failed to load private message history' });
        console.error('Failed to load private message history', error);
      }
    });

    socket.on('disconnect', () => {
      removeConnectedUser(userId, socket.id);
      emitOnlineUsers(io);
    });
  });
}

module.exports = {
  registerChatSocket
};
