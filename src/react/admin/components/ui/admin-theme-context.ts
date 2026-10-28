import { createContext, useContext } from "react";
export type AdminPreferences = {
  theme: "light" | "dark" | "system";
  layout: "full" | "centered";
  collapsed: boolean;
};
export const defaultAdminPreferences: AdminPreferences = {
  theme: "light",
  layout: "full",
  collapsed: false,
};
export const AdminThemeContext = createContext({
  preferences: defaultAdminPreferences,
  update: (_: Partial<AdminPreferences>) => {},
  portal: null as HTMLElement | null,
  dark: false,
});
export const useAdminTheme = () => useContext(AdminThemeContext);
