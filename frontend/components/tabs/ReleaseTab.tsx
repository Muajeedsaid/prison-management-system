'use client';

import { FormEvent } from 'react';
import { Alert, Field, fmtDate } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useSubmit } from '@/lib/hooks';
import { Inmate } from '@/lib/types';

export function ReleaseTab({ inmate, onChanged }: { inmate: Inmate; onChanged: () => void }) {
  const { run, busy, error } = useSubmit();

  if (inmate.status === 'released') {
    return (
      <div className="card">
        <Alert tone="info">This inmate was released on {fmtDate(inmate.actualReleaseDate)}. The record is now closed.</Alert>
      </div>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm('Release this inmate? This frees their cell and closes the record. It cannot be undone.')) return;
    const v = formValues(e.currentTarget);
    run(() => api.post(`/inmates/${inmate._id}/release`, v), onChanged);
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>Process release</h2>
      <p className="muted" style={{ marginBottom: 14 }}>
        Expected release date: {fmtDate(inmate.expectedReleaseDate)}
      </p>
      <Alert>{error}</Alert>
      <div className="form-grid">
        <Field label="Release date"><input name="releaseDate" type="date" required /></Field>
        <Field label="Reason">
          <select name="reason" defaultValue="sentence-completed">
            <option value="sentence-completed">Sentence completed</option>
            <option value="bail">Bail</option>
            <option value="acquittal">Acquittal</option>
            <option value="pardon">Pardon</option>
            <option value="transfer">Transfer</option>
          </select>
        </Field>
      </div>
      <Field label="Notes"><textarea name="notes" /></Field>
      <button className="btn btn-danger" disabled={busy}>{busy ? 'Processing...' : 'Release inmate'}</button>
    </form>
  );
}
