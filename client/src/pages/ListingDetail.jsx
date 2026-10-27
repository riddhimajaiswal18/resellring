import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, imgUrl, money } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Loading, ErrorBox, Pill, Stars } from '../components/Status';
import { emojiFor } from '../components/ListingCard';
import OfferBox from '../components/OfferBox';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [pic, setPic] = useState(0);
  const [err, setErr] = useState('');
  const { data, loading, error, reload } = useFetch(() => api.listing(id), [id]);
  const l = data?.listing;
  const { data: hist } = useFetch(async () => (l ? api.priceHistory({ category: l.category }) : null), [l?.category]);
  if (loading) return <div className="container"><Loading /></div>;
  if (error) return <div className="container"><ErrorBox message={error} onRetry={reload} /></div>;

  const mine = user && l.seller._id === user._id;
  const remove = async () => {
    if (!window.confirm('Delete this listing? Open offers will be declined.')) return;
    try { await api.deleteListing(l._id); nav('/my-listings'); } catch (e) { setErr(e.message); }
  };
  return (
    <div className="container detail">
      <div className="gallery">
        <div className="main">{l.images[pic] ? <img src={imgUrl(l.images[pic])} alt={l.title} /> : emojiFor(l.category)}</div>
        {l.images.length > 1 && <div className="thumbs">{l.images.map((u, i) => <img key={u} src={imgUrl(u)} alt="" className={i === pic ? 'on' : ''} onClick={() => setPic(i)} />)}</div>}
        <h3 style={{ marginTop: '1.2rem' }}>Description</h3><p style={{ whiteSpace: 'pre-wrap' }}>{l.description || 'No description provided.'}</p>
      </div>
      <div>
        <h1>{l.title}</h1>
        <div className="price" style={{ fontSize: '2rem' }}>{l.status === 'sold' ? <><s>{money(l.askingPrice)}</s> {money(l.soldPrice)}</> : money(l.askingPrice)}</div>
        <p><span className="pill">{l.category}</span><span className="pill">{l.condition.replace('_', ' ')}</span><Pill s={l.status} /></p>
        <div className="panel small">Sold by <Link to={`/u/${l.seller._id}`}><b>{l.seller.name}</b></Link><br /><Stars value={l.seller.ratingAvg} count={l.seller.ratingCount} /></div>
        {err && <div className="alert error">{err}</div>}
        {mine ? (<div className="panel">
          <p>This is your listing.</p>
          <div className="row"><Link className="btn small" to="/deals">View offers</Link>{l.status === 'active' && <button className="danger small" onClick={remove}>Delete listing</button>}</div></div>)
        : l.status !== 'active' ? <div className="alert error">This item is {l.status} and no longer accepting offers.</div>
        : !user ? <div className="panel"><Link className="btn" to="/login" state={{ from: `/listing/${l._id}` }}>Log in to make an offer</Link></div>
        : <OfferBox listing={l} hint={hist?.summary?.[0]} />}
      </div>
    </div>
  );
}
