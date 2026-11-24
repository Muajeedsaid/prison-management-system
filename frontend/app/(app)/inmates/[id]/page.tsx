'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, fmtDate, Loading, Modal, PageHeader, Field, StatusBadge } from '@/components/ui';
import { CasesTab } from '@/components/tabs/CasesTab';
import { CellTab } from '@/components/tabs/CellTab';
import { IncidentsTab } from '@/components/tabs/IncidentsTab';
import { MedicalTab } from '@/components/tabs/MedicalTab';
import { ReleaseTab } from '@/components/tabs/ReleaseTab';
import { VisitsTab } from '@/components/tabs/VisitsTab';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can, Permission } from '@/lib/permissions';
import { Inmate } from '@/lib/types';

export default function InmateDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: inmate, error, loading, reload } = useFetch<Inmate>(`/inmates/${params.id}`);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const archive = useSubmit();

  // Only show the tabs this role is allowed to use.
  const tabs = useMemo(() => {
    const role = user?.role;
    const all: { key: string; label: string; perm?: Permission[] }[] = [
      { key: 'overview', label: 'Overview' },
      { key: 'cases', label: 'Cases', perm: ['viewCases'] },
      { key: 'cell', label: 'Cell', perm: ['transfer', 'viewCells'] },
      { key: 'visits', label: 'Visits', perm: ['viewVisits'] },
      { key: 'medical', label: 'Medical', perm: ['viewMedical'] },
      { key: 'incidents', label: 'Incidents', perm: ['viewIncidents'] },
      { key: 'release', label: 'Release', perm: ['release'] },
    ];
    return all.filter((t) => !t.perm || t.perm.some((p) => can(role, p)));
  }, [user?.role]);

  if (loading && !inmate) return <Loading />;
  if (error || !inmate || !user) return <Alert>{error || 'Inmate not found'}</Alert>;

  const role = user.role;
  const released = inmate.status === 'released';

  return (
    <>
      <PageHeader
        title={inmate.fullName}
        subtitle={`${inmate.inmateNumber} · ${inmate.cell ? `Cell ${inmate.cell.block}/${inmate.cell.name}` : 'No cell assigned'}`}
        actions={
          <>
            <StatusBadge value={inmate.status} />
            {can(role, 'editInmate') && !released && (
              <button className="btn btn-light" onClick={() => setEditing(true)}>Edit</button>
            )}
            {can(role, 'archiveInmate') && (
              <button
                className="btn btn-danger"
                disabled={archive.busy}
                onClick={() => {
                  if (!confirm('Archive this record? It will be hidden from lists but kept for history.')) return;
                  archive.run(() => api.del(`/inmates/${inmate._id}`), () => router.replace('/inmates'));
                }}
              >
                Archive
              </button>
            )}
          </>
        }
      />
      <Alert>{archive.error}</Alert>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card">
          <dl className="kv">
            <dt>Date of birth</dt><dd>{fmtDate(inmate.dateOfBirth)}</dd>
            <dt>Gender</dt><dd style={{ textTransform: 'capitalize' }}>{inmate.gender}</dd>
            <dt>Admission date</dt><dd>{fmtDate(inmate.admissionDate)}</dd>
            <dt>Sentence</dt><dd>{inmate.sentenceMonths ? `${inmate.sentenceMonths} months` : '-'}</dd>
            <dt>Expected release</dt><dd>{fmtDate(inmate.expectedReleaseDate)}</dd>
            {inmate.actualReleaseDate && (<><dt>Released on</dt><dd>{fmtDate(inmate.actualReleaseDate)}</dd></>)}
            <dt>Next of kin</dt>
            <dd>
              {inmate.nextOfKin
                ? `${inmate.nextOfKin.name} (${inmate.nextOfKin.relationship ?? 'relative'}) · ${inmate.nextOfKin.phone}`
                : '-'}
            </dd>
          </dl>
        </div>
      )}
      {tab === 'cases' && <CasesTab inmateId={inmate._id} role={role} />}
      {tab === 'cell' && <CellTab inmateId={inmate._id} role={role} released={released} onChanged={reload} />}
      {tab === 'visits' && <VisitsTab inmateId={inmate._id} role={role} released={released} />}
      {tab === 'medical' && <MedicalTab inmateId={inmate._id} role={role} />}
      {tab === 'incidents' && <IncidentsTab inmateId={inmate._id} role={role} />}
      {tab === 'release' && <ReleaseTab inmate={inmate} onChanged={reload} />}

      {editing && <EditModal inmate={inmate} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); reload(); }} />}
    </>
  );
}

function EditModal({ inmate, onClose, onSaved }: { inmate: Inmate; onClose: () => void; onSaved: () => void }) {
  const { run, busy, error } = useSubmit();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = formValues(e.currentTarget);
    const body: Record<string, unknown> = { fullName: v.fullName, status: v.status };
    if (v.sentenceMonths) body.sentenceMonths = Number(v.sentenceMonths);
    if (v.expectedReleaseDate) body.expectedReleaseDate = v.expectedReleaseDate;
    if (v.kinName && v.kinPhone) body.nextOfKin = { name: v.kinName, phone: v.kinPhone, relationship: v.kinRelationship };
    run(() => api.patch(`/inmates/${inmate._id}`, body), onSaved);
  }

  return (
    <Modal title="Edit inmate record" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <Alert>{error}</Alert>
        <Field label="Full name"><input name="fullName" defaultValue={inmate.fullName} required /></Field>
        <Field label="Status">
          <select name="status" defaultValue={inmate.status}>
            <option value="awaiting-trial">Awaiting trial</option>
            <option value="convicted">Convicted</option>
            <option value="transferred-out">Transferred out</option>
          </select>
        </Field>
        <div className="form-grid">
          <Field label="Sentence (months)"><input name="sentenceMonths" type="number" min={1} defaultValue={inmate.sentenceMonths} /></Field>
          <Field label="Expected release date">
            <input name="expectedReleaseDate" type="date" defaultValue={inmate.expectedReleaseDate?.slice(0, 10)} />
          </Field>
          <Field label="Next of kin name"><input name="kinName" defaultValue={inmate.nextOfKin?.name} /></Field>
          <Field label="Next of kin phone"><input name="kinPhone" defaultValue={inmate.nextOfKin?.phone} /></Field>
        </div>
        <Field label="Relationship"><input name="kinRelationship" defaultValue={inmate.nextOfKin?.relationship} /></Field>
        <div className="form-actions">
          <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}
