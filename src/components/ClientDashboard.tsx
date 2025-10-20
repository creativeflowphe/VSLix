import { useEffect, useState } from 'react';
import { supabase, Booking, Service, Provider } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, LogOut, User } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import ThemeToggle from './ThemeToggle';

interface BookingWithDetails extends Booking {
  service: Service;
  provider: Provider;
  salon: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function ClientDashboard() {
  const { signOut, user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(*),
          provider:providers(*),
          salon:salons(name, address, phone)
        `)
        .eq('client_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setBookings(data as BookingWithDetails[] || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pendente</span>,
      confirmed: <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Confirmado</span>,
      completed: <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Concluído</span>,
      cancelled: <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Cancelado</span>,
    };
    return badges[status as keyof typeof badges] || status;
  };

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Meus Agendamentos</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Olá, {user?.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationPanel />
              <ThemeToggle />
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bookings.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-secondary)', opacity: 0.3 }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nenhum agendamento ainda</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Seus agendamentos aparecerão aqui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-xl p-6 hover:shadow-lg transition-all"
                style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {booking.service.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{booking.salon.name}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(booking.start_time).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(booking.start_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{booking.provider.name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-primary)' }}>{booking.service.duration_min} minutos</p>
                  </div>

                  {booking.salon.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{booking.salon.address}</p>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Observações:</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{booking.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Valor</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                      R$ {Number(booking.service.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pagamento</span>
                    <span className={`text-sm font-medium ${
                      booking.payment_status === 'paid'
                        ? 'text-green-600'
                        : booking.payment_status === 'unpaid'
                        ? 'text-yellow-600'
                        : 'text-gray-600'
                    }`}>
                      {booking.payment_status === 'paid' ? 'Pago' :
                       booking.payment_status === 'unpaid' ? 'Pendente' :
                       'Reembolsado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
