function getInitials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export default function Sidebar({ rooms, users, activeRoom, onRoomSelect, isOpen, onClose }) {
  return (
    <>
      <button
        type="button"
        className={`sidebar__backdrop${isOpen ? ' sidebar__backdrop--visible' : ''}`}
        onClick={onClose}
        aria-label="Close sidebar"
      />
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar__mobile-head">
          <strong>Navigation</strong>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        <section className="sidebar__section">
          <h2 className="sidebar__heading">Rooms</h2>
          <div className="sidebar__list">
            {rooms.map((room) => {
              const isActive =
                activeRoom.type === room.type &&
                (room.type === 'global' || !activeRoom.targetUserId);

              return (
                <button
                  key={room.id}
                  type="button"
                  className={`sidebar__channel${isActive ? ' sidebar__channel--active' : ''}`}
                  onClick={() => onRoomSelect(room.type)}
                >
                  <span className="sidebar__channel-mark">{room.type === 'global' ? '#' : '@'}</span>
                  <span>
                    <strong>{room.label}</strong>
                    <small>{room.subtitle}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="sidebar__section">
          <div className="sidebar__heading-row">
            <h2 className="sidebar__heading">Online users</h2>
            <span className="sidebar__count">{users.length}</span>
          </div>
          <div className="sidebar__list">
            {users.length === 0 ? (
              <p className="sidebar__empty">No teammates online.</p>
            ) : (
              users.map((user) => {
                const displayName = user.name || user.username || 'Unknown user';
                const isActive =
                  activeRoom.type === 'private' &&
                  String(activeRoom.targetUserId) === String(user.userId);

                return (
                  <button
                    key={user.userId}
                    type="button"
                    className={`sidebar__user${isActive ? ' sidebar__user--active' : ''}`}
                    onClick={() => onRoomSelect('private', user.userId)}
                  >
                    <span className="sidebar__avatar" aria-hidden="true">
                      {getInitials(displayName)}
                    </span>
                    <span className="sidebar__user-content">
                      <strong>{displayName}</strong>
                      <small>Online</small>
                    </span>
                    <span className="sidebar__presence" aria-hidden="true" />
                  </button>
                );
              })
            )}
          </div>
        </section>
      </aside>
    </>
  );
}
