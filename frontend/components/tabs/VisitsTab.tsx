'use client';

import { FormEvent } from 'react';
import { Alert, Empty, Field, fmtDateTime, Loading, StatusBadge, toIso } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Role, Visit } from '@/lib/types';

export function VisitsTab({ inmateId, role, released }: { inmateId: string; role: Role; released: boolean }) {
  const { data, error, loading, reload } = useFetch<Visit[]>(`/inmates/${inmateId}/visits`);
  const create = useSubmit();
  const status = useSubmit();

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    const body: Record<string, unknown> = { visitorName: v.visitorName, visitDate: toIso(v.visitDate) };
    if (v.visitorPhone) body.visitorPhone = v.visitorPhone;
    if (v.relationship) body.relationship = v.relationship;
    if (v.durationMinutes) body.durationMinutes = Number(v.durationMinutes);
    if (v.notes) body.notes = v.notes;
    create.run(() => api.post(`/inmates/${inmateId}/visits`, body), () => { form.reset(); reload(); });
  }

  const setStatus = (id: string, s: string) => status.run(() => api.patch(`/visits/${id}`, { status: s }), reload);

  return (
    <>
      {can(role, 'createVisit') && !released && (
        <form className="card" onSubmit={onCreate}>
          <h2>Schedule a visit</h2>
          <Alert>{create.error}</Alert>
          <div className="form-grid">
            <Field label="Visitor name"><input name="visitorName" required /></Field>
            <Field label="Visitor phone"><input name="visitorPhone" /></Field>
            <Field label="Relationship"><input name="relationship" /></Field>
            <Field label="Date and time"><input name="visitDate" type="datetime-local" required /></Field>
            <Field label="Duration (minutes)"><input name="durationMinutes" type="number" min={5} max={240} /></Field>
            <Field label="Notes"><input name="notes" /></Field>
          </div>
          <button className="btn" disabled={create.busy}>{create.busy ? 'Saving...' : 'Schedule visit'}</button>
        </form>
      )}

      <Alert>{error || status.error}</Alert>
      <div className="card table-wrap">
        <h2>Visit log</h2>
        {loading && !data ? <Loading /> : !data || data.length === 0 ? <Empty>No visits recorded.</Empty> : (
          <table>
            <thead><tr><th>When</th><th>Visitor</th><th>Relationship</th><th>Status</th>{can(role, 'createVisit') && <th />}</tr></thead>
            <tbody>
              {data.map((v) => (
                <tr key={v._id}>
                  <td>{fmtDateTime(v.visitDate)}</td>
                  <td>{v.visitorName}<div className="muted">{v.visitorPhone}</div></td>
                  <td>{v.relationship ?? '-'}</td>
                  <td><StatusBadge value={v.status} /></td>
                  {can(role, 'createVisit') && (
                    <td>
                      {v.status === 'scheduled' && (
                        <div className="actions">
                          <button className="btn btn-light btn-sm" disabled={status.busy} onClick={() => setStatus(v._id, 'completed')}>Complete</button>
                          <button className="btn btn-light btn-sm" disabled={status.busy} onClick={() => setStatus(v._id, 'denied')}>Deny</button>
                          <button className="btn btn-light btn-sm" disabled={status.busy} onClick={() => setStatus(v._id, 'cancelled')}>Cancel</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
