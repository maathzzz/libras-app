import { NavLink, Outlet } from 'react-router';

import { useAdmin } from '@/features/auth/AdminGate';
import { signOut } from '@/features/auth/session';

interface NavItem {
  label: string;
  to?: string;
}

// Sections without `to` arrive in the next phases of the CMS.
const navItems: readonly NavItem[] = [
  { label: 'Início', to: '/' },
  { label: 'Trilhas e lições' },
  { label: 'Sinais' },
  { label: 'Estudos' },
  { label: 'Publicar' },
  { label: 'Operadores' },
];

export function AppLayout() {
  const admin = useAdmin();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Libras CMS</div>
        <nav aria-label="Seções do CMS">
          <ul className="nav">
            {navItems.map(({ label, to }) => (
              <li key={label}>
                {to ? (
                  <NavLink to={to} end>
                    {label}
                  </NavLink>
                ) : (
                  <span aria-disabled="true">
                    {label}
                    <span className="badge">em breve</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="operator">
          <div>
            <strong>{admin.name}</strong>
            <div className="muted">{admin.email}</div>
          </div>
          <button className="button button--secondary" type="button" onClick={() => void signOut()}>
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
