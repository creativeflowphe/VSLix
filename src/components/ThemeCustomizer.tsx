import { useState, useEffect } from 'react';
import { Palette, Save, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ThemeSettings {
  theme_name: string;
  primary_color: string;
  secondary_color: string;
  custom_css: string;
  logo_url: string;
  custom_domain: string;
}

export default function ThemeCustomizer({ salonId }: { salonId: string }) {
  const [theme, setTheme] = useState<ThemeSettings>({
    theme_name: 'Minimal',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    custom_css: '',
    logo_url: '',
    custom_domain: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadTheme();
  }, [salonId]);

  const loadTheme = async () => {
    const { data } = await supabase
      .from('salon_themes')
      .select('*')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (data) {
      setTheme({
        theme_name: data.theme_name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        custom_css: data.custom_css || '',
        logo_url: data.logo_url || '',
        custom_domain: data.custom_domain || '',
      });
    }
  };

  const handleSave = async () => {
    const { data: existing } = await supabase
      .from('salon_themes')
      .select('id')
      .eq('salon_id', salonId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('salon_themes')
        .update({
          theme_name: theme.theme_name,
          primary_color: theme.primary_color,
          secondary_color: theme.secondary_color,
          custom_css: theme.custom_css,
          logo_url: theme.logo_url,
          custom_domain: theme.custom_domain,
          updated_at: new Date().toISOString(),
        })
        .eq('salon_id', salonId);
    } else {
      await supabase.from('salon_themes').insert({
        salon_id: salonId,
        theme_name: theme.theme_name,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        custom_css: theme.custom_css,
        logo_url: theme.logo_url,
        custom_domain: theme.custom_domain,
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { name: 'Minimal', description: 'Clean and modern', preview: 'bg-white text-black' },
    { name: 'Classic', description: 'Traditional elegance', preview: 'bg-amber-50 text-amber-900' },
    { name: 'Belle', description: 'Soft and luxurious', preview: 'bg-rose-50 text-rose-900' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Theme Customization</h2>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-lg font-medium mb-4">Theme Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <div
              key={t.name}
              onClick={() => setTheme({ ...theme, theme_name: t.name })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                theme.theme_name === t.name
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className={`${t.preview} h-24 rounded mb-3 flex items-center justify-center`}>
                <Palette className="w-8 h-8" />
              </div>
              <h4 className="font-medium">{t.name}</h4>
              <p className="text-sm text-slate-600">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <h3 className="text-lg font-medium">Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={theme.primary_color}
                onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.primary_color}
                onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={theme.secondary_color}
                onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.secondary_color}
                onChange={(e) => setTheme({ ...theme, secondary_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
        <h3 className="text-lg font-medium">Branding</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Logo URL</label>
          <input
            type="url"
            value={theme.logo_url}
            onChange={(e) => setTheme({ ...theme, logo_url: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="https://example.com/logo.png"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Custom Domain
          </label>
          <input
            type="text"
            value={theme.custom_domain}
            onChange={(e) => setTheme({ ...theme, custom_domain: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="bookings.yoursalon.com"
          />
          <p className="text-xs text-slate-500 mt-1">
            Configure DNS settings to point your domain to this platform
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-lg font-medium mb-2">Custom CSS</h3>
        <p className="text-sm text-slate-600 mb-4">
          Add custom styles to further personalize your booking page
        </p>
        <textarea
          value={theme.custom_css}
          onChange={(e) => setTheme({ ...theme, custom_css: e.target.value })}
          rows={8}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
          placeholder=".booking-button { background-color: #your-color; }"
        />
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="font-medium mb-2">Preview</h4>
        <div
          className="p-6 rounded-lg"
          style={{
            backgroundColor: theme.secondary_color,
            color: theme.primary_color,
          }}
        >
          <div className="space-y-3">
            <div className="text-2xl font-bold">Your Salon Name</div>
            <div
              className="inline-block px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: theme.primary_color,
                color: theme.secondary_color,
              }}
            >
              Book Appointment
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
        <button className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
          <Eye className="w-4 h-4" />
          Preview Live
        </button>
      </div>
    </div>
  );
}
