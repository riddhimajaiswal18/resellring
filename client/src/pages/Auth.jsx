import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || '/';
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await (mode === 'login' ? login({ email: form.email, password: form.password }) : register(form)); nav(from, { replace: true }); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <h1>{mode === 'login' ? 'Welcome back' : 'Join your campus'}</h1>
      <p className="muted">Use your college email address — ResellRing is for students only.</p>
      <form className="panel" onSubmit={submit}>
        {error && <div className="alert error">{error}</div>}
        {mode === 'register' && <div className="field"><label>Name</label><input required minLength={2} value={form.name} onChange={set('name')} /></div>}
        <div className="field"><label>College email</label><input type="email" required value={form.email} onChange={set('email')} /></div>
        <div className="field"><label>Password {mode === 'register' && <span className="muted">(min 8 characters)</span>}</label>
          <input type="password" required minLength={mode === 'register' ? 8 : 1} value={form.password} onChange={set('password')} /></div>
        <button className="primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
      <button className="ghost small" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
        {mode === 'login' ? "New here? Create an account" : 'Already registered? Log in'}</button>
    </div>
  );
}
