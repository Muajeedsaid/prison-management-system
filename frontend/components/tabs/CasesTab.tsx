'use client';

import { FormEvent, useState } from 'react';
import { Alert, Empty, Field, fmtDate, Loading, Modal, StatusBadge } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { CaseRecord, Role } from '@/lib/types';

export function CasesTab({ inmateId, role }: { inmateId: string; role: Role }) {
  const { data, error, loading, reload } = useFetch<CaseRecord[]>(`/inmates/${inmateId}/cases`);
  const create = useSubmit();
  const [editing, setEditing] = useState<CaseRecord | null>(null);

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    const body: Record<string, unknown> = { caseNumber: v.caseNumber };
    if (v.charges) body.charges = v.charges.split(',').map((c) => c.trim()).filter(Boolean);
    if (v.court) body.court = v.court;
    if (v.nextCourtDate) body.nextCourtDate = v.nextCourtDate;
    create.run(() => api.post(`/inmates/${inmateId}/cases`, body), () => { form.reset(); reload(); });
  }

  return (
    <>
      {can(role, 'createCase') && (
        <form className="card" onSubmit={onCreate}>
          <h2>Open a case</h2>
          <Alert>{create.error}</Alert>
          <div className="form-grid">
            <Field label="Case number"><input name="caseNumber" required /></Field>
            <Field label="Court"><input name="court" /></Field>
            <Field label="Charges" hint="Separate with commas"><input name="charges" /></Field>
            <Field label="Next court date"><input name="nextCourtDate" type="date" /></Field>
          </div>
          <button className="btn" disabled={create.busy}>{create.busy ? 'Saving...' : 'Open case'}</button>
        </form>
      )}

      <Alert>{error}</Alert>
      {loading && !data ? <Loading /> : !data || data.length === 0 ? <div className="card"><Empty>No cases recorded.</Empty></div> : data.map((c) => (
        <div className="card" key={c._id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0 }}>{c.caseNumber} <StatusBadge value={c.status} /></h2>
            {can(role, 'updateCase') && <button className="btn btn-light btn-sm" onClick={() => setEditing(c)}>Update</button>}
          </div>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Court</dt><dd>{c.court ?? '-'}</dd>
            <dt>Charges</dt><dd>{c.charges.length ? c.charges.join(', ') : '-'}</dd>
            <dt>Next court date</dt><dd>{fmtDate(c.nextCourtDate)}</dd>
            <dt>Bail</dt><dd>{c.bail ? (c.bail.granted ? `Granted${c.bail.amount ? ` (${c.bail.amount.toLocaleString()})` : ''}` : 'Not granted') : '-'}</dd>
            <dt>Judgment</dt><dd>{c.judgment ?? '-'}</dd>
          </dl>
        </div>
      ))}

      {editing && <UpdateCaseModal item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function UpdateCaseModal({ item, onClose, onSaved }: { item: CaseRecord; onClose: () => void; onSaved: () => void }) {
  const { run, busy, error } = useSubmit();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = formValues(e.currentTarget);
    const body: Record<string, unknown> = { status: v.status };
    if (v.nextCourtDate) body.nextCourtDate = v.nextCourtDate;
    if (v.judgment) body.judgment = v.judgment;
    if (v.sentenceMonths) body.sentenceMonths = Number(v.sentenceMonths);
    body.bail = { granted: v.bailGranted === 'yes', ...(v.bailAmount ? { amount: Number(v.bailAmount) } : {}) };
    run(() => api.patch(`/cases/${item._id}`, body), onSaved);
  }

  return (
    <Modal title={`Update ${item.caseNumber}`} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <div className="form-grid">
          <Field label="Status">
            <select name="status" defaultValue={item.status}>
              <option value="open">Open</option>
              <option value="adjourned">Adjourned</option>
              <option value="closed">Closed (needs a judgment)</option>
            </select>
          </Field>
          <Field label="Next court date"><input name="nextCourtDate" type="date" defaultValue={item.nextCourtDate?.slice(0, 10)} /></Field>
          <Field label="Bail granted?">
            <select name="bailGranted" defaultValue={item.bail?.granted ? 'yes' : 'no'}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </Field>
          <Field label="Bail amount"><input name="bailAmount" type="number" min={0} defaultValue={item.bail?.amount} /></Field>
          <Field label="Sentence (months)"><input name="sentenceMonths" type="number" min={1} defaultValue={item.sentenceMonths} /></Field>
        </div>
        <Field label="Judgment"><textarea name="judgment" defaultValue={item.judgment} /></Field>
        <div className="form-actions"><button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}
