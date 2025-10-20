import { useEffect, useState } from 'react';
import { supabase, Salon } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, Calendar, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import MetricToggleChart from './charts/MetricToggleChart';
import PopularServicesChart from './charts/PopularServicesChart';
import ClientAnalyticsPieChart from './charts/ClientAnalyticsPieChart';
import OverduePaymentsPanel from './charts/OverduePaymentsPanel';

interface SalonWithOwner extends Salon {
  owner: {
    full_name: string;
    email: string;
  };
  bookings_count: number;
}

export default function MasterDashboard() {
  const { signOut, user } = useAuth();
  const [salons, setSalons] = useState<SalonWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, pastDue: 0 });

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const { data: salonsData, error } = await supabase
        .from('salons')
        .select(`
          *,
          owner:users!salons_owner_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const salonsWithBookings = await Promise.all(
        (salonsData || []).map(async (salon) => {
          const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('salon_id', salon.id);

          return {
            ...salon,
            bookings_count: count || 0,
          };
        })
      );

      setSalons(salonsWithBookings as SalonWithOwner[]);

      setStats({
        total: salonsWithBookings.length,
        active: salonsWithBookings.filter(s => s.subscription_status === 'active').length,
        pastDue: salonsWithBookings.filter(s => s.subscription_status === 'past_due').length,
      });
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"><CheckCircle className="w-4 h-4" /> Ativo</span>,
      past_due: <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"><AlertCircle className="w-4 h-4" /> Atrasado</span>,
      cancelled: <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Cancelado</span>,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <header style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Painel Administrativo</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Bem-vindo, {user?.full_name}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total de Salões</p>
                <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--gradient-gold)' }}>
                <Building2 className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>

          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Salões Ativos</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#10B981' }}>{stats.active}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#10B981' }} />
              </div>
            </div>
          </div>

          <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Pagamentos Atrasados</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#EF4444' }}>{stats.pastDue}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                <AlertCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="elegant-card overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Gerenciar Salões</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Salão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Proprietário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Próximo Pagamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Agendamentos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Link</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid var(--border-color)' }}>
                {salons.map((salon) => (
                  <tr key={salon.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-5 h-5 mr-3" style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{salon.name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{salon.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{salon.owner.full_name}</div>
                        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{salon.owner.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(salon.subscription_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                      {salon.payment_due ? new Date(salon.payment_due).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        {salon.bookings_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`/book/${salon.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        /{salon.slug}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {salons.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Nenhum salão cadastrado ainda</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 mt-8">
          <MetricToggleChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <PopularServicesChart />
          <ClientAnalyticsPieChart />
        </div>

        <div className="mt-8">
          <OverduePaymentsPanel />
        </div>
      </main>
    </div>
  );
}
