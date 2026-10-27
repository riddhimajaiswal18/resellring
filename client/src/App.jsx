import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import { Empty } from './components/Status';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="*" element={<div className="container"><Empty icon="🧭" title="Page not found" /></div>} />
      </Routes>
    </>
  );
}
