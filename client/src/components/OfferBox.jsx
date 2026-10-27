import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';

export default function OfferBox({ listing, hint }) {
  const [amount, setAmount] = useState(listing.askingPrice);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await api.makeOffer({ listingId: listing._id, amount: Number(amount), message }); setDone(true); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  if (done) return <div className="panel"><div className="alert ok">Offer of {money(amount)} sent! The seller has 48 hours to respond.</div><Link to="/deals">Track it in My deals →</Link></div>;
  return (
    <form className="panel" onSubmit={submit}>
      <h3>Make an offer</h3>
      {hint && <p className="small muted">💡 Similar {listing.category} items have sold for ~{money(hint.avgSold)} on average ({hint.avgDiscountPct}% below asking).</p>}
      {error && <div className="alert error">{error}</div>}
      <div className="field"><label>Your offer (₹)</label><input type="number" min="1" required value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
      <div className="field"><label>Message (optional)</label><textarea rows="2" maxLength="300" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! Can we meet at the library?" /></div>
      <button className="primary" disabled={busy}>{busy ? 'Sending…' : 'Send offer'}</button>
    </form>
  );
}
