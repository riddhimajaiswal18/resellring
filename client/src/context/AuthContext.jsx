import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('rr_token'));

  const logout = useCallback(() => { localStorage.removeItem('rr_token'); setUser(null); }, []);
  useEffect(() => {
    if (!localStorage.getItem('rr_token')) return;
    api.me().then((d) => setUser(d.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);
  useEffect(() => { window.addEventListener('rr:unauthorized', logout); return () => window.removeEventListener('rr:unauthorized', logout); }, [logout]);

  const authenticate = async (fn, body) => { const d = await fn(body); localStorage.setItem('rr_token', d.token); setUser(d.user); };
  const value = { user, loading, logout, login: (b) => authenticate(api.login, b), register: (b) => authenticate(api.register, b) };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
