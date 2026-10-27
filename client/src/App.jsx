import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Browse from './pages/Browse';
import Auth from './pages/Auth';
import ListingDetail from './pages/ListingDetail';
import NewListing from './pages/NewListing';
import MyListings from './pages/MyListings';
import MyDeals from './pages/MyDeals';
import { Empty } from './components/Status';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Browse />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/sell" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
        <Route path="/deals" element={<ProtectedRoute><MyDeals /></ProtectedRoute>} />
        <Route path="*" element={<div className="container"><Empty icon="🧭" title="Page not found" /></div>} />
      </Routes>
    </>
  );
}
