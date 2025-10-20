import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ServiceData {
  name: string;
  count: number;
  revenue: number;
}

export default function PopularServicesChart() {
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularServices();
  }, []);

  const fetchPopularServices = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('service_id, services(name, price)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const serviceCounts: { [key: string]: ServiceData } = {};

      bookingsData?.forEach((booking: any) => {
        const serviceName = booking.services?.name || 'Unknown';
        const servicePrice = booking.services?.price || 0;

        if (!serviceCounts[serviceName]) {
          serviceCounts[serviceName] = {
            name: serviceName,
            count: 0,
            revenue: 0,
          };
        }
        serviceCounts[serviceName].count += 1;
        serviceCounts[serviceName].revenue += parseFloat(servicePrice.toString());
      });

      const sortedServices = Object.values(serviceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setData(sortedServices);
    } catch (error) {
      console.error('Error fetching popular services:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: data.map((s) => s.name),
    datasets: [
      {
        label: 'Número de Reservas',
        data: data.map((s) => s.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          afterLabel: (context: any) => {
            const service = data[context.dataIndex];
            return `Receita: R$ ${service.revenue.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="elegant-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'rgb(34, 197, 94)' }} />
        </div>
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Serviços Mais Populares
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Top serviços por número de reservas
          </p>
        </div>
      </div>

      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
          </div>
        ) : data.length > 0 ? (
          <Bar data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: 'var(--text-muted)' }}>Nenhum dado disponível</p>
          </div>
        )}
      </div>
    </div>
  );
}
