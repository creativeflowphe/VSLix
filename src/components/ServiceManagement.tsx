import { useState, useEffect } from 'react';
import { supabase, Service, Provider } from '../lib/supabase';
import { Plus, Edit2, Trash2, Clock, DollarSign, Users, ToggleLeft, ToggleRight } from 'lucide-react';

interface ServiceManagementProps {
  salonId: string;
}

type Tab = 'details' | 'time' | 'providers';

export default function ServiceManagement({ salonId }: ServiceManagementProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    fetchData();
  }, [salonId]);

  const fetchData = async () => {
    try {
      const [servicesRes, providersRes] = await Promise.all([
        supabase.from('services').select('*').eq('salon_id', salonId),
        supabase.from('providers').select('*').eq('salon_id', salonId),
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (providersRes.data) setProviders(providersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'details' as Tab, label: 'Detalhes', icon: Edit2 },
    { id: 'time' as Tab, label: 'Duração', icon: Clock },
    { id: 'providers' as Tab, label: 'Profissionais', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Gerenciar Serviços
        </h2>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300"
          style={{
            background: 'var(--gradient-gold)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-all duration-300"
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : 'none',
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {service.name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <DollarSign className="w-4 h-4" />
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Clock className="w-4 h-4" />
                        {service.duration_min} min
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-all"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      {service.is_active ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-all"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-red-500 transition-all"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {services.length === 0 && (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum serviço cadastrado</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'time' && (
            <div className="space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                Configure a duração de cada serviço
              </p>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-4">
              <p style={{ color: 'var(--text-secondary)' }}>
                Atribua profissionais aos serviços
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
