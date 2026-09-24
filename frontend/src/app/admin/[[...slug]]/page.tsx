import type { Metadata } from 'next';
import { AdminApp } from '@/react/admin/AdminApp';

export const metadata: Metadata = {
  title: 'Admin Panel | MANGESH MAHADEV',
  robots: { index: false, follow: false },
};

export default function AdminRoute() {
  return (
    <div className="admin-panel">
      <AdminApp />
    </div>
  );
}
