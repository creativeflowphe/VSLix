import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin, User, DollarSign, Gift, Package, Users, Repeat, ListPlus, ChevronRight, ChevronLeft } from 'lucide-react';
import Login from './Login';

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
  add_ons: Array<{ name: string; price: number }>;
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

interface SalonBookingProps {
  salonSlug: string;
}

export default function SalonBooking({ salonSlug }: SalonBookingProps) {
  const { user, loading: authLoading } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; price: number }>>([]);
  const [bookingType, setBookingType] = useState<'individual' | 'group' | 'recurring' | 'package'>('individual');
  const [groupSize, setGroupSize] = useState(1);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [recurringCount, setRecurringCount] = useState(4);
  const [notes, setNotes] = useState('');
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadSalonData();
  }, [salonSlug]);

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
        .eq('slug', salonSlug)
        .maybeSingle();

      if (salonError) throw salonError;
      if (!salonData) {
        console.error('Salon not found');
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
      console.error('Error loading salon data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedProvider || !selectedDate || !salon) return;

    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const providerSchedule = selectedProvider.schedule?.[dayOfWeek];

    if (!providerSchedule) {
      setAvailableSlots([]);
      return;
    }

    const startHour = parseInt(providerSchedule.start.split(':')[0]);
    const endHour = parseInt(providerSchedule.end.split(':')[0]);
    const serviceDuration = selectedService.duration_min;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59`);

    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('provider_id', selectedProvider.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }

    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotStart = new Date(`${dateStr}T${timeStr}:00`);
        const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

        const isAvailable = !existingBookings?.some(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });

        slots.push({ time: timeStr, available: isAvailable });
      }
    }

    setAvailableSlots(slots);
  };

  const handleBooking = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    if (!selectedService || !selectedProvider || !selectedDate || !selectedTime || !salon) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(':');
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endTime = new Date(startTime.getTime() + selectedService.duration_min * 60000);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          service_id: selectedService.id,
          provider_id: selectedProvider.id,
          client_id: user.id,
          salon_id: salon.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
          payment_status: 'unpaid',
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'booking_created',
          message: `Seu agendamento em ${salon.name} foi criado com sucesso!`,
          read: false,
        });

      alert('Agendamento realizado com sucesso!');
      resetBooking();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      alert(error.message || 'Erro ao criar agendamento');
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedProvider(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedAddOns([]);
    setNotes('');
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

  const calculateTotalPrice = () => {
    let total = selectedService?.price || 0;
    selectedAddOns.forEach(addon => {
      total += addon.price;
    });
    if (bookingType === 'group') {
      total *= groupSize;
    } else if (bookingType === 'recurring') {
      total *= recurringCount;
    }
    return total;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Salão não encontrado</h1>
          <p style={{ color: 'var(--text-secondary)' }}>O salão que você está procurando não existe.</p>
        </div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return <Login />;
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{salon.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <MapPin className="w-4 h-4" />
              <span>{salon.address}</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <User className="w-4 h-4" />
              <span>{salon.phone}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Novo Agendamento</h2>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: step >= s ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: step >= s ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {step === 1 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Tipo de Agendamento</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { type: 'individual', icon: User, label: 'Individual' },
                      { type: 'group', icon: Users, label: 'Grupo' },
                      { type: 'recurring', icon: Repeat, label: 'Recorrente' },
                      { type: 'package', icon: Package, label: 'Pacote' },
                    ].map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        onClick={() => setBookingType(type as any)}
                        className="p-4 rounded-xl border-2 transition-all"
                        style={{
                          backgroundColor: bookingType === type ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          borderColor: bookingType === type ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: bookingType === type ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        <span className="font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>

                  {bookingType === 'group' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Tamanho do Grupo
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={groupSize}
                        onChange={(e) => setGroupSize(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  )}

                  {bookingType === 'recurring' && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Frequência
                        </label>
                        <select
                          value={recurringFrequency}
                          onChange={(e) => setRecurringFrequency(e.target.value as any)}
                          className="w-full px-4 py-3 rounded-xl"
                          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          <option value="weekly">Semanal</option>
                          <option value="biweekly">Quinzenal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Número de Sessões
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="12"
                          value={recurringCount}
                          onChange={(e) => setRecurringCount(parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl"
                          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-semibold mb-4 mt-6" style={{ color: 'var(--text-primary)' }}>Selecione o Serviço</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className="p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                          backgroundColor: selectedService?.id === service.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          borderColor: selectedService?.id === service.id ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: selectedService?.id === service.id ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                            <p className="text-sm opacity-80 mb-2">{service.description}</p>
                            <div className="flex gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {service.duration_min} min
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                R$ {service.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedService && selectedService.add_ons && selectedService.add_ons.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add-ons Disponíveis</h3>
                      <div className="space-y-2">
                        {selectedService.add_ons.map((addon: any, index: number) => (
                          <label key={index} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                            <input
                              type="checkbox"
                              checked={selectedAddOns.some(a => a.name === addon.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAddOns([...selectedAddOns, addon]);
                                } else {
                                  setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
                                }
                              }}
                              className="w-5 h-5"
                            />
                            <span className="flex-1" style={{ color: 'var(--text-primary)' }}>{addon.name}</span>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>+ R$ {addon.price.toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Selecione o Profissional</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider)}
                        className="p-4 rounded-xl border-2 transition-all text-left"
                        style={{
                          backgroundColor: selectedProvider?.id === provider.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          borderColor: selectedProvider?.id === provider.id ? 'var(--accent-primary)' : 'var(--border-color)',
                          color: selectedProvider?.id === provider.id ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{provider.name}</h4>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Selecione a Data</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                      </button>
                      <span className="px-4 py-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-sm font-semibold py-2" style={{ color: 'var(--text-secondary)' }}>
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentMonth).map((day, index) => (
                      <button
                        key={index}
                        onClick={() => day && day >= new Date() && setSelectedDate(day)}
                        disabled={!day || day < new Date()}
                        className="aspect-square rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                        style={{
                          backgroundColor: day && selectedDate?.toDateString() === day.toDateString() ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                          color: day && selectedDate?.toDateString() === day.toDateString() ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        {day?.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Selecione o Horário</h3>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className="p-3 rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: selectedTime === slot.time ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: selectedTime === slot.time ? 'white' : 'var(--text-primary)',
                          }}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Não há horários disponíveis para esta data.</p>
                      <label className="flex items-center justify-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joinWaitlist}
                          onChange={(e) => setJoinWaitlist(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span style={{ color: 'var(--text-primary)' }}>Entrar na lista de espera</span>
                      </label>
                    </div>
                  )}

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Observações (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Informações adicionais sobre seu agendamento..."
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 rounded-xl font-semibold transition-all"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    Voltar
                  </button>
                )}
                {step < 4 && (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && !selectedService) ||
                      (step === 2 && !selectedProvider) ||
                      (step === 3 && !selectedDate)
                    }
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
                  >
                    Continuar
                  </button>
                )}
                {step === 4 && (
                  <button
                    onClick={handleBooking}
                    disabled={!selectedTime && !joinWaitlist}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)' }}
                  >
                    {joinWaitlist ? 'Entrar na Lista de Espera' : 'Confirmar Agendamento'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl sticky top-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Resumo</h3>
              <div className="space-y-3 text-sm">
                {bookingType && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Tipo:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {bookingType === 'individual' ? 'Individual' :
                       bookingType === 'group' ? `Grupo (${groupSize})` :
                       bookingType === 'recurring' ? `Recorrente (${recurringCount}x)` :
                       'Pacote'}
                    </span>
                  </div>
                )}
                {selectedService && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Serviço:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedService.name}</span>
                  </div>
                )}
                {selectedProvider && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Profissional:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedProvider.name}</span>
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Data:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Horário:</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTime}</span>
                  </div>
                )}
                {selectedAddOns.length > 0 && (
                  <div>
                    <div className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Add-ons:</div>
                    {selectedAddOns.map((addon, index) => (
                      <div key={index} className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-secondary)' }}>• {addon.name}</span>
                        <span style={{ color: 'var(--text-primary)' }}>R$ {addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t mt-4 pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Total:</span>
                  <span className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                    R$ {calculateTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
