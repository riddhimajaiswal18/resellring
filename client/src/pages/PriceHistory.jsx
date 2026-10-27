import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api';
import { useFetch, useMeta } from '../hooks/useFetch';
import { Loading, ErrorBox, Empty } from '../components/Status';

export default function PriceHistory() {
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const { data: meta } = useMeta();
  const { data, loading, error, reload } = useFetch(() => api.priceHistory({ category, q: term }), [category, term]);
  const maxAsk = Math.max(1, ...(data?.summary.map((s) => s.maxSold) || [1]));
  return (
    <div className="container">
      <h1>What things actually sell for</h1>
      <p className="muted">Real final prices from completed handovers on campus — not asking prices.</p>
      <form className="row" style={{ marginBottom: '1rem' }} onSubmit={(e) => { e.preventDefault(); setTerm(q); }}>
        <select style={{ width: 200 }} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{meta?.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <input style={{ width: 240 }} placeholder="Search sold items…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="primary small">Search</button>
      </form>
      {loading && <Loading />}{error && <ErrorBox message={error} onRetry={reload} />}
      {data && !loading && (data.recent.length === 0 ? <Empty icon="📉" title="No completed sales match this search yet" /> : <>
        <div className="panel"><table><thead><tr><th>Category</th><th>Sales</th><th>Avg sold</th><th>Range</th><th>Avg discount</th></tr></thead>
          <tbody>{data.summary.map((s) => <tr key={s.category}><td style={{ textTransform: 'capitalize' }}>{s.category}</td><td>{s.count}</td><td><b>{money(s.avgSold)}</b></td>
            <td><div className="bar"><i style={{ width: `${(s.avgSold / maxAsk) * 100}%` }} /></div><span className="small muted">{money(s.minSold)} – {money(s.maxSold)}</span></td>
            <td>{s.avgDiscountPct}% off asking</td></tr>)}</tbody></table></div>
        <h2>Recent sales</h2>
        <div className="panel">{data.recent.map((r) => <div key={r._id} className="row spread" style={{ padding: '.4rem 0', borderBottom: '1px solid var(--line)' }}>
          <span><Link to={`/listing/${r._id}`}>{r.title}</Link> <span className="pill">{r.category}</span> <span className="pill">{r.condition.replace('_', ' ')}</span></span>
          <span><s className="muted small">{money(r.askingPrice)}</s> <b>{money(r.soldPrice)}</b> <span className="small muted">{new Date(r.soldAt).toLocaleDateString('en-IN')}</span></span></div>)}</div></>)}
    </div>
  );
}
