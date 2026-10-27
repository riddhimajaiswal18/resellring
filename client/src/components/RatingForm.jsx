import { useState } from 'react';
import { api } from '../api';

export default function RatingForm({ offerId, sellerName, onDone }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!stars) return setError('Please choose a star rating');
    setBusy(true); setError('');
    try { await api.rate({ offerId, stars, comment }); onDone(); } catch (err) { setError(err.message); setBusy(false); }
  };
  return (
    <form className="panel" onSubmit={submit}>
      <h3>⭐ Rate {sellerName}</h3>
      {error && <div className="alert error">{error}</div>}
      <div className="star-pick">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)} aria-label={`${n} stars`}>★</button>)}</div>
      <div className="field"><textarea rows="2" maxLength="300" placeholder="How was the deal? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      <button className="primary small" disabled={busy}>{busy ? 'Submitting…' : 'Submit rating'}</button>
    </form>
  );
}
