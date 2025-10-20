import { useEffect, useState } from 'react';
import { supabase, Salon, Booking, Service } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, TrendingUp, DollarSign, Users, LogOut, PieChart, BarChart3 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface BookingWithDetails extends Booking {
  service: Service;
}

interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
}

interface ServicePopularity {
  name: string;
  count: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [servicePopularity, setServicePopularity] = useState<ServicePopularity[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    completedBookings: 0,
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
            service:services(*)
          `)
          .eq('salon_id', salonData.id)
          .order('start_time', { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData as BookingWithDetails[] || []);

        calculateStats(bookingsData as BookingWithDetails[] || []);
        calculateDailyStats(bookingsData as BookingWithDetails[] || []);
        calculateServicePopularity(bookingsData as BookingWithDetails[] || []);
      }
    } catch (error) {
      console.error('Error fetching salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData: BookingWithDetails[]) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayBookings = bookingsData.filter(b =>
      b.start_time.startsWith(today)
    ).length;

    const weekBookings = bookingsData.filter(b =>
      new Date(b.start_time) >= weekStart
    ).length;

    const monthBookings = bookingsData.filter(b =>
      new Date(b.start_time) >= monthStart
    ).length;

    const paidBookings = bookingsData.filter(b => b.payment_status === 'paid');
    const pendingBookings = bookingsData.filter(b => b.payment_status === 'unpaid');
    const completedBookings = bookingsData.filter(b => b.status === 'completed').length;

    const totalRevenue = paidBookings.reduce((sum, booking) => {
      return sum + Number(booking.service?.price || 0);
    }, 0);

    const pendingRevenue = pendingBookings.reduce((sum, booking) => {
      return sum + Number(booking.service?.price || 0);
    }, 0);

    setStats({
      today: todayBookings,
      thisWeek: weekBookings,
      thisMonth: monthBookings,
      totalRevenue,
      pendingRevenue,
      completedBookings,
    });
  };

  const calculateDailyStats = (bookingsData: BookingWithDetails[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyData = last30Days.map(date => {
      const dayBookings = bookingsData.filter(b => b.start_time.startsWith(date));
      const revenue = dayBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + Number(b.service?.price || 0), 0);

      return {
        date,
        bookings: dayBookings.length,
        revenue,
      };
    });

    setDailyStats(dailyData);
  };

  const calculateServicePopularity = (bookingsData: BookingWithDetails[]) => {
    const serviceMap = new Map<string, { count: number; revenue: number }>();

    bookingsData.forEach(booking => {
      if (booking.service) {
        const serviceName = booking.service.name;
        const current = serviceMap.get(serviceName) || { count: 0, revenue: 0 };
        serviceMap.set(serviceName, {
          count: current.count + 1,
          revenue: current.revenue + (booking.payment_status === 'paid' ? Number(booking.service.price) : 0),
        });
      }
    });

    const popularity = Array.from(serviceMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setServicePopularity(popularity);
  };

  const salesChartData = {
    labels: dailyStats.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Receita (R$)',
        data: dailyStats.map(d => d.revenue),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const bookingsChartData = {
    labels: dailyStats.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: 'Agendamentos',
        data: dailyStats.map(d => d.bookings),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const servicePopularityData = {
    labels: servicePopularity.map(s => s.name),
    datasets: [
      {
        label: 'Agendamentos',
        data: servicePopularity.map(s => s.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'var(--text-muted)',
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'var(--border-color)',
        },
      },
      y: {
        ticks: {
          color: 'var(--text-muted)',
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'var(--border-color)',
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg-card)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
      },
    },
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
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Salão não encontrado</p>
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
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard Administrativo</h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{salon.name}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hoje</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{stats.today}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>agendamentos</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--gradient-gold)' }}>
                  <Calendar className="w-8 h-8" style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Esta Semana</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#3B82F6' }}>{stats.thisWeek}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>agendamentos</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#DBEAFE' }}>
                  <TrendingUp className="w-8 h-8" style={{ color: '#3B82F6' }} />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Este Mês</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: 'var(--accent-primary)' }}>{stats.thisMonth}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>agendamentos</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--accent-light)' }}>
                  <Calendar className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Receita Recebida</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#10B981' }}>
                    R$ {stats.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>pagamentos confirmados</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#D1FAE5' }}>
                  <DollarSign className="w-8 h-8" style={{ color: '#10B981' }} />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Receita Pendente</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#F59E0B' }}>
                    R$ {stats.pendingRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>aguardando pagamento</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7' }}>
                  <DollarSign className="w-8 h-8" style={{ color: '#F59E0B' }} />
                </div>
              </div>
            </div>

            <div className="elegant-card p-6 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Concluídos</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#8B5CF6' }}>{stats.completedBookings}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>atendimentos finalizados</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#EDE9FE' }}>
                  <Users className="w-8 h-8" style={{ color: '#8B5CF6' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="elegant-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <BarChart3 className="w-5 h-5" />
                  Vendas (Últimos 30 dias)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${chartType === 'bar' ? 'shadow-md' : ''}`}
                    style={{
                      backgroundColor: chartType === 'bar' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: chartType === 'bar' ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    Barras
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${chartType === 'line' ? 'shadow-md' : ''}`}
                    style={{
                      backgroundColor: chartType === 'line' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: chartType === 'line' ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    Linhas
                  </button>
                </div>
              </div>
              <div style={{ height: '300px' }}>
                {chartType === 'bar' ? (
                  <Bar data={salesChartData} options={chartOptions} />
                ) : (
                  <Line data={salesChartData} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="elegant-card p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <PieChart className="w-5 h-5" />
                Popularidade dos Serviços
              </h2>
              <div style={{ height: '300px' }}>
                {servicePopularity.length > 0 ? (
                  <Pie data={servicePopularityData} options={pieChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p style={{ color: 'var(--text-muted)' }}>Sem dados disponíveis</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="elegant-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="w-5 h-5" />
                Agendamentos (Últimos 30 dias)
              </h2>
            </div>
            <div style={{ height: '300px' }}>
              {chartType === 'bar' ? (
                <Bar data={bookingsChartData} options={chartOptions} />
              ) : (
                <Line data={bookingsChartData} options={chartOptions} />
              )}
            </div>
          </div>

          <div className="mt-8 elegant-card p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Serviços mais Populares</h2>
            <div className="space-y-4">
              {servicePopularity.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index] }}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{service.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{service.count} agendamentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#10B981' }}>R$ {service.revenue.toFixed(2)}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>receita total</p>
                  </div>
                </div>
              ))}
              {servicePopularity.length === 0 && (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--text-muted)' }}>Nenhum dado disponível ainda</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
