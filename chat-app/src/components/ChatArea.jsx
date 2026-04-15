import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble.jsx';
import EmptyState from './EmptyState.jsx';

export default function ChatArea({
  messages,
  currentUser,
  onSend,
  roomTitle,
  participantCount,
  status,
  error,
  isPrivateRoom,
  selectedUser,
  hasSelectedPrivateUser
}) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = draft.trim();

    if (!trimmed || (isPrivateRoom && !hasSelectedPrivateUser)) {
      return;
    }

    onSend(trimmed);
    setDraft('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  const emptyTitle =
    isPrivateRoom && !hasSelectedPrivateUser
      ? 'Choose a teammate to start a private conversation.'
      : 'No messages yet. Start the conversation.';

  const canSend = Boolean(draft.trim()) && (!isPrivateRoom || hasSelectedPrivateUser);

  return (
    <section className="chat-area">
      <div className="chat-area__topbar">
        <div>
          <h2>{roomTitle}</h2>
          <p>
            {participantCount} participant{participantCount === 1 ? '' : 's'}
            {selectedUser ? ` | chatting with ${selectedUser.name || selectedUser.username || 'Unknown user'}` : ''}
          </p>
        </div>
        <span className="chat-area__status">{status}</span>
      </div>

      {error ? <div className="chat-area__error">{error}</div> : null}

      <div className="chat-area__messages" ref={listRef}>
        {messages.length === 0 ? (
          <EmptyState message={emptyTitle} />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={
                message.id ||
                `${message.user_id}-${message.to_user_id}-${message.created_at}-${message.text}`
              }
              message={message}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      <form className="chat-area__composer" onSubmit={handleSubmit}>
        <textarea
          className="chat-area__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isPrivateRoom
              ? hasSelectedPrivateUser
                ? 'Write a direct message'
                : 'Select a user to start a private conversation'
              : 'Write a message to the room'
          }
          rows="1"
        />
        <button type="submit" className="chat-area__send" disabled={!canSend}>
          Send
        </button>
      </form>
    </section>
  );
}
