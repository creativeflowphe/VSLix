import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ClientAnalyticsPieChart() {
  const [data, setData] = useState({
    newClients: 0,
    repeatClients: 0,
    cancellations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientAnalytics();
  }, []);

  const fetchClientAnalytics = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('client_id, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientBookingCounts: { [key: string]: number } = {};
      let cancellations = 0;

      bookingsData?.forEach((booking) => {
        if (booking.status === 'cancelled') {
          cancellations++;
        }
        if (!clientBookingCounts[booking.client_id]) {
          clientBookingCounts[booking.client_id] = 0;
        }
        clientBookingCounts[booking.client_id]++;
      });

      const newClients = Object.values(clientBookingCounts).filter((count) => count === 1).length;
      const repeatClients = Object.values(clientBookingCounts).filter((count) => count > 1).length;

      setData({
        newClients,
        repeatClients,
        cancellations,
      });
    } catch (error) {
      console.error('Error fetching client analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ['Clientes Novos', 'Clientes Recorrentes', 'Cancelamentos'],
    datasets: [
      {
        data: [data.newClients, data.repeatClients, data.cancellations],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = data.newClients + data.repeatClients + data.cancellations;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)' }}>
          <Users className="w-5 h-5" style={{ color: 'rgb(147, 51, 234)' }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Análise de Clientes
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Distribuição por tipo e cancelamentos
          </p>
        </div>
      </div>

      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
          </div>
        ) : (
          <Pie data={chartData} options={options} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'rgb(59, 130, 246)' }}>
            {data.newClients}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Novos
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'rgb(34, 197, 94)' }}>
            {data.repeatClients}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Recorrentes
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold" style={{ color: 'rgb(239, 68, 68)' }}>
            {data.cancellations}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Cancelamentos
          </p>
        </div>
      </div>
    </div>
  );
}
