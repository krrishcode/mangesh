'use client';

import { useState, type FormEvent } from 'react';
import { accountApi, useAccountData } from '../../useAccountData';
import type { Address } from '../../account';
import { AccountDialog, AccountEmpty, AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';
import { AccountIcon } from '../ui/AccountIcon';

type AddressForm = Omit<Address, 'id'> & { id?: number };
const emptyAddress: AddressForm = { label: 'shipping', isDefault: false, fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };

export function AddressesView() {
  const { data, loading, error, refreshError, reload } = useAccountData<Address[]>('/users/me/addresses');
  const [editor, setEditor] = useState<AddressForm | null>(null);
  const [removing, setRemoving] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState(false);
  function openEditor(address?: Address) { setFormError(''); setEditor(address ? { ...address } : { ...emptyAddress }); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!editor) return; setSaving(true); setFormError('');
    const { id, ...payload } = editor;
    try {
      await accountApi(`/users/me/addresses${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setEditor(null); setFeedbackError(false); setFeedback(id ? 'Address updated.' : 'Address added.'); reload();
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'We couldn’t save this address. Check the details and try again.'); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!removing) return; setSaving(true); setFormError('');
    try { await accountApi(`/users/me/addresses/${removing.id}`, { method: 'DELETE' }); setRemoving(null); setFeedbackError(false); setFeedback('Address removed.'); reload(); }
    catch { setFormError('We couldn’t remove this address. Please try again.'); }
    finally { setSaving(false); }
  }
  async function makeDefault(address: Address) {
    if (saving) return;
    setSaving(true); setFeedback(''); setFeedbackError(false);
    try { await accountApi(`/users/me/addresses/${address.id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) }); setFeedback('Default address updated.'); }
    catch (reason) { setFeedbackError(true); setFeedback(reason instanceof Error ? reason.message : 'Unable to update the default address.'); }
    finally { setSaving(false); }
  }
  return <div className="account-stack">
    <div className="account-toolbar"><p className="account-muted">{loading || error ? 'Your saved addresses' : `${data?.length || 0} saved ${data?.length === 1 ? 'address' : 'addresses'}`}</p><button type="button" className="account-button" disabled={saving} onClick={() => openEditor()}><AccountIcon name="plus" />Add address</button></div>
    <AccountFeedback message={feedback} error={feedbackError} />
    {refreshError && <AccountFeedback message="Your addresses could not be refreshed. Showing saved details." error />}
    {loading ? <AccountLoading /> : error ? <AccountError retry={reload} /> : !data?.length ? <AccountEmpty title="An address for every occasion" icon="pin"><p>Save a delivery or billing address to make your next checkout simpler.</p><button className="account-button secondary" onClick={() => openEditor()}>Add your first address</button></AccountEmpty> : <div className="account-address-grid">{data.map((address) => <article key={address.id} className="account-panel account-address-card">
      <header className="account-panel-heading"><h2>{address.label === 'shipping' ? 'Delivery address' : 'Billing address'}</h2>{address.isDefault && <span className="account-badge active">Default</span>}</header>
      <address className="account-address-lines"><strong>{address.fullName}</strong><span>{address.line1}</span>{address.line2 && <span>{address.line2}</span>}<span>{address.city}, {address.state} {address.postalCode}</span><span>{address.country}</span><span className="account-address-phone">{address.phone}</span></address>
      <div className="account-card-actions"><button className="account-link" disabled={saving} onClick={() => openEditor(address)}>Edit</button>{!address.isDefault && <button className="account-link" disabled={saving} onClick={() => makeDefault(address)}>Set as default</button>}<button className="account-link account-danger" disabled={saving} onClick={() => { setFormError(''); setRemoving(address); }}>Remove</button></div>
    </article>)}</div>}
    {editor && <AccountDialog title={editor.id ? 'Edit address' : 'Add address'} busy={saving} onClose={() => setEditor(null)}>
      <form onSubmit={save}>
        <div className="account-form-grid">
          <label className="account-full-width">Full name<input autoComplete="name" required minLength={2} value={editor.fullName} onChange={(event) => setEditor({ ...editor, fullName: event.target.value })} /></label>
          <label>Phone<input type="tel" autoComplete="tel" required minLength={6} maxLength={32} value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })} /></label>
          <label>Address type<select value={editor.label} onChange={(event) => setEditor({ ...editor, label: event.target.value as Address['label'] })}><option value="shipping">Delivery</option><option value="billing">Billing</option></select></label>
          <label className="account-full-width">Address line 1<input autoComplete="address-line1" required minLength={4} value={editor.line1} onChange={(event) => setEditor({ ...editor, line1: event.target.value })} /></label>
          <label className="account-full-width">Address line 2 <span className="account-muted">(optional)</span><input autoComplete="address-line2" value={editor.line2 || ''} onChange={(event) => setEditor({ ...editor, line2: event.target.value })} /></label>
          <label>City<input autoComplete="address-level2" required minLength={2} value={editor.city} onChange={(event) => setEditor({ ...editor, city: event.target.value })} /></label>
          <label>State / region<input autoComplete="address-level1" required minLength={2} value={editor.state} onChange={(event) => setEditor({ ...editor, state: event.target.value })} /></label>
          <label>Postal code<input autoComplete="postal-code" required minLength={4} maxLength={16} value={editor.postalCode} onChange={(event) => setEditor({ ...editor, postalCode: event.target.value })} /></label>
          <label>Country<input autoComplete="country-name" required value={editor.country} onChange={(event) => setEditor({ ...editor, country: event.target.value })} /></label>
        </div>
        <label className="account-checkbox"><input type="checkbox" checked={editor.isDefault} onChange={(event) => setEditor({ ...editor, isDefault: event.target.checked })} />Use as my default {editor.label === 'shipping' ? 'delivery' : 'billing'} address</label>
        <AccountFeedback message={formError} error />
        <div className="account-form-actions"><button className="account-button" disabled={saving}>{saving ? 'Saving…' : 'Save address'}</button><button type="button" className="account-button secondary" onClick={() => setEditor(null)}>Cancel</button></div>
      </form>
    </AccountDialog>}
    {removing && <AccountDialog title="Remove this address?" busy={saving} onClose={() => setRemoving(null)}>
      <p className="account-muted">The saved address for {removing.fullName} at {removing.line1} will be removed.</p><AccountFeedback message={formError} error />
      <div className="account-form-actions"><button className="account-button danger" disabled={saving} onClick={remove}>{saving ? 'Removing…' : 'Remove address'}</button><button className="account-button secondary" onClick={() => setRemoving(null)}>Keep address</button></div>
    </AccountDialog>}
  </div>;
}
