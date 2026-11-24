'use client';

import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Field } from '@/components/ui';
import { useSubmit } from '@/lib/hooks';
import { useAuth } from '@/lib/auth';

// Demo mode: set NEXT_PUBLIC_DEMO_MODE=true and NEXT_PUBLIC_DEMO_PASSWORD in .env.local
// to show one-click logins for the seeded demo accounts. Never enable with real data.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
const DEMO_ACCOUNTS = [
  { label: 'Facility Controller', email: 'controller@pms.local' },
  { label: 'Records Officer', email: 'records@pms.local' },
  { label: 'Cell Officer', email: 'cell@pms.local' },
  { label: 'Medical Officer', email: 'medical@pms.local' },
  { label: 'Court Liaison', email: 'court@pms.local' },
  { label: 'Visitor Desk', email: 'visitor@pms.local' },
  { label: 'System Admin', email: 'admin@pms.local' },
];

export default function LoginPage() {
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const { run, busy, error } = useSubmit();

  useEffect(() => {
    if (ready && user) router.replace('/dashboard');
  }, [ready, user, router]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(
      () => login(String(form.get('email')), String(form.get('password'))),
      () => router.replace('/dashboard'),
    );
  }

  function demoLogin(email: string) {
    run(() => login(email, DEMO_PASSWORD), () => router.replace('/dashboard'));
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Prison Management Information System</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Authorised staff only. All activity is recorded.
        </p>
        <Alert>{error}</Alert>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="username" autoFocus={!DEMO_MODE} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" />
        </Field>
        <button className="btn" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        {DEMO_MODE && (
          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
            <p className="muted" style={{ marginBottom: 10 }}>
              <strong>Demo mode.</strong> No account needed. Pick a role to explore (sample data only):
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="btn btn-light"
                  disabled={busy}
                  onClick={() => demoLogin(a.email)}
                >
                  Enter as {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}