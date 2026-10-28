import { useEffect, useRef, useState, type ReactNode } from "react";
import { fetchApi } from "../../../lib/api";
import { adminNavGroups } from "../admin-navigation";
import { AdminIcon } from "./ui/AdminIcon";
import { AdminModal } from "./ui/AdminModal";
import { AdminActionMenu } from "./ui/AdminActionMenu";
import { useAdminTheme } from "./ui/admin-theme-context";

interface Props {
  currentRoute: string;
  onNavigate: (route: string) => void;
  adminName: string;
  onLogout?: () => void;
  children: ReactNode;
}
export function AdminShell({
  currentRoute,
  onNavigate,
  adminName,
  onLogout,
  children,
}: Props) {
  const { preferences, update, dark } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [store, setStore] = useState("Store administration");
  const main = useRef<HTMLElement>(null);
  const lastRoute = useRef(currentRoute);
  useEffect(() => {
    let active = true;
    const load = () =>
      void fetchApi<{ data: { settingKey: string; value: string }[] }>(
        "/admin/settings",
      )
        .then((result) => {
          const name = result.data
            .find((item) => item.settingKey === "store_name")
            ?.value.trim();
          if (active) setStore(name || "Store administration");
        })
        .catch(() => {});
    load();
    window.addEventListener("admin-settings-updated", load);
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => {
      active = false;
      window.removeEventListener("admin-settings-updated", load);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);
  useEffect(() => {
    if (lastRoute.current !== currentRoute) {
      lastRoute.current = currentRoute;
      main.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentRoute]);
  const navigate = (route: string) => {
    onNavigate(route);
    setOpen(false);
    setSearchOpen(false);
    setQuery("");
  };
  const items = adminNavGroups.flatMap((group) => group.items);
  const section =
    items.find((item) => item.id === currentRoute.split("/")[0])?.label ||
    "Overview";
  const nav = (
    <nav className="admin-nav" aria-label="Administration">
      {adminNavGroups.map((group) => (
        <div className="admin-nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="admin-nav-item"
              title={preferences.collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={
                currentRoute.split("/")[0] === item.id ? "page" : undefined
              }
              onClick={() => navigate(item.id)}
            >
              <AdminIcon name={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
  const initials =
    adminName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "A";
  const identity = (
    <AdminActionMenu
      label="Account menu"
      side="top"
      trigger={
        <button
          type="button"
          className="admin-user-button"
          aria-label={`Account menu for ${adminName}`}
        >
          <span className="admin-avatar">{initials}</span>
          <span className="admin-user-copy">
            <strong>{adminName}</strong>
            <small>Administrator</small>
          </span>
          <AdminIcon name="expand" />
        </button>
      }
    >
      <div className="admin-menu-label">
        {adminName}
        <small>Administrator</small>
      </div>
      <button className="admin-btn" onClick={() => navigate("settings")}>
        <AdminIcon name="settings" />
        Store settings
      </button>
      <a className="admin-btn" href="/" target="_blank" rel="noreferrer">
        <AdminIcon name="external" />
        View storefront
      </a>
      {onLogout && (
        <button className="admin-btn admin-btn-danger" onClick={onLogout}>
          <AdminIcon name="logout" />
          Sign out
        </button>
      )}
    </AdminActionMenu>
  );
  return (
    <div className="admin-shell">
      <a href="#admin-main" className="admin-skip">
        Skip to content
      </a>
      <aside className="admin-sidebar">
        <button
          type="button"
          className="admin-brand"
          onClick={() => navigate("dashboard")}
          aria-label={`${store} overview`}
        >
          <span className="admin-brand-mark">
            <AdminIcon name="command" />
          </span>
          <span className="admin-brand-copy">
            <strong>{store}</strong>
            <small>Store workspace</small>
          </span>
          <AdminIcon name="expand" />
        </button>
        <div className="admin-sidebar-create">
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate("products/new")}
          >
            <AdminIcon name="plus" />
            <span>Add product</span>
          </button>
        </div>
        {nav}
        <div className="admin-sidebar-footer">{identity}</div>
      </aside>
      <div className="admin-content">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-icon-button admin-desktop-toggle"
              aria-label={
                preferences.collapsed ? "Expand sidebar" : "Collapse sidebar"
              }
              aria-expanded={!preferences.collapsed}
              onClick={() => update({ collapsed: !preferences.collapsed })}
            >
              <AdminIcon name="menu" />
            </button>
            <button
              type="button"
              className="admin-icon-button admin-mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <AdminIcon name="menu" />
            </button>
            <span className="admin-header-separator" />
            <button
              type="button"
              className="admin-header-search"
              aria-label="Search admin pages"
              onClick={() => setSearchOpen(true)}
            >
              <AdminIcon name="search" />
              <span>Search pages...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="admin-header-section">{section}</span>
          </div>
          <div className="admin-header-tools">
            <button
              className="admin-icon-button"
              aria-label="Layout preferences"
              onClick={() => setLayoutOpen(true)}
            >
              <AdminIcon name="settings" />
            </button>
            <button
              className="admin-icon-button"
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() =>
                update({
                  theme: dark ? "light" : "dark",
                })
              }
            >
              <AdminIcon name={dark ? "sun" : "moon"} />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="admin-icon-button"
              aria-label="Open storefront"
            >
              <AdminIcon name="external" />
            </a>
            <span className="admin-header-account">{identity}</span>
          </div>
        </header>
        <main ref={main} id="admin-main" className="admin-main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <AdminModal
        title={store}
        isOpen={open}
        onClose={() => setOpen(false)}
        variant="sheet"
        side="left"
        maxWidth={300}
      >
        <div className="admin-mobile-nav">
          {nav}
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => navigate("products/new")}
          >
            <AdminIcon name="plus" />
            Add product
          </button>
          {identity}
        </div>
      </AdminModal>
      <AdminModal
        title="Search pages"
        description="Navigate to a store module."
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth={520}
      >
        <label className="admin-search admin-command-search">
          <AdminIcon name="search" />
          <input
            autoFocus
            type="search"
            aria-label="Search admin pages"
            placeholder="Search pages..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="admin-command-results">
          {items
            .filter((item) =>
              `${item.label} ${item.description}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
            )
            .map((item) => (
              <button key={item.id} onClick={() => navigate(item.id)}>
                <AdminIcon name={item.id} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <AdminIcon name="arrow" />
              </button>
            ))}
          {!items.some((item) =>
            `${item.label} ${item.description}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          ) && <p className="admin-empty">No matching pages.</p>}
        </div>
      </AdminModal>
      <AdminModal
        title="Preferences"
        description="Customize your dashboard layout."
        isOpen={layoutOpen}
        onClose={() => setLayoutOpen(false)}
        maxWidth={390}
      >
        <div className="admin-preferences">
          <label>
            Theme mode
            <select
              value={preferences.theme}
              onChange={(event) =>
                update({
                  theme: event.target.value as typeof preferences.theme,
                })
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <label>
            Page layout
            <select
              value={preferences.layout}
              onChange={(event) =>
                update({
                  layout: event.target.value as typeof preferences.layout,
                })
              }
            >
              <option value="full">Full width</option>
              <option value="centered">Centered</option>
            </select>
          </label>
          <label>
            Sidebar
            <select
              value={preferences.collapsed ? "collapsed" : "expanded"}
              onChange={(event) =>
                update({ collapsed: event.target.value === "collapsed" })
              }
            >
              <option value="expanded">Expanded</option>
              <option value="collapsed">Icons only</option>
            </select>
          </label>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              update({ theme: "light", layout: "full", collapsed: false })
            }
          >
            Restore defaults
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
