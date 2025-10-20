import { useState, useEffect } from 'react';
import { Tag, Gift, Percent, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Campaign {
  id: string;
  name: string;
  type: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number;
  uses_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export default function MarketingCampaigns({ salonId }: { salonId: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'discount',
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase: 0,
    max_uses: null as number | null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
  });

  useEffect(() => {
    loadCampaigns();
  }, [salonId]);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('salon_id', salonId)
      .order('created_at', { ascending: false });

    if (data) setCampaigns(data);
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code });
  };

  const handleSave = async () => {
    const payload = {
      salon_id: salonId,
      name: formData.name,
      type: formData.type,
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_purchase: formData.min_purchase,
      max_uses: formData.max_uses,
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,
      is_active: formData.is_active,
    };

    if (editingId) {
      await supabase.from('marketing_campaigns').update(payload).eq('id', editingId);
    } else {
      await supabase.from('marketing_campaigns').insert(payload);
    }

    resetForm();
    loadCampaigns();
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'discount',
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase: 0,
      max_uses: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
    });
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setFormData({
      name: campaign.name,
      type: campaign.type,
      code: campaign.code,
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value,
      min_purchase: campaign.min_purchase,
      max_uses: campaign.max_uses,
      valid_from: campaign.valid_from.split('T')[0],
      valid_until: campaign.valid_until.split('T')[0],
      is_active: campaign.is_active,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this campaign?')) {
      await supabase.from('marketing_campaigns').delete().eq('id', id);
      loadCampaigns();
    }
  };

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="w-5 h-5" />;
      case 'gift_card':
        return <Gift className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Marketing Campaigns</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{editingId ? 'Edit' : 'Create'} Campaign</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                placeholder="Summer Sale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="discount">Discount</option>
                <option value="coupon">Coupon</option>
                <option value="gift_card">Gift Card</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="SUMMER20"
                />
                <button
                  onClick={generateCode}
                  className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Purchase ($)
              </label>
              <input
                type="number"
                value={formData.min_purchase}
                onChange={(e) =>
                  setFormData({ ...formData, min_purchase: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Uses (optional)
              </label>
              <input
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_uses: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                min="1"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="campaign_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
            />
            <label htmlFor="campaign_active" className="text-sm text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Save className="w-4 h-4" />
              Save Campaign
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">{getCampaignIcon(campaign.type)}</div>
                <div>
                  <h3 className="font-medium text-slate-900">{campaign.name}</h3>
                  <p className="text-sm text-slate-500">{campaign.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(campaign)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Code:</span>
                <span className="font-mono font-medium">{campaign.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount:</span>
                <span className="font-medium">
                  {campaign.discount_type === 'percentage' ? `${campaign.discount_value}%` : `$${campaign.discount_value}`}
                </span>
              </div>
              {campaign.max_uses && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Uses:</span>
                  <span>
                    {campaign.uses_count} / {campaign.max_uses}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Valid:</span>
                <span className="text-xs">
                  {new Date(campaign.valid_from).toLocaleDateString()} -{' '}
                  {new Date(campaign.valid_until).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-2">
                {campaign.is_active ? (
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
          </div>
        ))}

        {campaigns.length === 0 && !isCreating && (
          <div className="col-span-2 text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">No campaigns yet</p>
            <p className="text-sm text-slate-500">
              Create discount codes and promotions to attract customers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
