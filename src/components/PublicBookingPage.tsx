import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, Phone, DollarSign, User, ChevronLeft, ChevronRight, LogIn } from 'lucide-react';

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_min: number;
  price: number;
}

interface Provider {
  id: string;
  name: string;
  schedule: any;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (slug) {
      loadSalonData();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedProvider && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedProvider, selectedDate]);

  const loadSalonData = async () => {
    try {
      const { data: salonData, error: salonError } = await supabase
        .from('salons')
        .select('*')
        .eq('slug', slug)
        .eq('subscription_status', 'active')
        .maybeSingle();

      if (salonError) throw salonError;
      if (!salonData) {
        setError('Salão não encontrado');
        setLoading(false);
        return;
      }

      setSalon(salonData);

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('active', true);

      setServices(servicesData || []);

      const { data: providersData } = await supabase
        .from('providers')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('active', true);

      setProviders(providersData || []);
    } catch (err) {
      console.error('Error loading salon data:', err);
      setError('Erro ao carregar informações do salão');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedProvider || !selectedDate) return;

    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const providerSchedule = selectedProvider.schedule?.[dayOfWeek];

    if (!providerSchedule) {
      setAvailableSlots([]);
      return;
    }

    const startHour = parseInt(providerSchedule.start?.split(':')[0] || '9');
    const endHour = parseInt(providerSchedule.end?.split(':')[0] || '18');

    const dateStr = selectedDate.toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('provider_id', selectedProvider.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotStart = new Date(`${dateStr}T${timeStr}:00`);
        const slotEnd = new Date(slotStart.getTime() + selectedService.duration_min * 60000);

        const isBooked = existingBookings?.some((booking: any) => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });

        slots.push({
          time: timeStr,
          available: !isBooked && slotStart > new Date(),
        });
      }
    }

    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/customer');
      return;
    }

    if (!selectedService || !selectedProvider || !selectedDate || !selectedTime || !salon) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const endTime = new Date(startTime.getTime() + selectedService.duration_min * 60000);

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          salon_id: salon.id,
          service_id: selectedService.id,
          provider_id: selectedProvider.id,
          client_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed',
          payment_status: 'unpaid',
          notes,
        });

      if (bookingError) throw bookingError;

      setSuccess(true);
      setSelectedService(null);
      setSelectedProvider(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento');
    } finally {
      setBooking(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
      </div>
    );
  }

  if (error && !salon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Página não encontrada
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-md w-full text-center p-8 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Agendamento Confirmado!
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Seu agendamento foi realizado com sucesso. Você receberá uma confirmação em breve.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-3 rounded-xl font-semibold"
            style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
          >
            Fazer Outro Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 p-8 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {salon?.name}
          </h1>
          <div className="flex flex-wrap gap-4 mt-4" style={{ color: 'var(--text-secondary)' }}>
            {salon?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{salon.address}</span>
              </div>
            )}
            {salon?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{salon.phone}</span>
              </div>
            )}
          </div>
        </div>

        {!user && (
          <div className="mb-6 p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Faça login para agendar um horário
            </p>
            <button
              onClick={() => navigate('/customer')}
              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                1. Escolha o Serviço
              </h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: selectedService?.id === service.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedService?.id === service.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: selectedService?.id === service.id ? '#ffffff' : 'var(--text-primary)',
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <span className="font-bold">R$ {service.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm opacity-90">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration_min} min
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm mt-2 opacity-75">{service.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {selectedService && (
              <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  2. Escolha o Profissional
                </h2>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3"
                      style={{
                        backgroundColor: selectedProvider?.id === provider.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        border: `1px solid ${selectedProvider?.id === provider.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        color: selectedProvider?.id === provider.id ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      <User className="w-6 h-6" />
                      <span className="font-semibold">{provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedService && selectedProvider && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  3. Escolha a Data
                </h2>

                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </button>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text-secondary)' }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day && day >= new Date(new Date().setHours(0, 0, 0, 0)) && setSelectedDate(day)}
                      disabled={!day || day < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="aspect-square rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: selectedDate?.toDateString() === day?.toDateString() ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: selectedDate?.toDateString() === day?.toDateString() ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      {day?.getDate()}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && availableSlots.length > 0 && (
                <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    4. Escolha o Horário
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className="p-3 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: selectedTime === slot.time ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: selectedTime === slot.time ? '#ffffff' : 'var(--text-primary)',
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTime && (
                <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    5. Observações (opcional)
                  </h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    rows={3}
                    placeholder="Alguma observação especial?"
                  />

                  {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={booking || !user}
                    className="w-full mt-4 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
                  >
                    {booking ? 'Agendando...' : user ? 'Confirmar Agendamento' : 'Faça login para agendar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
