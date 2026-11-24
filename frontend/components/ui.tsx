'use client';

import { ReactNode } from 'react';

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const fmtDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

/** "2026-11-25T10:00:00.000Z" -> value for <input type="datetime-local"> is not needed: we only send, never prefill. */
export const toIso = (localValue: string) => new Date(localValue).toISOString();

export function Badge({ tone = 'grey', children }: { tone?: 'grey' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

const STATUS_TONE: Record<string, 'grey' | 'green' | 'amber' | 'red' | 'blue'> = {
  'awaiting-trial': 'amber',
  convicted: 'blue',
  released: 'green',
  'transferred-out': 'grey',
  open: 'blue',
  adjourned: 'amber',
  closed: 'grey',
  scheduled: 'blue',
  completed: 'green',
  denied: 'red',
  cancelled: 'grey',
  low: 'grey',
  medium: 'amber',
  high: 'red',
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={STATUS_TONE[value] ?? 'grey'}>{value.replace(/-/g, ' ')}</Badge>;
}

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  if (!children) return null;
  return <div className={`alert alert-${tone}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

export function Loading({ what = 'Loading' }: { what?: string }) {
  return <p className="muted">{what}...</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: { page: number; totalPages: number; total: number };
  onPage: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span className="muted">
        {meta.total} record{meta.total === 1 ? '' : 's'} &middot; page {meta.page} of {meta.totalPages}
      </span>
      <div>
        <button className="btn btn-light" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          Previous
        </button>
        <button className="btn btn-light" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-light" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
