import { useEffect, useState } from 'react';
import { supabase, Salon, Booking, Service, Provider } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, DollarSign, Users, LogOut, AlertCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import ServiceManagement from './ServiceManagement';
import NotificationTemplates from './NotificationTemplates';
import MarketingCampaigns from './MarketingCampaigns';
import ThemeCustomizer from './ThemeCustomizer';
import ReviewsManagement from './ReviewsManagement';
import SalonSettings from './SalonSettings';

interface BookingWithDetails extends Booking {
  service: Service;
  provider: Provider;
  client: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function OwnerDashboard() {
  const { signOut, user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchSalonData();
  }, [user]);

  const fetchSalonData = async () => {
    if (!user) return;

    try {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (salonError) throw salonError;
      setSalon(salonData);

      if (salonData) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            service:services(*),
            provider:providers(*),
            client:users!bookings_client_id_fkey(full_name, email, phone)
          `)
          .eq('salon_id', salonData.id)
          .order('start_time', { ascending: false })
          .limit(20);

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData as BookingWithDetails[] || []);

        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookingsData?.filter(b =>
          b.start_time.startsWith(today)
        ).length || 0;

        const pendingBookings = bookingsData?.filter(b =>
          b.status === 'pending'
        ).length || 0;

        const paidBookings = bookingsData?.filter(b =>
          b.payment_status === 'paid'
        ) || [];

        const totalRevenue = await Promise.all(
          paidBookings.map(async (booking) => {
            const service = booking.service as Service;
            return service?.price || 0;
          })
        );

        setStats({
          today: todayBookings,
          pending: pendingBookings,
          revenue: totalRevenue.reduce((sum, val) => sum + Number(val), 0),
        });
      }
    } catch (error) {
      console.error('Error fetching salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pendente</span>,
      confirmed: <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Confirmado</span>,
      completed: <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Concluído</span>,
      cancelled: <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Cancelado</span>,
    };
    return badges[status as keyof typeof badges] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Salão não encontrado</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Entre em contato com o administrador</p>
          <button
            onClick={signOut}
            className="px-6 py-3 rounded-xl"
            style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="md:ml-[260px]">
        <header style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{salon.name}</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Painel do Proprietário</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {salon.subscription_status === 'past_due' && (
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">Atenção: Pagamento em atraso. Entre em contato com o suporte.</p>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'services' && salon && (
            <ServiceManagement salonId={salon.id} />
          )}

          {activeSection === 'notifications' && salon && (
            <NotificationTemplates salonId={salon.id} />
          )}

          {activeSection === 'marketing' && salon && (
            <MarketingCampaigns salonId={salon.id} />
          )}

          {activeSection === 'theme' && salon && (
            <ThemeCustomizer salonId={salon.id} />
          )}

          {activeSection === 'reviews' && salon && (
            <ReviewsManagement salonId={salon.id} />
          )}

          {activeSection === 'settings' && (
            <SalonSettings />
          )}

          {activeSection === 'dashboard' && (
            <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Agendamentos Hoje</p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{stats.today}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--gradient-gold)' }}>
                <Calendar className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>

          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pendentes</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#F59E0B' }}>{stats.pending}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7' }}>
                <Clock className="w-8 h-8" style={{ color: '#F59E0B' }} />
              </div>
            </div>
          </div>

          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Receita Total</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#10B981' }}>
                  R$ {stats.revenue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                <DollarSign className="w-8 h-8" style={{ color: '#10B981' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="elegant-card">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Agendamentos Recentes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Profissional</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Valor</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(booking.start_time).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {new Date(booking.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{booking.client.full_name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{booking.client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{booking.service.name}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{booking.service.duration_min} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {booking.provider.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                      R$ {Number(booking.service.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {bookings.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum agendamento ainda</p>
            </div>
          )}
        </div>

        <div className="mt-8 elegant-card p-6" style={{ background: 'linear-gradient(135deg, var(--accent-light) 0%, var(--bg-card) 100%)' }}>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>Link de Agendamento</h3>
          <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>Compartilhe este link com seus clientes:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${window.location.origin}/book/${salon.slug}`}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/book/${salon.slug}`);
                alert('Link copiado!');
              }}
              className="px-6 py-3 rounded-xl transition-all"
              style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
            >
              Copiar
            </button>
          </div>
        </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
