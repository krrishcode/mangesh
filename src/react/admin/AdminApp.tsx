"use client";

import React, { useState, useEffect } from "react";
import { useAdminAuthStore } from "../../stores/adminAuthStore";
import { AdminShell } from "./components/AdminShell";
import { AdminLoginView } from "./components/views/AdminLoginView";
import { DashboardView } from "./components/views/DashboardView";
import { ProductsView } from "./components/views/ProductsView";
import { CategoriesView } from "./components/views/CategoriesView";
import { OrdersView } from "./components/views/OrdersView";
import { CustomersView } from "./components/views/CustomersView";
import { AppointmentsView } from "./components/views/AppointmentsView";
import { ReviewsView } from "./components/views/ReviewsView";
import { SettingsView } from "./components/views/SettingsView";
import { ProductFormView } from "./components/views/ProductFormView";
import { PaymentsView } from "./components/views/PaymentsView";
import { AdminTheme } from "./components/ui/AdminTheme";
import { AdminModal } from "./components/ui/AdminModal";

export const AdminApp: React.FC = () => (
  <AdminTheme>
    <AdminContent />
  </AdminTheme>
);
const AdminContent: React.FC = () => {
  const { user, isAuthenticated, logout } = useAdminAuthStore();
  const [currentRoute, setCurrentRoute] = useState<string>("dashboard");
  const [mounted, setMounted] = useState(false);
  const [productBusy, setProductBusy] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Helper to extract clean route from window.location (path-first, with hash-fallback migration)
  const parseRouteFromLocation = (): string => {
    // 1. If someone lands with legacy hash e.g. #/products/new, migrate cleanly
    if (window.location.hash) {
      const cleanHash = window.location.hash
        .replace(/^#\/?/, "")
        .replace(/\/$/, "");
      if (cleanHash) {
        window.history.replaceState({}, "", `/admin/${cleanHash}`);
        return cleanHash;
      }
    }

    // 2. Parse from pathname: e.g. /admin/products/new -> 'products/new'
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/admin\/?(.*)/);
    if (match && match[1]) {
      const sub = match[1].replace(/\/$/, "");
      return sub || "dashboard";
    }

    return "dashboard";
  };

  useEffect(() => {
    setMounted(true);

    const updateRoute = () => {
      setCurrentRoute(parseRouteFromLocation());
    };

    updateRoute();
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  const navigateTo = (route: string) => {
    if (route === "products") setProductBusy(false);
    if (route === "products" && currentRoute.startsWith("products/"))
      setCatalogVersion((value) => value + 1);
    const cleanRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
    const targetPath =
      cleanRoute === "dashboard" || !cleanRoute
        ? "/admin"
        : `/admin/${cleanRoute}`;
    window.history.pushState({}, "", targetPath);
    setCurrentRoute(cleanRoute || "dashboard");
  };

  if (!mounted) {
    return (
      <div className="admin-login">
        <p className="admin-muted" role="status">
          Loading administration…
        </p>
      </div>
    );
  }

  // Only authenticated admin accounts can access these modules.
  const isAdmin = isAuthenticated && user?.role === "admin";
  if (!isAdmin) {
    return <AdminLoginView onSuccess={() => navigateTo("dashboard")} />;
  }

  const renderView = () => {
    if (currentRoute === "orders" || currentRoute.startsWith("orders/")) {
      const id = currentRoute.startsWith("orders/")
        ? Number(currentRoute.split("/")[1])
        : undefined;
      return (
        <OrdersView
          initialOrderId={id}
          onCloseOrder={id ? () => navigateTo("orders") : undefined}
        />
      );
    }
    if (currentRoute === "products" || currentRoute.startsWith("products/")) {
      const creating = currentRoute === "products/new";
      const editing = currentRoute.startsWith("products/edit/");
      const id = editing
        ? Number(currentRoute.replace("products/edit/", ""))
        : undefined;
      return (
        <>
          <ProductsView key={catalogVersion} onNavigate={navigateTo} />
          <AdminModal
            title={creating ? "Add product" : "Edit product"}
            description="Product details, images, inventory and availability."
            isOpen={creating || editing}
            variant="sheet"
            maxWidth={900}
            busy={productBusy}
            onClose={() => navigateTo("products")}
          >
            <div className="admin-product-drawer">
              <ProductFormView
                key={id || "new"}
                productId={id}
                onNavigate={navigateTo}
                onBusyChange={setProductBusy}
              />
            </div>
          </AdminModal>
        </>
      );
    }

    switch (currentRoute) {
      case "dashboard":
        return <DashboardView onNavigate={navigateTo} />;
      case "products":
        return <ProductsView onNavigate={navigateTo} />;
      case "categories":
        return <CategoriesView />;
      case "orders":
        return <OrdersView />;
      case "payments":
        return <PaymentsView onNavigate={navigateTo} />;
      case "customers":
        return <CustomersView />;
      case "appointments":
        return <AppointmentsView />;
      case "reviews":
        return <ReviewsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={navigateTo} />;
    }
  };

  return (
    <AdminShell
      currentRoute={currentRoute}
      onNavigate={navigateTo}
      adminName={user?.name || "Administrator"}
      onLogout={logout}
    >
      {renderView()}
    </AdminShell>
  );
};
