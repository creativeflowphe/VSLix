import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import MasterDashboard from './components/MasterDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import SalonBooking from './components/SalonBooking';
import Marketplace from './components/Marketplace';

function AppContent() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<{ type: 'dashboard' | 'booking' | 'admin' | 'marketplace'; slug?: string }>({ type: 'dashboard' });

  useEffect(() => {
    const path = window.location.pathname;
    const bookingMatch = path.match(/^\/salon\/([a-z0-9-]+)\/book$/);

    if (path === '/admin') {
      setRoute({ type: 'admin' });
    } else if (path === '/marketplace') {
      setRoute({ type: 'marketplace' });
    } else if (bookingMatch) {
      setRoute({ type: 'booking', slug: bookingMatch[1] });
    } else {
      setRoute({ type: 'dashboard' });
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      const bookingMatch = path.match(/^\/salon\/([a-z0-9-]+)\/book$/);

      if (path === '/admin') {
        setRoute({ type: 'admin' });
      } else if (path === '/marketplace') {
        setRoute({ type: 'marketplace' });
      } else if (bookingMatch) {
        setRoute({ type: 'booking', slug: bookingMatch[1] });
      } else {
        setRoute({ type: 'dashboard' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (route.type === 'marketplace') {
    return <Marketplace />;
  }

  if (route.type === 'booking' && route.slug) {
    return <SalonBooking salonSlug={route.slug} />;
  }

  if (route.type === 'admin') {
    if (!user) {
      return <Login />;
    }
    if (user.role === 'owner') {
      return <AdminDashboard />;
    }
    window.history.pushState({}, '', '/');
    setRoute({ type: 'dashboard' });
    return null;
  }

  if (!user) {
    return <Login />;
  }

  if (user.role === 'master') {
    return <MasterDashboard />;
  }

  if (user.role === 'owner') {
    return <OwnerDashboard />;
  }

  return <ClientDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
