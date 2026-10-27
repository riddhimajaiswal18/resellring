import { useState } from 'react';
import { api, money } from '../api';
import { useMeta } from '../hooks/useFetch';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export default function MeetupPanel({ offer, role, meetup, myId, onChange }) {
  const { data: meta } = useMeta();
  const [editing, setEditing] = useState(false);
  const [loc, setLoc] = useState(meetup?.location || '');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setError(''); setBusy(true);
    try { await fn(); setEditing(false); onChange(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const propose = (e) => { e.preventDefault(); run(() => api.proposeMeetup({ offerId: offer._id, location: loc, proposedTime: new Date(time).toISOString() })); };
  const act = (a) => run(() => api.meetupAction(meetup._id, a));

  const form = (
    <form onSubmit={propose} className="row" style={{ alignItems: 'end' }}>
      <div><label>Where</label><select required value={loc} onChange={(e) => setLoc(e.target.value)}><option value="">Pick a spot…</option>{meta?.locations.map((l) => <option key={l}>{l}</option>)}</select></div>
      <div><label>When</label><input type="datetime-local" required value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <button className="primary small" disabled={busy}>{meetup ? 'Send new proposal' : 'Propose meetup'}</button>
    </form>
  );
  const iConfirmed = role === 'buyer' ? meetup?.buyerConfirmed : meetup?.sellerConfirmed;
  const theyConfirmed = role === 'buyer' ? meetup?.sellerConfirmed : meetup?.buyerConfirmed;
  const s = meetup?.status;

  return (
    <div className="panel" style={{ background: '#f1ece0' }}>
      <h3>📍 Meetup · agreed price {money(offer.finalAmount)}</h3>
      {error && <div className="alert error">{error}</div>}
      {!meetup && <><p className="small muted">Offer accepted! Propose where and when to meet on campus.</p>{form}</>}
      {meetup && s !== 'cancelled' && <p><b>{meetup.location}</b> · {fmt(meetup.proposedTime)} <span className={`pill ${s}`}>{s}</span></p>}
      {s === 'proposed' && (meetup.proposedBy === myId
        ? <p className="small muted">Waiting for the other person to agree. You can <button className="ghost small" onClick={() => setEditing(!editing)}>change the proposal</button></p>
        : <div className="row"><button className="primary small" disabled={busy} onClick={() => act('agree')}>Agree to this</button><button className="ghost small" onClick={() => setEditing(!editing)}>Suggest another slot</button></div>)}
      {s === 'scheduled' && (<>
        <p className="small muted">After you hand over / receive the item, each of you confirms. The sale is recorded once both have confirmed.</p>
        <div className="row">
          {iConfirmed ? <span className="pill completed">✓ You confirmed</span> : <button className="primary small" disabled={busy} onClick={() => act('confirm-handover')}>Confirm handover</button>}
          <span className="small muted">{theyConfirmed ? 'Other person has confirmed ✓' : 'Waiting for the other person'}</span>
          <button className="ghost small" onClick={() => setEditing(!editing)}>Reschedule</button>
        </div></>)}
      {s === 'completed' && <div className="alert ok">Handover complete — sold for {money(offer.finalAmount)} 🎉</div>}
      {s === 'cancelled' && <div className="alert error">This meetup was cancelled and the item is back on sale.</div>}
      {editing && meetup && form}
      {['proposed', 'scheduled'].includes(s) && <div style={{ marginTop: '.7rem' }}><button className="danger small" disabled={busy}
        onClick={() => window.confirm('Cancel this deal? The item goes back on sale.') && act('cancel')}>Cancel deal</button></div>}
    </div>
  );
}
