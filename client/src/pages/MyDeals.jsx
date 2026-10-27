import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Loading, ErrorBox, Empty, Pill } from '../components/Status';
import MeetupPanel from '../components/MeetupPanel';
import RatingForm from '../components/RatingForm';

function OfferCard({ o, role, myId, reload }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [counter, setCounter] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const other = role === 'buyer' ? o.seller : o.buyer;
  const act = async (action, body, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(''); setBusy(true);
    try { await api.offerAction(o._id, action, body); reload(); } catch (e) { setError(e.message); reload(); } finally { setBusy(false); }
  };
  const amountNow = o.status === 'countered' ? o.counterAmount : o.finalAmount || o.amount;

  return (
    <div className="panel">
      <div className="row spread">
        <div><Link to={`/listing/${o.listing._id}`}><b>{o.listing.title}</b></Link>
          <div className="small muted">{role === 'buyer' ? 'Seller' : 'Buyer'}: <Link to={`/u/${other._id}`}>{other.name}</Link> · listed at {money(o.listing.askingPrice)}</div></div>
        <div style={{ textAlign: 'right' }}><div className="price">{money(amountNow)}</div><Pill s={o.status} /></div>
      </div>
      {o.status === 'countered' && <p className="small">Original offer {money(o.amount)} → seller countered {money(o.counterAmount)}</p>}
      {o.message && <p className="small muted">“{o.message}”</p>}
      {['pending', 'countered'].includes(o.status) && o.expiresAt && <p className="small muted">Expires {new Date(o.expiresAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
      {error && <div className="alert error">{error}</div>}
      <div className="row">
        {role === 'seller' && o.status === 'pending' && <>
          <button className="primary small" disabled={busy} onClick={() => act('accept', null, `Accept ${money(o.amount)}? Other pending offers will be declined.`)}>Accept</button>
          <button className="ghost small" disabled={busy} onClick={() => act('decline')}>Decline</button>
          <button className="ghost small" onClick={() => setShowCounter(!showCounter)}>Counter</button></>}
        {role === 'buyer' && o.status === 'countered' && <>
          <button className="primary small" disabled={busy} onClick={() => act('accept', null, `Accept the counter of ${money(o.counterAmount)}?`)}>Accept counter</button>
          <button className="ghost small" disabled={busy} onClick={() => act('decline')}>Decline</button></>}
        {role === 'buyer' && ['pending', 'countered'].includes(o.status) && <button className="danger small" disabled={busy} onClick={() => act('withdraw', null, 'Withdraw this offer?')}>Withdraw</button>}
      </div>
      {showCounter && <form className="row" style={{ marginTop: '.6rem' }} onSubmit={(e) => { e.preventDefault(); act('counter', { counterAmount: Number(counter) }); }}>
        <input style={{ width: 140 }} type="number" min="1" required placeholder="Counter ₹" value={counter} onChange={(e) => setCounter(e.target.value)} />
        <button className="primary small" disabled={busy}>Send counter</button></form>}
      {o.status === 'accepted' && <div style={{ marginTop: '.8rem' }}>
        <MeetupPanel offer={o} role={role} meetup={o.meetup} myId={myId} onChange={reload} />
        {role === 'buyer' && o.meetup?.status === 'completed' && (o.rated ? <p className="small muted">✓ You rated this seller</p> : <RatingForm offerId={o._id} sellerName={o.seller.name} onDone={reload} />)}
      </div>}
    </div>
  );
}

export default function MyDeals() {
  const { user } = useAuth();
  const [role, setRole] = useState('buyer');
  const { data, loading, error, reload } = useFetch(() => api.myOffers(role), [role]);
  return (
    <div className="container">
      <h1>My deals</h1>
      <div className="tabs">
        <button className={role === 'buyer' ? 'on' : ''} onClick={() => setRole('buyer')}>Buying</button>
        <button className={role === 'seller' ? 'on' : ''} onClick={() => setRole('seller')}>Selling</button>
      </div>
      {loading && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && !loading && (data.offers.length === 0
        ? <Empty title={role === 'buyer' ? 'No offers made yet' : 'No offers received yet'}>{role === 'buyer' ? <Link to="/">Browse items to make an offer</Link> : 'Offers on your listings will show up here.'}</Empty>
        : data.offers.map((o) => <OfferCard key={o._id} o={o} role={role} myId={user._id} reload={reload} />))}
    </div>
  );
}
