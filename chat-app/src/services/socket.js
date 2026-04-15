import { io } from 'socket.io-client';

const CHAT_URL = import.meta.env.VITE_CHAT_URL || window.location.origin;

export function createChatSocket(token) {
  return io(CHAT_URL, {
    transports: ['websocket'],
    auth: { token }
  });
}

export function requestPrivateHistory(socket, userId) {
  socket.emit('private-history', { userId });
}

export function sendGlobalMessage(socket, text) {
  socket.emit('new-message', { text });
}

export function sendPrivateMessage(socket, toUserId, text) {
  socket.emit('private-message', { toUserId, text });
}
