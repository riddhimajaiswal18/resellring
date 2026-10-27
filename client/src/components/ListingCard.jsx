import { Link } from 'react-router-dom';
import { imgUrl, money } from '../api';
import { Pill, Stars } from './Status';

const EMOJI = { books: '📚', electronics: '🎧', furniture: '🪑', clothing: '👕', cycles: '🚲', stationery: '✏️', sports: '🏏', other: '📦' };
export const emojiFor = (c) => EMOJI[c] || '📦';

export default function ListingCard({ item }) {
  return (
    <Link to={`/listing/${item._id}`} className="tag-card">
      <div className="thumb">{item.images?.[0] ? <img src={imgUrl(item.images[0])} alt={item.title} loading="lazy" /> : emojiFor(item.category)}</div>
      <div className="tag-body">
        <div className="price">{item.status === 'sold' ? <><s>{money(item.askingPrice)}</s>{money(item.soldPrice)}</> : money(item.askingPrice)}</div>
        <h3 style={{ marginBottom: '.3rem' }}>{item.title}</h3>
        <div><span className="pill">{item.category}</span><span className="pill">{item.condition.replace('_', ' ')}</span>{item.status !== 'active' && <Pill s={item.status} />}</div>
        {item.seller?.name && <div className="small muted" style={{ marginTop: '.4rem' }}>{item.seller.name} · <Stars value={item.seller.ratingAvg} /></div>}
      </div>
    </Link>
  );
}
