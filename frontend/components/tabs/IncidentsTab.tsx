'use client';

import { FormEvent } from 'react';
import { Alert, Empty, Field, fmtDateTime, Loading, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Incident, Role } from '@/lib/types';

export function IncidentsTab({ inmateId, role }: { inmateId: string; role: Role }) {
  const { data, error, loading, reload } = useFetch<Incident[]>(`/inmates/${inmateId}/incidents`);
  const create = useSubmit();

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    create.run(() => api.post(`/inmates/${inmateId}/incidents`, v), () => { form.reset(); reload(); });
  }

  return (
    <>
      {can(role, 'createIncident') && (
        <form className="card" onSubmit={onCreate}>
          <h2>File an incident report</h2>
          <Alert>{create.error}</Alert>
          <div className="form-grid">
            <Field label="Type">
              <select name="type" defaultValue="misconduct">
                <option value="fight">Fight</option>
                <option value="contraband">Contraband</option>
                <option value="escape-attempt">Escape attempt</option>
                <option value="injury">Injury</option>
                <option value="misconduct">Misconduct</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Severity">
              <select name="severity" defaultValue="low">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>
          <Field label="What happened"><textarea name="description" required minLength={5} /></Field>
          <Field label="Action taken"><input name="actionTaken" /></Field>
          <button className="btn" disabled={create.busy}>{create.busy ? 'Saving...' : 'File report'}</button>
        </form>
      )}

      <Alert>{error}</Alert>
      <div className="card table-wrap">
        <h2>Incident history</h2>
        {loading && !data ? <Loading /> : !data || data.length === 0 ? <Empty>No incidents recorded.</Empty> : (
          <table>
            <thead><tr><th>When</th><th>Type</th><th>Severity</th><th>Details</th><th>Reported by</th></tr></thead>
            <tbody>
              {data.map((i) => (
                <tr key={i._id}>
                  <td>{fmtDateTime(i.occurredAt)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{i.type.replace('-', ' ')}</td>
                  <td><StatusBadge value={i.severity} /></td>
                  <td>{i.description}{i.actionTaken && <div className="muted">Action: {i.actionTaken}</div>}</td>
                  <td>{i.reportedBy?.fullName ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
