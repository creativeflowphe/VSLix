import { Settings, Briefcase, Users, Clock, BarChart3, Calendar, ChevronLeft, ChevronRight, Menu, X, Bell, Tag, Palette, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Painel' },
    { id: 'admin', icon: BarChart3, label: 'Analytics', isLink: true },
    { id: 'services', icon: Briefcase, label: 'Serviços' },
    { id: 'providers', icon: Users, label: 'Profissionais' },
    { id: 'schedule', icon: Calendar, label: 'Agenda' },
    { id: 'notifications', icon: Bell, label: 'Notificações' },
    { id: 'marketing', icon: Tag, label: 'Marketing' },
    { id: 'reviews', icon: Star, label: 'Avaliações' },
    { id: 'theme', icon: Palette, label: 'Tema' },
    { id: 'hours', icon: Clock, label: 'Horários' },
    { id: 'settings', icon: Settings, label: 'Configurações' },
  ];

  const handleSectionChange = (section: string, isLink?: boolean) => {
    if (isLink && section === 'admin') {
      window.history.pushState({}, '', '/admin');
      window.location.href = '/admin';
      return;
    }
    onSectionChange(section);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden"
          style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}
        >
          {mobileOpen ? (
            <X className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          ) : (
            <Menu className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          )}
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 h-full transition-transform duration-300 z-40 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{
            width: '260px',
            backgroundColor: 'var(--bg-card)',
            borderRight: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
                Gestão
              </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id, item.isLink)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                    style={{
                      backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 h-full transition-all duration-300 z-40 hidden md:block"
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {!collapsed && (
            <h2 className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              Gestão
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id, item.isLink)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  collapsed ? 'justify-center' : ''
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
