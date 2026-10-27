import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [count, setCount] = useState(0);
  const loc = useLocation();
  useEffect(() => {
    if (!user) return setCount(0);
    const load = () => api.badge().then((d) => setCount(d.count)).catch(() => {});
    load(); const t = setInterval(load, 30000); return () => clearInterval(t);
  }, [user, loc.pathname]);
  return (
    <nav><div className="inner">
      <Link to="/" className="brand">♻️ ResellRing</Link>
      <NavLink to="/" end>Browse</NavLink>
      <NavLink to="/prices">Sold prices</NavLink>
      {user ? (<>
        <NavLink to="/sell">+ Sell</NavLink>
        <NavLink to="/my-listings">My listings</NavLink>
        <NavLink to="/deals">My deals{count > 0 && <span className="badge">{count}</span>}</NavLink>
        <span className="small">{user.name}</span>
        <button className="ghost small" style={{ color: '#fff', borderColor: '#fff' }} onClick={logout}>Log out</button>
      </>) : <Link className="btn small" to="/login">Log in</Link>}
    </div></nav>
  );
}
