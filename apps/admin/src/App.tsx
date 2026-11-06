import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';

import { AdminGate } from '@/features/auth/AdminGate';
import { HomePage } from '@/features/home/HomePage';
import { AppLayout } from '@/features/layout/AppLayout';

const router = createBrowserRouter([
  {
    element: (
      <AdminGate>
        <AppLayout />
      </AdminGate>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
