import { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { BarChart3, LineChart, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ChartType = 'line' | 'bar';
type MetricType = 'clients' | 'salons';
type TimeRange = 'day' | 'week' | 'month';

export default function MetricToggleChart() {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metricType, setMetricType] = useState<MetricType>('salons');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [data, setData] = useState<{ labels: string[]; values: number[] }>({
    labels: [],
    values: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [metricType, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
      const labels: string[] = [];
      const values: number[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        labels.push(
          timeRange === 'month'
            ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : date.toLocaleDateString('pt-BR', { weekday: 'short' })
        );

        if (metricType === 'salons') {
          const { count } = await supabase
            .from('salons')
            .select('*', { count: 'exact', head: true })
            .lte('created_at', dateStr + 'T23:59:59');
          values.push(count || 0);
        } else {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'client')
            .lte('created_at', dateStr + 'T23:59:59');
          values.push(count || 0);
        }
      }

      setData({ labels, values });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: metricType === 'salons' ? 'Total de Salões' : 'Total de Clientes',
        data: data.values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: chartType === 'bar' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.1)',
        fill: chartType === 'line',
        tension: 0.4,
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
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <TrendingUp className="w-5 h-5" style={{ color: 'rgb(59, 130, 246)' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Crescimento
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {metricType === 'salons' ? 'Salões cadastrados' : 'Clientes ativos'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'day' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: timeRange === 'day' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'day' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Hoje
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'week' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: timeRange === 'week' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'week' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              7 dias
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'month' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: timeRange === 'month' ? 'var(--bg-card)' : 'transparent',
                color: timeRange === 'month' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Mês
            </button>
          </div>

          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setMetricType('salons')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                metricType === 'salons' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: metricType === 'salons' ? 'var(--bg-card)' : 'transparent',
                color: metricType === 'salons' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Salões
            </button>
            <button
              onClick={() => setMetricType('clients')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                metricType === 'clients' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: metricType === 'clients' ? 'var(--bg-card)' : 'transparent',
                color: metricType === 'clients' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              Clientes
            </button>
          </div>

          <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded transition-colors ${
                chartType === 'line' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: chartType === 'line' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'line' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded transition-colors ${
                chartType === 'bar' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: chartType === 'bar' ? 'var(--bg-card)' : 'transparent',
                color: chartType === 'bar' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
          </div>
        ) : chartType === 'line' ? (
          <Line data={chartData} options={options} />
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
