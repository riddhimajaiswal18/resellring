import { useEffect, useState } from 'react';
import { api } from '../api';
import { useFetch, useMeta } from '../hooks/useFetch';
import ListingCard from '../components/ListingCard';
import { Loading, ErrorBox, Empty } from '../components/Status';

const INIT = { q: '', category: '', condition: '', minPrice: '', maxPrice: '', sort: 'newest' };

export default function Browse() {
  const [f, setF] = useState(INIT);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data: meta } = useMeta();
  useEffect(() => { const t = setTimeout(() => { setQ(f.q); setPage(1); }, 350); return () => clearTimeout(t); }, [f.q]); // debounce search
  const { data, loading, error, reload } = useFetch(() => api.listings({ ...f, q, page, limit: 12 }),
    [q, f.category, f.condition, f.minPrice, f.maxPrice, f.sort, page]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const filtered = Object.entries(f).some(([k, v]) => v && v !== INIT[k]);

  return (
    <div className="container">
      <div className="hero"><h1>Pre-loved stuff, from people on your campus.</h1><p className="muted">Books, cycles, gadgets, hostel essentials. Make an offer, meet at the library, done.</p></div>
      <div className="filters">
        <input placeholder="Search items…" value={f.q} onChange={set('q')} aria-label="Search" />
        <select value={f.category} onChange={set('category')} aria-label="Category"><option value="">All categories</option>{meta?.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.condition} onChange={set('condition')} aria-label="Condition"><option value="">Any condition</option>{meta?.conditions.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select>
        <input type="number" min="0" placeholder="Min ₹" value={f.minPrice} onChange={set('minPrice')} />
        <input type="number" min="0" placeholder="Max ₹" value={f.maxPrice} onChange={set('maxPrice')} />
        <select value={f.sort} onChange={set('sort')} aria-label="Sort"><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && !loading && (data.items.length === 0
        ? <Empty title="Nothing here yet">{filtered ? <button className="ghost small" onClick={() => { setF(INIT); setQ(''); }}>Clear filters</button> : 'Be the first to list something!'}</Empty>
        : <>
          <p className="muted small">{data.total} item{data.total !== 1 && 's'} found</p>
          <div className="grid">{data.items.map((i) => <ListingCard key={i._id} item={i} />)}</div>
          {data.pages > 1 && <div className="row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span className="small">Page {page} of {data.pages}</span>
            <button className="ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</button></div>}
        </>)}
    </div>
  );
}
