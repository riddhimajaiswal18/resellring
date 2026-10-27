export const Loading = () => <div className="spinner" role="status" aria-label="Loading" />;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="alert error">{message} {onRetry && <button className="ghost small" onClick={onRetry}>Retry</button>}</div>
);
export const Empty = ({ icon = '🪹', title, children }) => (
  <div className="empty"><div className="big">{icon}</div><h3>{title}</h3><div>{children}</div></div>
);
export const Pill = ({ s }) => <span className={`pill ${s}`}>{String(s).replace('_', ' ')}</span>;
export const Stars = ({ value = 0, count }) => (
  <span className="small"><span className="stars">{'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}</span>
    {count != null && <span className="muted"> {count ? `${value.toFixed(1)} (${count})` : 'No ratings yet'}</span>}</span>
);
