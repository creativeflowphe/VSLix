import { useEffect, useState } from 'react';
import { AlertCircle, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OverduePayment {
  id: string;
  amount: number;
  due_date: string;
  invoice_number: string;
  booking: {
    salon: {
      name: string;
    };
    service: {
      name: string;
    };
    client: {
      full_name: string;
      email: string;
    };
  };
}

export default function OverduePaymentsPanel() {
  const [payments, setPayments] = useState<OverduePayment[]>([]);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverduePayments();
  }, []);

  const fetchOverduePayments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          due_date,
          invoice_number,
          booking:bookings(
            salon:salons(name),
            service:services(name),
            client:users!bookings_client_id_fkey(full_name, email)
          )
        `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      const overduePayments = (data || []) as any[];
      setPayments(overduePayments);

      const total = overduePayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      setTotalOverdue(total);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="elegant-card">
      <div className="p-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle className="w-5 h-5" style={{ color: 'rgb(239, 68, 68)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Pagamentos Atrasados
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {payments.length} pagamento{payments.length !== 1 ? 's' : ''} pendente{payments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Total em Atraso
            </p>
            <p className="text-2xl font-bold" style={{ color: 'rgb(239, 68, 68)' }}>
              R$ {totalOverdue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
          </div>
        ) : payments.length > 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {payments.map((payment) => {
              const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={payment.id}
                  className="p-4 hover:bg-opacity-50 transition-colors"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {payment.invoice_number || 'Sem número'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'rgb(239, 68, 68)',
                          }}
                        >
                          {daysOverdue} dia{daysOverdue !== 1 ? 's' : ''} atrasado
                        </span>
                      </div>

                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {payment.booking?.salon?.name || 'Salão desconhecido'}
                      </p>

                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {payment.booking?.service?.name || 'Serviço desconhecido'}
                      </p>

                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Cliente: {payment.booking?.client?.full_name || 'Desconhecido'}
                      </p>

                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" style={{ color: 'rgb(239, 68, 68)' }} />
                        <span className="text-lg font-bold" style={{ color: 'rgb(239, 68, 68)' }}>
                          R$ {parseFloat(payment.amount.toString()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-secondary)' }}>Nenhum pagamento atrasado</p>
          </div>
        )}
      </div>
    </div>
  );
}
