'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert, Badge, Field, Loading, PageHeader, Pagination } from '@/components/ui';
import { api, qs } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formValues, useFetch, useSubmit } from '@/lib/hooks';
import { can, ROLE_LABELS } from '@/lib/permissions';
import { Paginated, Role, StaffUser } from '@/lib/types';

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export default function UsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useFetch<Paginated<StaffUser>>(`/users${qs({ page, limit: 15 })}`);
  const create = useSubmit();
  const update = useSubmit();

  useEffect(() => {
    if (user && !can(user.role, 'manageUsers')) router.replace('/dashboard');
  }, [user, router]);

  function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const v = formValues(form);
    create.run(
      () => api.post('/users', { fullName: v.fullName, email: v.email, password: v.password, role: v.role }),
      () => {
        form.reset();
        reload();
      },
    );
  }

  return (
    <>
      <PageHeader title="Staff accounts" subtitle="Create accounts and assign roles" />
      <Alert>{error || update.error}</Alert>

      <form className="card" onSubmit={onCreate}>
        <h2>New staff account</h2>
        <Alert>{create.error}</Alert>
        <div className="form-grid">
          <Field label="Full name"><input name="fullName" required minLength={2} /></Field>
          <Field label="Email"><input name="email" type="email" required /></Field>
          <Field label="Temporary password" hint="At least 8 characters">
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue="records">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
        </div>
        <button className="btn" disabled={create.busy}>{create.busy ? 'Creating...' : 'Create account'}</button>
      </form>

      <div className="card table-wrap">
        {loading && !data ? (
          <Loading />
        ) : (
          data && (
            <>
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={u._id === user?.id || update.busy}
                          onChange={(e) => update.run(() => api.patch(`/users/${u._id}`, { role: e.target.value }), reload)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </td>
                      <td>{u.isActive ? <Badge tone="green">active</Badge> : <Badge tone="red">deactivated</Badge>}</td>
                      <td>
                        {u._id !== user?.id && (
                          <button
                            className="btn btn-light btn-sm"
                            disabled={update.busy}
                            onClick={() => update.run(() => api.patch(`/users/${u._id}`, { isActive: !u.isActive }), reload)}
                          >
                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={data.meta} onPage={setPage} />
            </>
          )
        )}
      </div>
    </>
  );
}
