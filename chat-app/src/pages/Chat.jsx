import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ChatArea from '../components/ChatArea.jsx';
import {
  createChatSocket,
  requestPrivateHistory,
  sendGlobalMessage,
  sendPrivateMessage
} from '../services/socket.js';
import { clearTokens, getAccessToken } from '../utils/storage.js';

function parseTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const encoded = token.split('.')[1];
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function resolveCurrentUser(payload) {
  const id = payload?.sub || payload?.id || payload?.user_id || null;
  const email = payload?.email || '';
  const name =
    payload?.name ||
    payload?.user_name ||
    payload?.username ||
    email ||
    'Unknown user';

  return { id, name, email };
}

export default function Chat() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const tokenPayload = useMemo(() => parseTokenPayload(token), [token]);
  const currentUser = useMemo(() => resolveCurrentUser(tokenPayload), [tokenPayload]);

  const [globalMessages, setGlobalMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [activeRoom, setActiveRoom] = useState({ type: 'global', targetUserId: '' });
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState('');
  const [socketInstance, setSocketInstance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeUser =
    onlineUsers.find((user) => String(user.userId) === String(activeRoom.targetUserId)) || null;
  const activeMessages =
    activeRoom.type === 'private' && activeRoom.targetUserId
      ? privateMessages[activeRoom.targetUserId] || []
      : activeRoom.type === 'global'
        ? globalMessages
        : [];

  const rooms = [
    { id: 'global', label: 'Global chat', subtitle: 'Everyone', type: 'global' },
    { id: 'private', label: 'Private', subtitle: 'Direct messages', type: 'private' }
  ];

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return undefined;
    }

    const socket = createChatSocket(token);
    setSocketInstance(socket);

    socket.on('connect', () => {
      setStatus('Connected');
      setError('');
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
    });

    socket.on('connect_error', (connectionError) => {
      setStatus('Connection failed');
      setError(connectionError.message || 'Unable to connect to chat');
    });

    socket.on('message-history', (history) => {
      setGlobalMessages(Array.isArray(history) ? history : []);
    });

    socket.on('users:online', (users) => {
      const normalizedUsers = Array.isArray(users) ? users : [];
      setOnlineUsers(normalizedUsers.filter((user) => String(user.userId) !== String(currentUser.id)));
    });

    socket.on('new-message', (message) => {
      setGlobalMessages((current) => [...current, message]);
    });

    socket.on('private-message-history', (payload) => {
      const otherUserId = payload?.userId;
      const history = Array.isArray(payload?.messages) ? payload.messages : [];

      if (!otherUserId) {
        return;
      }

      setPrivateMessages((current) => ({
        ...current,
        [otherUserId]: history
      }));
    });

    socket.on('private-message', (message) => {
      const otherUserId =
        String(message.user_id) === String(currentUser.id) ? message.to_user_id : message.user_id;

      if (!otherUserId) {
        return;
      }

      setPrivateMessages((current) => ({
        ...current,
        [otherUserId]: [...(current[otherUserId] || []), message]
      }));
    });

    socket.on('chat-error', (payload) => {
      setError(payload?.message || 'Chat error');
    });

    return () => {
      socket.disconnect();
      setSocketInstance(null);
    };
  }, [currentUser.id, navigate, token]);

  useEffect(() => {
    if (
      activeRoom.type !== 'private' ||
      !activeRoom.targetUserId ||
      !socketInstance
    ) {
      return;
    }

    requestPrivateHistory(socketInstance, activeRoom.targetUserId);
  }, [activeRoom, socketInstance]);

  useEffect(() => {
    if (
      activeRoom.type === 'private' &&
      activeRoom.targetUserId &&
      !onlineUsers.some((user) => String(user.userId) === String(activeRoom.targetUserId))
    ) {
      setActiveRoom({ type: 'private', targetUserId: '' });
    }
  }, [activeRoom, onlineUsers]);

  function handleLogout() {
    clearTokens();
    navigate('/login', { replace: true });
  }

  function handleRoomSelect(roomType, userId = '') {
    if (roomType === 'global') {
      setActiveRoom({ type: 'global', targetUserId: '' });
      setSidebarOpen(false);
      return;
    }

    setActiveRoom({ type: 'private', targetUserId: userId });
    setSidebarOpen(false);
  }

  function handleSend(text) {
    if (!socketInstance) {
      return;
    }

    if (activeRoom.type === 'private' && activeRoom.targetUserId) {
      sendPrivateMessage(socketInstance, activeRoom.targetUserId, text);
      return;
    }

    sendGlobalMessage(socketInstance, text);
  }

  const participantCount =
    activeRoom.type === 'global'
      ? onlineUsers.length + 1
      : activeRoom.targetUserId
        ? activeUser
          ? 2
          : 1
        : 0;

  const roomTitle =
    activeRoom.type === 'global'
      ? 'Global chat'
      : activeRoom.targetUserId
        ? activeUser?.name || activeUser?.username || 'Direct message'
        : 'Private messages';

  return (
    <div className="chat-page">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen((current) => !current)}
      />
      <div className="chat-page__body">
        <Sidebar
          rooms={rooms}
          users={onlineUsers}
          currentUser={currentUser}
          activeRoom={activeRoom}
          onRoomSelect={handleRoomSelect}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <ChatArea
          messages={activeMessages}
          currentUser={currentUser}
          onSend={handleSend}
          roomTitle={roomTitle}
          participantCount={participantCount}
          status={status}
          error={error}
          isPrivateRoom={activeRoom.type === 'private'}
          selectedUser={activeUser}
          hasSelectedPrivateUser={Boolean(activeRoom.targetUserId)}
        />
      </div>
    </div>
  );
}
