import { useParams } from 'react-router-dom';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import ListingCard from '../components/ListingCard';
import { Loading, ErrorBox, Empty, Stars } from '../components/Status';

export default function Profile() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(() => api.userRatings(id), [id]);
  const { data: items } = useFetch(() => api.listings({ seller: id, status: 'active', limit: 12 }), [id]);
  if (loading) return <div className="container"><Loading /></div>;
  if (error) return <div className="container"><ErrorBox message={error} onRetry={reload} /></div>;
  const { user, ratings } = data;
  return (
    <div className="container">
      <h1>{user.name}</h1>
      <p><Stars value={user.ratingAvg} count={user.ratingCount} /> <span className="muted small">· member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></p>
      <h2>Reviews</h2>
      {ratings.length === 0 ? <Empty icon="💬" title="No reviews yet" /> : ratings.map((r) => (
        <div className="panel" key={r._id}><Stars value={r.stars} /> <span className="small muted">by {r.rater.name} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</span>{r.comment && <p style={{ margin: '.3rem 0 0' }}>{r.comment}</p>}</div>))}
      {items?.items.length > 0 && <><h2 style={{ marginTop: '1.5rem' }}>Currently selling</h2><div className="grid">{items.items.map((i) => <ListingCard key={i._id} item={i} />)}</div></>}
    </div>
  );
}
