'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AdminShell } from './components/AdminShell';
import { AdminLoginView } from './components/views/AdminLoginView';
import { DashboardView } from './components/views/DashboardView';
import { ProductsView } from './components/views/ProductsView';
import { CategoriesView } from './components/views/CategoriesView';
import { OrdersView } from './components/views/OrdersView';
import { CustomersView } from './components/views/CustomersView';
import { AppointmentsView } from './components/views/AppointmentsView';
import { ReviewsView } from './components/views/ReviewsView';
import { SettingsView } from './components/views/SettingsView';
import { ProductFormView } from './components/views/ProductFormView';
import { PaymentsView } from './components/views/PaymentsView';

export const AdminApp: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [mounted, setMounted] = useState(false);

  // Helper to extract clean route from window.location (path-first, with hash-fallback migration)
  const parseRouteFromLocation = (): string => {
    // 1. If someone lands with legacy hash e.g. #/products/new, migrate cleanly
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
      if (cleanHash) {
        window.history.replaceState({}, '', `/admin/${cleanHash}`);
        return cleanHash;
      }
    }

    // 2. Parse from pathname: e.g. /admin/products/new -> 'products/new'
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/admin\/?(.*)/);
    if (match && match[1]) {
      const sub = match[1].replace(/\/$/, '');
      return sub || 'dashboard';
    }

    return 'dashboard';
  };

  useEffect(() => {
    setMounted(true);

    const updateRoute = () => {
      setCurrentRoute(parseRouteFromLocation());
    };

    updateRoute();
    window.addEventListener('popstate', updateRoute);
    return () => window.removeEventListener('popstate', updateRoute);
  }, []);

  const navigateTo = (route: string) => {
    const cleanRoute = route.replace(/^\/+/, '').replace(/\/+$/, '');
    const targetPath = cleanRoute === 'dashboard' || !cleanRoute ? '/admin' : `/admin/${cleanRoute}`;
    window.history.pushState({}, '', targetPath);
    setCurrentRoute(cleanRoute || 'dashboard');
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0C0A09' }}>
        <div style={{ color: '#A8A29E', fontSize: 13, letterSpacing: '0.04em' }}>INITIALIZING ENTERPRISE CONSOLE...</div>
      </div>
    );
  }

  // Enterprise Auth Gate: If not authenticated or not an admin, render the dedicated Admin Login Screen
  const isAdmin = isAuthenticated && user?.role === 'admin';
  if (!isAdmin) {
    return <AdminLoginView onSuccess={() => navigateTo('dashboard')} />;
  }

  const renderView = () => {
    if (currentRoute === 'products/new') {
      return <ProductFormView onNavigate={navigateTo} />;
    }
    if (currentRoute.startsWith('products/edit/')) {
      const id = Number(currentRoute.replace('products/edit/', ''));
      return <ProductFormView productId={id} onNavigate={navigateTo} />;
    }

    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView onNavigate={navigateTo} />;
      case 'products':
        return <ProductsView onNavigate={navigateTo} />;
      case 'categories':
        return <CategoriesView />;
      case 'orders':
        return <OrdersView />;
      case 'payments':
        return <PaymentsView onNavigate={navigateTo} />;
      case 'customers':
        return <CustomersView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'reviews':
        return <ReviewsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={navigateTo} />;
    }
  };

  return (
    <AdminShell
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      adminName={user?.name || 'Administrator'}
      onLogout={logout}
    >
      {renderView()}
    </AdminShell>
  );
};
