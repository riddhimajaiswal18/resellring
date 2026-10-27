import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import ListingCard from '../components/ListingCard';
import { Loading, ErrorBox, Empty } from '../components/Status';

export default function MyListings() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => api.listings({ seller: user._id, status: 'all', limit: 50 }), [user._id]);
  return (
    <div className="container">
      <div className="row spread"><h1>My listings</h1><Link className="btn primary" to="/sell">+ New listing</Link></div>
      {loading && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && (data.items.length === 0
        ? <Empty title="You haven't listed anything yet"><Link to="/sell">Post your first item</Link></Empty>
        : <div className="grid">{data.items.map((i) => <ListingCard key={i._id} item={i} />)}</div>)}
    </div>
  );
}
