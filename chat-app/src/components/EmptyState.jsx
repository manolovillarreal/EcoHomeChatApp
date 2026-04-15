export default function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <svg className="empty-state__icon" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="14" width="44" height="30" rx="12" fill="#d8f3dc" />
        <path
          d="M22 26h20M22 34h14M26 44l-6 8"
          fill="none"
          stroke="#4a7c59"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}
