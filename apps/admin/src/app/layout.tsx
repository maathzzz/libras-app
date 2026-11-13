import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminGate } from '@/features/auth/AdminGate';
import { AppLayout } from '@/features/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Libras CMS',
  robots: { index: false, follow: false },
};

// Every page of the CMS sits behind the gate, so it wraps the whole tree here.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AdminGate>
          <AppLayout>{children}</AppLayout>
        </AdminGate>
      </body>
    </html>
  );
}
