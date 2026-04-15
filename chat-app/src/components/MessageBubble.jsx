function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: 'short',
    dateStyle: 'short'
  }).format(date);
}

function resolveSender(message) {
  return message.user_name_snapshot || 'Unknown user';
}

export default function MessageBubble({ message, currentUser }) {
  const isOwnMessage = String(message.user_id) === String(currentUser.id);

  return (
    <article className={`message-bubble${isOwnMessage ? ' message-bubble--own' : ''}`}>
      <div className="message-bubble__sender">{resolveSender(message)}</div>
      <div className="message-bubble__body">{message.text}</div>
      <div className="message-bubble__time">{formatTime(message.created_at)}</div>
    </article>
  );
}
