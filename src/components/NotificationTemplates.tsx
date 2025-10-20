import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationTemplate {
  id: string;
  salon_id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
}

export default function NotificationTemplates({ salonId }: { salonId: string }) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as 'email' | 'sms' | 'whatsapp',
    subject: '',
    content: '',
    is_active: true,
  });

  useEffect(() => {
    loadTemplates();
  }, [salonId]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
  };

  const handleSave = async () => {
    if (editingId) {
      await supabase
        .from('notification_templates')
        .update({
          name: formData.name,
          type: formData.type,
          subject: formData.subject,
          content: formData.content,
          is_active: formData.is_active,
        })
        .eq('id', editingId);
    } else {
      await supabase
        .from('notification_templates')
        .insert({
          salon_id: salonId,
          name: formData.name,
          type: formData.type,
          subject: formData.subject,
          content: formData.content,
          is_active: formData.is_active,
          variables: ['customer_name', 'salon_name', 'booking_date', 'service_name'],
        });
    }

    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', type: 'email', subject: '', content: '', is_active: true });
    loadTemplates();
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content,
      is_active: template.is_active,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) {
      await supabase.from('notification_templates').delete().eq('id', id);
      loadTemplates();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Notification Templates</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{editingId ? 'Edit' : 'Create'} Template</h3>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                setFormData({ name: '', type: 'email', subject: '', content: '', is_active: true });
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="e.g., Booking Confirmation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          {formData.type === 'email' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Your booking at {{salon_name}}"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="Hi {{customer_name}}, your booking at {{salon_name}} for {{service_name}} on {{booking_date}} is confirmed!"
            />
            <p className="text-xs text-slate-500 mt-1">
              Available variables: {'{{customer_name}}'}, {'{{salon_name}}'}, {'{{booking_date}}'}, {'{{service_name}}'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                setFormData({ name: '', type: 'email', subject: '', content: '', is_active: true });
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-slate-100 rounded-lg">{getTypeIcon(template.type)}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{template.name}</h3>
                  <p className="text-sm text-slate-500">{template.type.toUpperCase()}</p>
                  {template.subject && (
                    <p className="text-sm text-slate-600 mt-1">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                    {template.content}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {template.is_active ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {templates.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No notification templates yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Create templates for automated booking confirmations and reminders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
