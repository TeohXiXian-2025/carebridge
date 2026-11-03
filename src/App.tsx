import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import { RequireRole } from './components/layout';
import { AuthProvider, useAuth } from './lib/auth';
import { listenForeground } from './lib/pushClient';
import HomePage from './pages/Home';
import Directory from './pages/Directory';
import HomeProfile from './pages/HomeProfile';
import PledgeConfirmed from './pages/PledgeConfirmed';
import MyPledges from './pages/MyPledges';
import Login from './pages/Login';
import RegisterHome from './pages/RegisterHome';
import Profile from './pages/Profile';
import Dashboard from './pages/admin/Dashboard';
import Wishlist from './pages/admin/Wishlist';
import Pledges from './pages/admin/Pledges';
import HomeSettings from './pages/admin/HomeSettings';
import { Approvals, Overview } from './pages/platform/Platform';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function Foreground() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) void listenForeground();
  }, [user]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollTop />
          <Foreground />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/homes" element={<Directory />} />
            <Route path="/homes/:id" element={<HomeProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-home" element={<RegisterHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-pledges" element={<RequireRole role="any"><MyPledges /></RequireRole>} />
            <Route path="/pledges/:id/confirmed" element={<RequireRole role="any"><PledgeConfirmed /></RequireRole>} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/wishlist" element={<Wishlist />} />
            <Route path="/admin/pledges" element={<Pledges />} />
            <Route path="/admin/profile" element={<HomeSettings />} />
            <Route path="/platform" element={<Approvals />} />
            <Route path="/platform/overview" element={<Overview />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
