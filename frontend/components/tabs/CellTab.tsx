'use client';

import { FormEvent } from 'react';
import { Alert, Empty, Field, fmtDateTime, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Cell, Role, Transfer } from '@/lib/types';

export function CellTab({
  inmateId,
  role,
  released,
  onChanged,
}: {
  inmateId: string;
  role: Role;
  released: boolean;
  onChanged: () => void;
}) {
  const history = useFetch<Transfer[]>(`/inmates/${inmateId}/transfers`);
  const cells = useFetch<Cell[]>(can(role, 'transfer') ? '/cells' : null);
  const move = useSubmit();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = formValues(e.currentTarget);
    move.run(
      () => api.post(`/inmates/${inmateId}/transfers`, { toCellId: v.toCellId, reason: v.reason }),
      () => {
        history.reload();
        cells.reload();
        onChanged();
      },
    );
  }

  const free = (cells.data ?? []).filter((c) => c.isActive && c.available > 0);

  return (
    <>
      {can(role, 'transfer') && !released && (
        <form className="card" onSubmit={onSubmit}>
          <h2>Assign or move to a cell</h2>
          <Alert>{move.error}</Alert>
          <div className="form-grid">
            <Field label="Destination cell" hint="Only cells with free space are listed">
              <select name="toCellId" required defaultValue="">
                <option value="" disabled>Choose a cell</option>
                {free.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.block} / {c.name} ({c.available} free)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason"><input name="reason" /></Field>
          </div>
          <button className="btn" disabled={move.busy}>{move.busy ? 'Moving...' : 'Move inmate'}</button>
        </form>
      )}

      <div className="card table-wrap">
        <h2>Cell history</h2>
        <Alert>{history.error}</Alert>
        {history.loading && !history.data ? <Loading /> : !history.data || history.data.length === 0 ? <Empty>No cell moves yet.</Empty> : (
          <table>
            <thead><tr><th>When</th><th>From</th><th>To</th><th>Reason</th><th>By</th></tr></thead>
            <tbody>
              {history.data.map((t) => (
                <tr key={t._id}>
                  <td>{fmtDateTime(t.createdAt)}</td>
                  <td>{t.fromCell ? `${t.fromCell.block} / ${t.fromCell.name}` : 'First allocation'}</td>
                  <td>{t.toCell.block} / {t.toCell.name}</td>
                  <td>{t.reason ?? '-'}</td>
                  <td>{t.transferredBy?.fullName ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
