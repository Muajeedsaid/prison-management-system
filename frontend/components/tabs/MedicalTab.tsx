'use client';

import { FormEvent } from 'react';
import { Alert, Badge, Empty, Field, fmtDateTime, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { MedicalRecord, Role } from '@/lib/types';

export function MedicalTab({ inmateId, role }: { inmateId: string; role: Role }) {
  const { data, error, loading, reload } = useFetch<MedicalRecord[]>(`/inmates/${inmateId}/medical-records`);
  const create = useSubmit();

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    create.run(() => api.post(`/inmates/${inmateId}/medical-records`, v), () => { form.reset(); reload(); });
  }

  return (
    <>
      <Alert tone="info">Medical records are confidential. Only the Medical Officer and the Facility Controller can see this tab.</Alert>
      {can(role, 'createMedical') && (
        <form className="card" onSubmit={onCreate}>
          <h2>Add a medical record</h2>
          <Alert>{create.error}</Alert>
          <div className="form-grid">
            <Field label="Type">
              <select name="type" defaultValue="check-up">
                <option value="check-up">Check-up</option>
                <option value="treatment">Treatment</option>
                <option value="referral">Referral</option>
                <option value="emergency">Emergency</option>
              </select>
            </Field>
            <Field label="Diagnosis"><input name="diagnosis" required minLength={2} /></Field>
            <Field label="Treatment"><input name="treatment" /></Field>
            <Field label="Notes"><input name="notes" /></Field>
          </div>
          <button className="btn" disabled={create.busy}>{create.busy ? 'Saving...' : 'Save record'}</button>
        </form>
      )}

      <Alert>{error}</Alert>
      <div className="card table-wrap">
        <h2>Medical history</h2>
        {loading && !data ? <Loading /> : !data || data.length === 0 ? <Empty>No medical records.</Empty> : (
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Diagnosis</th><th>Treatment</th><th>By</th></tr></thead>
            <tbody>
              {data.map((m) => (
                <tr key={m._id}>
                  <td>{fmtDateTime(m.recordedAt)}</td>
                  <td><Badge tone={m.type === 'emergency' ? 'red' : 'blue'}>{m.type}</Badge></td>
                  <td>{m.diagnosis}{m.notes && <div className="muted">{m.notes}</div>}</td>
                  <td>{m.treatment ?? '-'}</td>
                  <td>{m.recordedBy?.fullName ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
