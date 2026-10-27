import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useMeta } from '../hooks/useFetch';
import { Loading } from '../components/Status';

export default function NewListing() {
  const nav = useNavigate();
  const { data: meta } = useMeta();
  const [f, setF] = useState({ title: '', description: '', category: 'books', condition: 'good', askingPrice: '' });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pick = (e) => {
    const list = [...e.target.files];
    if (list.length > 4) return setError('You can upload at most 4 photos');
    if (list.some((x) => x.size > 5 * 1024 * 1024)) return setError('Each photo must be under 5 MB');
    setError(''); setFiles(list);
  };
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => form.append(k, v));
    files.forEach((x) => form.append('images', x));
    try { const d = await api.createListing(form); nav(`/listing/${d.listing._id}`); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  if (!meta) return <div className="container"><Loading /></div>;
  return (
    <div className="container" style={{ maxWidth: 620 }}>
      <h1>Sell something</h1>
      <form className="panel" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        <div className="field"><label>Title</label><input required minLength={3} maxLength={100} value={f.title} onChange={set('title')} placeholder="e.g. Engineering Mathematics (Kreyszig)" /></div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Category</label><select value={f.category} onChange={set('category')}>{meta.categories.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Condition</label><select value={f.condition} onChange={set('condition')}>{meta.conditions.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
          <div className="field" style={{ flex: 1 }}><label>Asking price (₹)</label><input type="number" min="1" required value={f.askingPrice} onChange={set('askingPrice')} /></div>
        </div>
        <div className="field"><label>Description</label><textarea rows="4" maxLength="1000" value={f.description} onChange={set('description')} placeholder="Edition, age, defects, why you're selling…" /></div>
        <div className="field"><label>Photos (up to 4, JPG/PNG/WebP)</label><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pick} />
          {files.length > 0 && <div className="row" style={{ marginTop: '.5rem' }}>{files.map((x) => <img key={x.name} src={URL.createObjectURL(x)} alt="" width="70" height="56" style={{ objectFit: 'cover', borderRadius: 8 }} />)}</div>}</div>
        <button className="primary" disabled={busy}>{busy ? 'Posting…' : 'Post listing'}</button>
      </form>
    </div>
  );
}
