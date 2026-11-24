'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Empty, fmtDateTime, Loading, PageHeader, Pagination } from '@/components/ui';
import { qs } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useDebounced, useFetch } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { AuditEntry, Paginated } from '@/lib/types';

export default function AuditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [who, setWho] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(who);
  const { data, error, loading } = useFetch<Paginated<AuditEntry>>(
    `/audit-logs${qs({ user: debounced, method, page, limit: 25 })}`,
  );

  useEffect(() => {
    if (user && !can(user.role, 'viewAudit')) router.replace('/dashboard');
  }, [user, router]);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every change and login, newest first. This log is read-only." />
      <div className="toolbar">
        <input placeholder="Filter by user email" value={who} onChange={(e) => { setWho(e.target.value); setPage(1); }} />
        <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          <option value="POST">POST (create)</option>
          <option value="PATCH">PATCH (update)</option>
          <option value="DELETE">DELETE (archive)</option>
        </select>
      </div>
      <Alert>{error}</Alert>
      <div className="card table-wrap">
        {loading && !data ? (
          <Loading />
        ) : !data || data.data.length === 0 ? (
          <Empty>No entries.</Empty>
        ) : (
          <>
            <table>
              <thead>
                <tr><th>When</th><th>User</th><th>Action</th><th>Result</th><th>IP</th></tr>
              </thead>
              <tbody>
                {data.data.map((a) => (
                  <tr key={a._id}>
                    <td>{fmtDateTime(a.createdAt)}</td>
                    <td>{a.userEmail ?? '-'}<div className="muted">{a.role}</div></td>
                    <td><strong>{a.method}</strong> {a.path}</td>
                    <td><Badge tone={a.statusCode < 400 ? 'green' : 'red'}>{a.statusCode}</Badge></td>
                    <td>{a.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
