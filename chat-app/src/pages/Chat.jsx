import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Sidebar from '../components/Sidebar.jsx';
import ChatArea from '../components/ChatArea.jsx';
import { getConversations } from '../services/conversations.js';
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
  const [conversations, setConversations] = useState([]);
  const [privateMessages, setPrivateMessages] = useState({});
  const [activeRoom, setActiveRoom] = useState({ type: 'global', targetUserId: '' });
  const [status, setStatus] = useState('Connecting...');
  const [error, setError] = useState('');
  const [socketInstance, setSocketInstance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarUsers = useMemo(() => {
    const onlineUsersById = new Map(
      onlineUsers.map((user) => [
        String(user.userId),
        {
          userId: String(user.userId),
          username: user.username || user.name || null,
          isOnline: true
        }
      ])
    );

    const mergedUsers = conversations.map((conversation) => {
      const conversationUserId = String(conversation.userId);
      const onlineUser = onlineUsersById.get(conversationUserId);

      if (onlineUser) {
        onlineUsersById.delete(conversationUserId);
      }

      return {
        userId: conversationUserId,
        username: onlineUser?.username || conversation.username || 'Unknown user',
        name: onlineUser?.username || conversation.username || 'Unknown user',
        isOnline: Boolean(onlineUser),
        lastMessageAt: conversation.lastMessageAt || null
      };
    });

    for (const onlineUser of onlineUsersById.values()) {
      mergedUsers.push({
        userId: onlineUser.userId,
        username: onlineUser.username || 'Unknown user',
        name: onlineUser.username || 'Unknown user',
        isOnline: true,
        lastMessageAt: null
      });
    }

    return mergedUsers.sort((left, right) => {
      if (left.isOnline !== right.isOnline) {
        return left.isOnline ? -1 : 1;
      }

      const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return String(left.username).localeCompare(String(right.username));
    });
  }, [conversations, onlineUsers]);

  const activeUser =
    sidebarUsers.find((user) => String(user.userId) === String(activeRoom.targetUserId)) || null;
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

  async function loadConversations() {
    if (!token) {
      return;
    }

    try {
      const nextConversations = await getConversations(token);
      setConversations(nextConversations);
    } catch (conversationError) {
      setError(conversationError.message || 'Unable to load conversations');
    }
  }

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
      loadConversations();
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
      loadConversations();
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
    loadConversations();
  }, [token]);

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
          users={sidebarUsers}
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
