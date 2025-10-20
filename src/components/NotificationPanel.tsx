import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useState } from 'react';

export default function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all hover:bg-opacity-80"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <Bell className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl z-50"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="sticky top-0 p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Notificações
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 rounded-lg transition-all hover:bg-opacity-80"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg transition-all hover:bg-opacity-80"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                </button>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 transition-all cursor-pointer"
                    style={{
                      backgroundColor: notification.read ? 'transparent' : 'var(--bg-secondary)',
                    }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }} />
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 rounded-lg transition-all hover:bg-opacity-80"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
