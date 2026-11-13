'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { useAdmin } from '@/features/auth/AdminGate';
import { signOut } from '@/features/auth/session';
import { Button } from '@/shared/ui';

interface NavItem {
  label: string;
  href?: string;
}

// Sections without `href` arrive in the next phases of the CMS.
const navItems: readonly NavItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Trilhas e lições', href: '/trilhas' },
  { label: 'Sinais', href: '/sinais' },
  { label: 'Estudos', href: '/estudos' },
  { label: 'Operadores', href: '/operadores' },
];

const itemClassName =
  'flex items-center justify-between rounded-sm px-3 py-2 font-semibold no-underline';

function NavEntry({ label, href, active }: NavItem & { active: boolean }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={`${itemClassName} text-text-subtle`}>
        {label}
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-bold text-text-muted">
          em breve
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${itemClassName} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? 'bg-accent-soft text-accent-dark' : 'text-text-body'
      }`}
    >
      {label}
    </Link>
  );
}

// A section stays marked on its inner pages (e.g. /sinais/novo).
function isActive(href: string | undefined, pathname: string): boolean {
  if (!href) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppLayout({ children }: { children: ReactNode }) {
  const admin = useAdmin();
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-border bg-surface px-4 py-6 md:border-r md:border-b-0">
        <div className="text-lg font-bold text-accent">Libras CMS</div>
        <nav aria-label="Seções do CMS">
          <ul className="grid gap-1.5">
            {navItems.map((item) => (
              <li key={item.label}>
                <NavEntry {...item} active={isActive(item.href, pathname)} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto grid gap-2 text-[13px]">
          <div>
            <strong>{admin.name}</strong>
            <div className="text-text-muted">{admin.email}</div>
          </div>
          <Link
            href="/conta/senha"
            aria-current={pathname === '/conta/senha' ? 'page' : undefined}
            className="text-accent-dark underline-offset-2 hover:underline"
          >
            Minha senha
          </Link>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sair
          </Button>
        </div>
      </aside>
      <main className="grid content-start gap-6 p-4 md:p-8">{children}</main>
    </div>
  );
}
