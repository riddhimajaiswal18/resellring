import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useFetch, useMeta } from '../hooks/useFetch';
import { Loading, ErrorBox } from '../components/Status';

export default function EditListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: meta } = useMeta();
  const { data, loading, error, reload } = useFetch(() => api.listing(id), [id]);
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) { const l = data.listing; setF({ title: l.title, description: l.description || '', category: l.category, condition: l.condition, askingPrice: l.askingPrice }); }
  }, [data]);

  if (loading || !meta) return <div className="container"><Loading /></div>;
  if (error) return <div className="container"><ErrorBox message={error} onRetry={reload} /></div>;
  const l = data.listing;
  if (l.seller._id !== user._id) return <div className="container"><div className="alert error">You can only edit your own listings.</div></div>;
  if (l.status !== 'active') return <div className="container"><div className="alert error">A {l.status} listing can't be edited. <Link to={`/listing/${l._id}`}>Back</Link></div></div>;
  if (!f) return <div className="container"><Loading /></div>;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api.updateListing(id, { ...f, askingPrice: Number(f.askingPrice) }); nav(`/listing/${id}`); }
    catch (e2) { setErr(e2.message); setBusy(false); }
  };
  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <h1>Edit listing</h1>
      <form className="panel" onSubmit={submit}>
        {err && <div className="alert error">{err}</div>}
        <div className="field"><label>Title</label><input required minLength={3} maxLength={100} value={f.title} onChange={set('title')} /></div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Category</label><select value={f.category} onChange={set('category')}>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Condition</label><select value={f.condition} onChange={set('condition')}>{meta.conditions.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Asking price (₹)</label><input type="number" min="1" required value={f.askingPrice} onChange={set('askingPrice')} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows="4" maxLength="1000" value={f.description} onChange={set('description')} /></div>
        <p className="small muted">Photos can't be changed after posting. Delete and re-post to use new photos.</p>
        <div className="row"><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><Link to={`/listing/${id}`}>Cancel</Link></div>
      </form>
    </div>
  );
}
