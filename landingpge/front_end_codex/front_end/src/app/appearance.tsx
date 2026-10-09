import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { repository } from "../services";
import { useResource } from "../hooks/useResource";
import { normalizeSettings } from "../services/contacts";
import type { Settings } from "../types/domain";
type Theme = "day" | "night";
const ThemeContext = createContext({ theme: "day" as Theme, toggle: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("hytales.theme") === "night"
        ? "night"
        : "day";
    } catch {
      return "day";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "night" ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "night" ? "#102018" : "#294b35");
    try {
      localStorage.setItem("hytales.theme", theme);
    } catch {
      /* usable without storage */
    }
  }, [theme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () => setTheme(theme === "day" ? "night" : "day"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
const SettingsContext = createContext<Settings>(normalizeSettings({}));
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data, reload } = useResource(() => repository.settings.get());
  useEffect(() => {
    const refresh = () => reload();
    window.addEventListener("hytales:settings-updated", refresh);
    return () =>
      window.removeEventListener("hytales:settings-updated", refresh);
  }, [reload]);
  return (
    <SettingsContext.Provider value={data ?? normalizeSettings({})}>
      {children}
    </SettingsContext.Provider>
  );
}
export const useSiteSettings = () => useContext(SettingsContext);
