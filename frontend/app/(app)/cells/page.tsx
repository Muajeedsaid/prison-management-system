'use client';

import { FormEvent } from 'react';
import { Alert, Badge, Empty, Field, Loading, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Cell } from '@/lib/types';

export default function CellsPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useFetch<Cell[]>('/cells');
  const create = useSubmit();
  const toggle = useSubmit();
  const manage = can(user?.role, 'manageCells');

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    create.run(
      () => api.post('/cells', { block: v.block, name: v.name, capacity: Number(v.capacity) }),
      () => {
        form.reset();
        reload();
      },
    );
  }

  return (
    <>
      <PageHeader title="Cells" subtitle="Capacity and live occupancy" />
      <Alert>{error || toggle.error}</Alert>

      {manage && (
        <form className="card" onSubmit={onCreate}>
          <h2>Add a cell</h2>
          <Alert>{create.error}</Alert>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Field label="Block"><input name="block" required placeholder="A" /></Field>
            <Field label="Cell name"><input name="name" required placeholder="A-03" /></Field>
            <Field label="Capacity"><input name="capacity" type="number" min={1} max={200} required /></Field>
          </div>
          <button className="btn" disabled={create.busy}>{create.busy ? 'Saving...' : 'Add cell'}</button>
        </form>
      )}

      <div className="card table-wrap">
        {loading && !data ? (
          <Loading />
        ) : !data || data.length === 0 ? (
          <Empty>No cells have been set up yet.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Block</th><th>Cell</th><th>Occupancy</th><th>Status</th>{manage && <th />}
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id}>
                  <td>{c.block}</td>
                  <td>{c.name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div className="meter"><i className={c.occupied >= c.capacity ? 'full' : ''} style={{ width: `${Math.min(100, (c.occupied / c.capacity) * 100)}%` }} /></div>
                      {c.occupied} / {c.capacity}
                    </div>
                  </td>
                  <td>{c.isActive ? <Badge tone="green">in use</Badge> : <Badge>out of use</Badge>}</td>
                  {manage && (
                    <td>
                      <button
                        className="btn btn-light btn-sm"
                        disabled={toggle.busy}
                        onClick={() => toggle.run(() => api.patch(`/cells/${c._id}`, { isActive: !c.isActive }), reload)}
                      >
                        {c.isActive ? 'Take out of use' : 'Put back in use'}
                      </button>
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
