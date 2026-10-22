'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../../../stores/authStore';
import type { UserDto } from '../../../../types';
import { accountApi, useAccountData } from '../../useAccountData';
import { AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';

const dimensions = [{ key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'sleeveLength', label: 'Sleeve length' }, { key: 'inseam', label: 'Inseam' }] as const;
type Measurements = Partial<Record<typeof dimensions[number]['key'], string | number | null>> & { unit?: 'inches' | 'cm' };

export function ProfileView() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();
  const measurementData = useAccountData<Measurements | null>('/users/me/measurements');
  const security = useAccountData<{ passwordEnabled: boolean; googleConnected: boolean }>('/auth/security');
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [measurements, setMeasurements] = useState<Measurements>({ unit: 'inches' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingMeasurements, setSavingMeasurements] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', error: false });
  const [measurementMessage, setMeasurementMessage] = useState({ text: '', error: false });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  useEffect(() => { if (!measurementData.loading && !measurementData.error) setMeasurements(measurementData.data || { unit: 'inches' }); }, [measurementData.data, measurementData.loading, measurementData.error]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setSavingProfile(true); setProfileMessage({ text: '', error: false });
    try {
      const response = await accountApi<{ data: UserDto }>('/users/me', { method: 'PUT', body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), phone: phone || null }) });
      setAuth(response.data, token!); setProfileMessage({ text: 'Personal details saved.', error: false });
    } catch { setProfileMessage({ text: 'We couldn’t save your details. Please try again.', error: true }); }
    finally { setSavingProfile(false); }
  }
  async function saveMeasurements(event: FormEvent) {
    event.preventDefault(); setSavingMeasurements(true); setMeasurementMessage({ text: '', error: false });
    const payload: Record<string, string | number | null> = { unit: measurements.unit || 'inches' };
    dimensions.forEach(({ key }) => { payload[key] = measurements[key] === '' || measurements[key] == null ? null : Number(measurements[key]); });
    try {
      await accountApi('/users/me/measurements', { method: 'PUT', body: JSON.stringify(payload) });
      setMeasurementMessage({ text: 'Measurements saved.', error: false });
    } catch { setMeasurementMessage({ text: 'We couldn’t save your measurements. Please try again.', error: true }); }
    finally { setSavingMeasurements(false); }
  }
  function changeUnit(unit: 'inches' | 'cm') {
    const factor = unit === 'cm' ? 2.54 : 1 / 2.54;
    const converted = { ...measurements, unit };
    dimensions.forEach(({ key }) => { const value = measurements[key]; if (value !== '' && value != null) converted[key] = Math.round(Number(value) * factor * 100) / 100; });
    setMeasurements(converted);
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault(); setPasswordError('');
    if (passwords.next !== passwords.confirm) { setPasswordError('The new passwords do not match.'); return; }
    setSavingPassword(true);
    try {
      await accountApi('/users/me/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }) });
      useAuthStore.getState().logout(); router.replace('/login?passwordUpdated=1');
    } catch (reason) { setPasswordError(reason instanceof Error ? reason.message : 'Unable to change your password.'); }
    finally { setSavingPassword(false); }
  }
  return <div className="account-stack">
    <section className="account-panel"><header className="account-section-intro"><h2>Personal details</h2><p>Your name and contact information.</p></header>
      <form onSubmit={saveProfile}>
        <div className="account-form-grid">
          <label>First name<input name="given-name" autoComplete="given-name" required minLength={1} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
          <label>Last name<input name="family-name" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
          <label className="account-full-width">Email<input type="email" value={user?.email || ''} readOnly aria-describedby="account-email-note" /><small id="account-email-note">Your email is used to sign in.</small></label>
          <label className="account-full-width">Phone<input type="tel" name="tel" autoComplete="tel" maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        </div>
        <div className="account-form-actions"><button className="account-button" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save details'}</button><AccountFeedback message={profileMessage.text} error={profileMessage.error} /></div>
      </form>
    </section>
    <section className="account-panel"><header className="account-section-intro"><h2>Measurements</h2><p>Keep your measurements up to date for fittings.</p></header>
      {measurementData.loading ? <AccountLoading /> : measurementData.error ? <AccountError retry={measurementData.reload} /> : <form onSubmit={saveMeasurements}>
        <label className="account-unit-field">Unit<select value={measurements.unit || 'inches'} onChange={(event) => changeUnit(event.target.value as 'inches' | 'cm')}><option value="inches">Inches</option><option value="cm">Centimetres</option></select></label>
        <div className="account-form-grid account-measurements">{dimensions.map(({ key, label }) => <label key={key}>{label}<div className="account-input-unit"><input type="number" min="0.01" max="200" step="0.01" inputMode="decimal" value={measurements[key] ?? ''} onChange={(event) => setMeasurements({ ...measurements, [key]: event.target.value })} /><span>{measurements.unit === 'cm' ? 'cm' : 'in'}</span></div></label>)}</div>
        <div className="account-form-actions"><button className="account-button secondary" disabled={savingMeasurements}>{savingMeasurements ? 'Saving…' : 'Save measurements'}</button><AccountFeedback message={measurementMessage.text} error={measurementMessage.error} /></div>
      </form>}
    </section>
    <section className="account-panel"><header className="account-section-intro"><h2>Sign-in & security</h2><p>{security.data?.googleConnected ? 'Google is connected to your account.' : 'Manage your account password.'}</p></header>
      {security.loading ? <AccountLoading /> : security.error ? <AccountError retry={security.reload} /> : !security.data?.passwordEnabled ? <div className="account-stack"><p>You sign in with Google. To also use a password, request an email reset link.</p><Link href="/forgot-password" className="account-link">Set up an account password</Link></div> : <form onSubmit={changePassword}><p className="account-muted">Changing your password signs out your existing sessions.</p><div className="account-form-grid">
        <label className="account-full-width">Current password<input type="password" autoComplete="current-password" required value={passwords.current} onChange={event => setPasswords({ ...passwords, current: event.target.value })} /></label>
        <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={passwords.next} onChange={event => setPasswords({ ...passwords, next: event.target.value })} /></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={passwords.confirm} onChange={event => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
      </div><div className="account-form-actions"><button className="account-button secondary" disabled={savingPassword}>{savingPassword ? 'Updating…' : 'Update password'}</button><AccountFeedback message={passwordError} error /></div></form>}
    </section>
  </div>;
}
