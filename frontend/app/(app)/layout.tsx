'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { can, Permission, ROLE_LABELS } from '@/lib/permissions';
import { Loading } from '@/components/ui';

const NAV: { href: string; label: string; permission?: Permission }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inmates', label: 'Inmates', permission: 'readInmates' },
  { href: '/cells', label: 'Cells', permission: 'viewCells' },
  { href: '/users', label: 'Staff accounts', permission: 'manageUsers' },
  { href: '/audit', label: 'Audit log', permission: 'viewAudit' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Not logged in? Go to the login page.
  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) return <div className="content"><Loading /></div>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          PMIS
          <small>Correctional facility records</small>
        </div>
        <nav className="nav">
          {NAV.filter((item) => !item.permission || can(user.role, item.permission)).map((item) => (
            <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="userbox">
          <strong>{user.fullName}</strong>
          <span>{ROLE_LABELS[user.role]}</span>
          <button
            className="btn btn-light btn-sm"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
