import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../../lib/api';
import { FormField } from '../ui/FormField';

interface SettingItem {
  id?: number;
  settingKey: string;
  value: string;
}

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchApi<{ data: SettingItem[] }>('/admin/settings')
      .then(res => {
        if (res.data && res.data.length > 0) {
          const map: Record<string, string> = {};
          res.data.forEach(item => {
            map[item.settingKey] = item.value;
          });
          setSettings(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    setSuccessMsg(null);
    try {
      await fetchApi('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value: settings[key] }),
      });
      setSuccessMsg(`Setting "${key}" saved successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // ignore
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey('all');
    setSuccessMsg(null);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetchApi('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ key, value }),
        });
      }
      setSuccessMsg('All settings saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      // ignore
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Store Settings</h2>
          <p style={{ fontSize: 13, color: '#78716C', margin: '4px 0 0' }}>Configure global store parameters, contacts, and checkout policies</p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleSaveAll}
          disabled={savingKey === 'all'}
        >
          {savingKey === 'all' ? 'Saving All...' : 'Save All Changes'}
        </button>
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          marginBottom: 20,
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 6,
          color: '#065F46',
          fontSize: 13,
          fontWeight: 500,
        }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#78716C' }}>Loading settings...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* General Information */}
          <div className="admin-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', borderBottom: '1px solid var(--admin-border)', paddingBottom: 10 }}>
              General Store Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <FormField label="Store Brand Name">
                <input
                  type="text"
                  className="admin-input"
                  value={settings.store_name || ''}
                  onChange={e => handleChange('store_name', e.target.value)}
                />
              </FormField>
              <FormField label="Brand Tagline">
                <input
                  type="text"
                  className="admin-input"
                  value={settings.brand_tagline || ''}
                  onChange={e => handleChange('brand_tagline', e.target.value)}
                />
              </FormField>
              <FormField label="Support Email">
                <input
                  type="email"
                  className="admin-input"
                  value={settings.support_email || ''}
                  onChange={e => handleChange('support_email', e.target.value)}
                />
              </FormField>
              <FormField label="Support Phone">
                <input
                  type="text"
                  className="admin-input"
                  value={settings.support_phone || ''}
                  onChange={e => handleChange('support_phone', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Pricing & Checkout Settings */}
          <div className="admin-card">
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', borderBottom: '1px solid var(--admin-border)', paddingBottom: 10 }}>
              Pricing & Checkout Policy
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <FormField label="Store Currency">
                <select
                  className="admin-input"
                  value={settings.currency || 'INR'}
                  onChange={e => handleChange('currency', e.target.value)}
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </FormField>
              <FormField label="Applicable GST / Tax Rate (%)">
                <input
                  type="number"
                  className="admin-input"
                  value={settings.tax_rate || '18'}
                  onChange={e => handleChange('tax_rate', e.target.value)}
                />
              </FormField>
              <FormField label="Flat Shipping Rate (₹)">
                <input
                  type="number"
                  className="admin-input"
                  value={settings.shipping_flat_rate || '250'}
                  onChange={e => handleChange('shipping_flat_rate', e.target.value)}
                />
              </FormField>
              <FormField label="Free Shipping Threshold (₹)">
                <input
                  type="number"
                  className="admin-input"
                  value={settings.free_shipping_threshold || '10000'}
                  onChange={e => handleChange('free_shipping_threshold', e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
