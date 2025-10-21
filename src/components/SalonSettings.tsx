import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Store, Link as LinkIcon, Save, Check, AlertCircle } from 'lucide-react';

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
}

export default function SalonSettings() {
  const { user } = useAuth();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSalon();
  }, [user]);

  const loadSalon = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSalon(data);
        setName(data.name);
        setSlug(data.slug);
        setAddress(data.address || '');
        setPhone(data.phone || '');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!salon) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      if (!name.trim()) {
        throw new Error('Nome do salão é obrigatório');
      }

      if (!slug.trim()) {
        throw new Error('URL da página é obrigatória');
      }

      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error('URL da página deve conter apenas letras minúsculas, números e hífens');
      }

      if (salon) {
        const { error } = await supabase
          .from('salons')
          .update({
            name,
            slug,
            address,
            phone,
          })
          .eq('id', salon.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('salons')
          .insert({
            owner_user_id: user?.id,
            name,
            slug,
            address,
            phone,
            subscription_status: 'active',
          });

        if (error) throw error;
      }

      setSuccess(true);
      await loadSalon();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const bookingUrl = slug ? `${window.location.origin}/book/${slug}` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Configurações do Salão
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure as informações do seu negócio e sua página de agendamentos
        </p>
      </div>

      <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Store className="w-4 h-4 inline mr-2" />
              Nome do Salão
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Ex: Salão Beleza Pura"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <LinkIcon className="w-4 h-4 inline mr-2" />
              URL da Página de Agendamentos
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              className="w-full px-4 py-3 rounded-xl transition-all font-mono"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="ex: beleza-pura"
              required
              disabled={!!salon}
            />
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {slug ? `Sua página: ${window.location.origin}/book/${slug}` : 'Digite o nome do salão para gerar a URL'}
            </p>
            {salon && (
              <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                A URL não pode ser alterada após a criação
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Endereço
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="(00) 00000-0000"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Configurações salvas com sucesso!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'var(--gradient-gold)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>

        {salon && bookingUrl && (
          <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Compartilhe sua página de agendamentos
            </h3>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                Envie este link para seus clientes:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookingUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg font-mono text-sm"
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bookingUrl);
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
