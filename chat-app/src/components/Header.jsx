import logo from '../assets/logo.png';

export default function Header({ currentUser, onLogout, onMenuToggle }) {
  return (
    <header className="header">
      <div className="header__brand">
        <button
          type="button"
          className="header__menu"
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <img
          className="header__logo"
          src={logo}
          alt="EcoHome logo"
        />
        <div>
          <strong>Internal chat</strong>
        </div>
      </div>

      <div className="header__actions">
        <div className="header__user">
          <svg className="header__user-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z"
              fill="currentColor"
            />
          </svg>
          <span>
            <strong>{currentUser.name}</strong>
            {currentUser.email ? <small>{currentUser.email}</small> : null}
          </span>
        </div>
        <button type="button" className="header__logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
