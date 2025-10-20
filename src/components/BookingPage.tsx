import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Salon, Service, Provider } from '../lib/supabase';
import { Calendar, Clock, DollarSign, MapPin, Phone, User, CheckCircle } from 'lucide-react';
import Login from './Login';

interface BookingPageProps {
  slug: string;
}

export default function BookingPage({ slug }: BookingPageProps) {
  const { user, session } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'service' | 'provider' | 'datetime' | 'confirm' | 'login' | 'success'>('service');

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSalonData();
  }, [slug]);

  const fetchSalonData = async () => {
    try {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('slug', slug)
        .eq('subscription_status', 'active')
        .maybeSingle();

      if (salonError) throw salonError;
      if (!salonData) {
        setLoading(false);
        return;
      }

      setSalon(salonData);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('active', true);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      const { data: providersData, error: providersError } = await supabase
        .from('providers')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('active', true);

      if (providersError) throw providersError;
      setProviders(providersData || []);
    } catch (error) {
      console.error('Error fetching salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('provider');
  };

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setStep('datetime');
  };

  const handleDateTimeSubmit = () => {
    if (!selectedDate || !selectedTime) {
      setBookingError('Por favor, selecione data e horário');
      return;
    }

    if (!session) {
      setStep('login');
    } else {
      setStep('confirm');
    }
  };

  const handleBookingConfirm = async () => {
    if (!user || !selectedService || !selectedProvider || !salon) return;

    setSubmitting(true);
    setBookingError('');

    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + selectedService.duration_min * 60000);

      const { error } = await supabase.from('bookings').insert({
        service_id: selectedService.id,
        provider_id: selectedProvider.id,
        client_id: user.id,
        salon_id: salon.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        payment_status: 'unpaid',
        notes,
      });

      if (error) throw error;

      setStep('success');
    } catch (error: any) {
      setBookingError(error.message || 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Salão não encontrado</h2>
          <p className="text-slate-600">Verifique o link e tente novamente</p>
        </div>
      </div>
    );
  }

  if (step === 'login') {
    return <Login />;
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Agendamento Realizado!</h2>
          <p className="text-slate-600 mb-6">
            Seu agendamento foi confirmado. Você receberá uma confirmação em breve.
          </p>
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-slate-600 mb-2">Detalhes do agendamento:</p>
            <div className="space-y-2">
              <p className="text-slate-900"><strong>Serviço:</strong> {selectedService?.name}</p>
              <p className="text-slate-900"><strong>Profissional:</strong> {selectedProvider?.name}</p>
              <p className="text-slate-900"><strong>Data:</strong> {new Date(selectedDate).toLocaleDateString('pt-BR')}</p>
              <p className="text-slate-900"><strong>Horário:</strong> {selectedTime}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">{salon.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
            {salon.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {salon.address}
              </div>
            )}
            {salon.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {salon.phone}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step !== 'service' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
              1
            </div>
            <div className="flex-1 h-1 bg-slate-200">
              <div className={`h-full ${step !== 'service' ? 'bg-green-500' : 'bg-slate-200'}`} style={{ width: step !== 'service' ? '100%' : '0%' }}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'datetime' || step === 'confirm' ? 'bg-green-500 text-white' : step === 'provider' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
              2
            </div>
            <div className="flex-1 h-1 bg-slate-200">
              <div className={`h-full ${step === 'datetime' || step === 'confirm' ? 'bg-green-500' : 'bg-slate-200'}`} style={{ width: step === 'datetime' || step === 'confirm' ? '100%' : '0%' }}></div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirm' ? 'bg-green-500 text-white' : step === 'datetime' ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
              3
            </div>
          </div>
        </div>

        {step === 'service' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Escolha um Serviço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-4 h-4" />
                      {service.duration_min} min
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      R$ {Number(service.price).toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'provider' && selectedService && (
          <div>
            <button
              onClick={() => setStep('service')}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Escolha um Profissional</h2>
            <p className="text-slate-600 mb-6">Serviço selecionado: {selectedService.name}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider)}
                  className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{provider.name}</h3>
                      {provider.email && (
                        <p className="text-slate-600 text-sm">{provider.email}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'datetime' && selectedService && selectedProvider && (
          <div>
            <button
              onClick={() => setStep('provider')}
              className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Escolha Data e Horário</h2>
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Alguma observação especial?"
                />
              </div>
              {bookingError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}
              <button
                onClick={handleDateTimeSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedService && selectedProvider && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Confirmar Agendamento</h2>
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto">
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-slate-600">Serviço</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedService.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Profissional</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedProvider.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Data e Horário</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Duração</p>
                  <p className="text-lg font-semibold text-slate-900">{selectedService.duration_min} minutos</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Valor</p>
                  <p className="text-lg font-semibold text-green-600">R$ {Number(selectedService.price).toFixed(2)}</p>
                </div>
                {notes && (
                  <div>
                    <p className="text-sm text-slate-600">Observações</p>
                    <p className="text-slate-900">{notes}</p>
                  </div>
                )}
              </div>
              {bookingError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {bookingError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('datetime')}
                  className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleBookingConfirm}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
