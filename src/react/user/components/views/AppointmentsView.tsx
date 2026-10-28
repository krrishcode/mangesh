'use client';

import { useState, type FormEvent } from 'react';
import { accountApi, useAccountData } from '../../useAccountData';
import { dateLabel, type Appointment } from '../../account';
import { AccountDialog, AccountEmpty, AccountError, AccountFeedback, AccountLoading } from '../ui/AccountElements';
import { StatusBadge } from '../ui/StatusBadge';
import { AccountIcon } from '../ui/AccountIcon';

const indiaInput = (date: Date) => new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 16);

export function AppointmentsView() {
  const { data, loading, error, refreshError, reload } = useAccountData<Appointment[]>('/appointments');
  const [filter, setFilter] = useState('all');
  const [editor, setEditor] = useState<Appointment | 'new' | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ location: '', occasion: '', scheduledAt: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');
  function openEditor(appointment?: Appointment) {
    setFormError('');
    setForm(appointment ? { location: appointment.location, occasion: appointment.occasion, scheduledAt: indiaInput(new Date(appointment.scheduled_at)), notes: appointment.notes || '' } : { location: '', occasion: '', scheduledAt: '', notes: '' });
    setEditor(appointment || 'new');
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!editor) return;
    const date = new Date(`${form.scheduledAt}:00+05:30`);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) { setFormError('Choose a future date and time.'); return; }
    setSaving(true); setFormError('');
    try {
      const isNew = editor === 'new';
      await accountApi(isNew ? '/appointments' : `/appointments/${editor.id}/reschedule`, {
        method: isNew ? 'POST' : 'PATCH',
        body: JSON.stringify(isNew ? { ...form, scheduledAt: date.toISOString() } : { scheduledAt: date.toISOString() }),
      });
      setEditor(null); setFeedback(isNew ? 'Appointment booked.' : 'Appointment rescheduled.'); reload();
    } catch (reason) { setFormError(reason instanceof Error ? reason.message : 'We couldn’t save this appointment. Please try again.'); }
    finally { setSaving(false); }
  }
  async function cancel() {
    if (!cancelling) return; setSaving(true); setFormError('');
    try { await accountApi(`/appointments/${cancelling.id}/cancel`, { method: 'PATCH' }); setCancelling(null); setFeedback('Appointment cancelled.'); reload(); }
    catch { setFormError('We couldn’t cancel this appointment. Please try again.'); }
    finally { setSaving(false); }
  }
  const filtered = data?.filter(appointment => filter === 'all' || appointment.status === filter);
  return <div className="account-stack">
    <div className="account-toolbar"><p className="account-muted">All times shown in IST</p><div className="account-toolbar-actions"><label className="account-filter">Show<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All visits</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><button className="account-button" disabled={saving} onClick={() => openEditor()}><AccountIcon name="plus" />Book a visit</button></div></div>
    <AccountFeedback message={feedback} />
    {refreshError && <AccountFeedback message="Your appointments could not be refreshed. Showing saved visits." error />}
    {loading ? <AccountLoading /> : error ? <AccountError retry={reload} /> : !data?.length ? <AccountEmpty title="Your next visit, made personal" icon="calendar"><p>Arrange a fitting, update your measurements or explore styling with our team.</p><button className="account-button secondary" onClick={() => openEditor()}>Book your first visit</button></AccountEmpty> : !filtered?.length ? <AccountEmpty title="No visits with this status" icon="calendar"><p>Choose another filter to see your appointments.</p><button className="account-button secondary" onClick={() => setFilter('all')}>Show all visits</button></AccountEmpty> : filtered.map((appointment) => <article className="account-panel account-appointment" key={appointment.id}>
      <div className="account-appointment-date"><span>{new Intl.DateTimeFormat('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(appointment.scheduled_at))}</span><span>{new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(appointment.scheduled_at))}</span></div>
      <div className="account-appointment-information"><div className="account-summary-top"><h2>{appointment.location}</h2><StatusBadge status={appointment.status} /></div><p className="account-muted">{appointment.occasion}</p><p className="account-appointment-time">{dateLabel(appointment.scheduled_at, true)}</p>{appointment.notes && <p className="account-muted">{appointment.notes}</p>}
        {appointment.status === 'upcoming' && <div className="account-card-actions"><button className="account-link" onClick={() => openEditor(appointment)}>Reschedule</button><button className="account-link account-muted" onClick={() => { setFormError(''); setCancelling(appointment); }}>Cancel appointment</button></div>}
      </div>
    </article>)}
    {editor && <AccountDialog title={editor === 'new' ? 'Book an appointment' : 'Reschedule appointment'} busy={saving} onClose={() => setEditor(null)}>
      <form onSubmit={save}><p className="account-form-note">Choose a date and time in India Standard Time (IST).</p>
        <div className="account-form-grid">
          {editor === 'new' && <><label className="account-full-width">Preferred location<input required minLength={2} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="account-full-width">Occasion / purpose<input required minLength={2} value={form.occasion} onChange={(event) => setForm({ ...form, occasion: event.target.value })} /></label></>}
          <label className="account-full-width">Date and time (IST)<input type="datetime-local" required min={indiaInput(new Date())} value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} /></label>
          {editor === 'new' && <label className="account-full-width">Notes <span className="account-muted">(optional)</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>}
        </div>
        <AccountFeedback message={formError} error />
        <div className="account-form-actions"><button className="account-button" disabled={saving}>{saving ? 'Saving…' : editor === 'new' ? 'Book appointment' : 'Save new date'}</button><button type="button" className="account-button secondary" onClick={() => setEditor(null)}>Cancel</button></div>
      </form>
    </AccountDialog>}
    {cancelling && <AccountDialog title="Cancel this appointment?" busy={saving} onClose={() => setCancelling(null)}>
      <p className="account-muted">Your appointment at {cancelling.location} on {dateLabel(cancelling.scheduled_at, true)} will be cancelled.</p><AccountFeedback message={formError} error />
      <div className="account-form-actions"><button className="account-button danger" disabled={saving} onClick={cancel}>{saving ? 'Cancelling…' : 'Cancel appointment'}</button><button className="account-button secondary" onClick={() => setCancelling(null)}>Keep appointment</button></div>
    </AccountDialog>}
  </div>;
}
