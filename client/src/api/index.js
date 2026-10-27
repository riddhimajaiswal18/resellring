const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const imgUrl = (u) => (u && u.startsWith('/') ? BASE + u : u);
export class ApiError extends Error { constructor(message, status) { super(message); this.status = status; } }

async function request(path, { method = 'GET', body, form } = {}) {
  const token = localStorage.getItem('rr_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload }); }
  catch { throw new ApiError('Cannot reach the server. Check your connection and try again.', 0); }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('rr:unauthorized'));
    const msg = data.errors?.length ? data.errors.map((e) => `${e.field}: ${e.message}`).join(' · ') : data.message;
    throw new ApiError(msg || 'Something went wrong', res.status);
  }
  return data;
}
const qs = (o = {}) => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== '' && v != null)); const s = p.toString(); return s ? `?${s}` : ''; };

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  meta: () => request('/stats/meta'),
  listings: (params) => request(`/listings${qs(params)}`),
  listing: (id) => request(`/listings/${id}`),
  createListing: (form) => request('/listings', { method: 'POST', form }),
  updateListing: (id, body) => request(`/listings/${id}`, { method: 'PATCH', body }),
  deleteListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),
  makeOffer: (body) => request('/offers', { method: 'POST', body }),
  myOffers: (role) => request(`/offers/mine${qs({ role })}`),
  badge: () => request('/offers/badge'),
  offerAction: (id, action, body) => request(`/offers/${id}/${action}`, { method: 'POST', body }),
  proposeMeetup: (body) => request('/meetups', { method: 'POST', body }),
  meetupAction: (id, action) => request(`/meetups/${id}/${action}`, { method: 'POST' }),
  rate: (body) => request('/ratings', { method: 'POST', body }),
  userRatings: (id) => request(`/ratings/user/${id}`),
  priceHistory: (params) => request(`/stats/price-history${qs(params)}`),
};
export const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
