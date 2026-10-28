import { useEffect, useRef, useState, type ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import {
  AdminThemeContext as Context,
  defaultAdminPreferences as defaults,
  type AdminPreferences as Preferences,
} from "./admin-theme-context";
const storageKey = "mm-admin-ui-preferences";

export function AdminTheme({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [systemDark, setSystemDark] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const ready = useRef(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      setPreferences({
        theme: ["light", "dark", "system"].includes(saved.theme)
          ? saved.theme
          : "light",
        layout: saved.layout === "centered" ? "centered" : "full",
        collapsed: saved.collapsed === true,
      });
    } catch {
      /* Use the neutral light theme if storage is unavailable. */
    }
    ready.current = true;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const update = (patch: Partial<Preferences>) =>
    setPreferences((current) => {
      const next = { ...current, ...patch };
      if (ready.current)
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* Preferences still work for this session. */
        }
      return next;
    });
  const dark =
    preferences.theme === "dark" ||
    (preferences.theme === "system" && systemDark);
  return (
    <Context.Provider value={{ preferences, update, portal, dark }}>
      <div
        className={`admin-app ${GeistSans.className}`}
        data-admin-theme={dark ? "dark" : "light"}
        data-admin-layout={preferences.layout}
        data-sidebar-collapsed={preferences.collapsed}
      >
        {children}
        <div ref={setPortal} className="admin-portals" />
      </div>
    </Context.Provider>
  );
}
