'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Alert, Empty, fmtDate, Loading, PageHeader, Pagination, StatusBadge } from '@/components/ui';
import { qs } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useDebounced, useFetch } from '@/lib/hooks';
import { can } from '@/lib/permissions';
import { Inmate, Paginated } from '@/lib/types';

export default function InmatesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const { data, error, loading } = useFetch<Paginated<Inmate>>(
    `/inmates${qs({ search: debounced, status, page, limit: 15, sort: '-createdAt' })}`,
  );

  return (
    <>
      <PageHeader
        title="Inmates"
        subtitle="Search and open inmate records"
        actions={
          can(user?.role, 'createInmate') && (
            <Link href="/inmates/new" className="btn">
              Register inmate
            </Link>
          )
        }
      />

      <div className="toolbar">
        <input
          placeholder="Search by name or inmate number"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="awaiting-trial">Awaiting trial</option>
          <option value="convicted">Convicted</option>
          <option value="released">Released</option>
          <option value="transferred-out">Transferred out</option>
        </select>
      </div>

      <Alert>{error}</Alert>
      <div className="card table-wrap">
        {loading && !data ? (
          <Loading />
        ) : !data || data.data.length === 0 ? (
          <Empty>No inmates match your search.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Name</th>
                <th>Status</th>
                <th>Cell</th>
                <th>Admitted</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((i) => (
                <tr key={i._id}>
                  <td>{i.inmateNumber}</td>
                  <td>
                    <Link href={`/inmates/${i._id}`}>{i.fullName}</Link>
                  </td>
                  <td>
                    <StatusBadge value={i.status} />
                  </td>
                  <td>{i.cell ? `${i.cell.block} / ${i.cell.name}` : 'Not assigned'}</td>
                  <td>{fmtDate(i.admissionDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.data.length > 0 && <Pagination meta={data.meta} onPage={setPage} />}
      </div>
    </>
  );
}
