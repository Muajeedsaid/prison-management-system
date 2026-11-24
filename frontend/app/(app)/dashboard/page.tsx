'use client';

import Link from 'next/link';
import { Alert, Empty, fmtDate, Loading, PageHeader, StatusBadge } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useFetch } from '@/lib/hooks';
import { can, ROLE_LABELS } from '@/lib/permissions';
import { Summary } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (can(user.role, 'viewReports')) return <ControllerDashboard />;

  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName}`} subtitle={ROLE_LABELS[user.role]} />
      <div className="card">
        <h2>What you can do here</h2>
        <ul>
          {can(user.role, 'readInmates') && <li>Open <Link href="/inmates">Inmates</Link> to search records and open a file.</li>}
          {can(user.role, 'createInmate') && <li>Register new inmates from the Inmates page.</li>}
          {can(user.role, 'viewCells') && <li>Check cell occupancy on the <Link href="/cells">Cells</Link> page.</li>}
          {can(user.role, 'manageUsers') && <li>Create staff accounts and assign roles under <Link href="/users">Staff accounts</Link>.</li>}
          {can(user.role, 'viewAudit') && <li>Review who did what in the <Link href="/audit">Audit log</Link>.</li>}
        </ul>
        <p className="muted">You only see the parts of the system your role needs.</p>
      </div>
    </>
  );
}

function ControllerDashboard() {
  const { data, error, loading } = useFetch<Summary>('/reports/summary');
  if (loading) return <Loading />;
  if (error || !data) return <Alert>{error || 'No data'}</Alert>;

  const maxAdmissions = Math.max(1, ...data.admissionsByMonth.map((m) => m.count));

  return (
    <>
      <PageHeader title="Facility overview" subtitle="Live numbers from the records system" />

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card stat">
          <div className="num">{data.inCustody}</div>
          <div className="label">Inmates in custody</div>
        </div>
        <div className="card stat">
          <div className="num">{data.occupancy.occupancyRate}%</div>
          <div className="label">
            Occupancy ({data.occupancy.occupied} of {data.occupancy.totalCapacity} beds)
          </div>
        </div>
        <div className="card stat">
          <div className="num">{data.totalInmates}</div>
          <div className="label">Total records (all statuses)</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Inmates by status</h2>
          {Object.keys(data.byStatus).length === 0 ? (
            <Empty>No inmates yet.</Empty>
          ) : (
            <table>
              <tbody>
                {Object.entries(data.byStatus).map(([status, count]) => (
                  <tr key={status}>
                    <td><StatusBadge value={status} /></td>
                    <td style={{ textAlign: 'right' }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2>Admissions, last 6 months</h2>
          <div className="bars">
            {data.admissionsByMonth.map((m) => (
              <div key={m.month} className="bar">
                {m.count}
                <i style={{ height: `${(m.count / maxAdmissions) * 80}%` }} />
                <span className="muted">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Court dates in the next 14 days</h2>
          {data.upcomingCourtDates.length === 0 ? (
            <Empty>No court dates coming up.</Empty>
          ) : (
            <table>
              <tbody>
                {data.upcomingCourtDates.map((c) => (
                  <tr key={c._id}>
                    <td>
                      {c.inmate ? <Link href={`/inmates/${c.inmate._id}`}>{c.inmate.fullName}</Link> : '-'}
                      <div className="muted">{c.caseNumber}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtDate(c.nextCourtDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2>Releases due in the next 30 days</h2>
          {data.upcomingReleases.length === 0 ? (
            <Empty>No sentences ending soon.</Empty>
          ) : (
            <table>
              <tbody>
                {data.upcomingReleases.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link href={`/inmates/${r._id}`}>{r.fullName}</Link>
                      <div className="muted">{r.inmateNumber}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>{fmtDate(r.expectedReleaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
