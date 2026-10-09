import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "../types/domain";
const LanguageContext = createContext({
  lang: "vi" as Language,
  setLang: (_lang: Language) => {},
  t: (vi: string, _en: string) => vi,
});
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("hytales.language");
      return saved === "en" || saved === "vi"
        ? saved
        : navigator.language.startsWith("en")
          ? "en"
          : "vi";
    } catch {
      return "vi";
    }
  });
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (value: Language) => {
    setState(value);
    document.documentElement.lang = value;
    try {
      localStorage.setItem("hytales.language", value);
    } catch {
      /* language still changes in memory */
    }
  };
  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t: (vi, en) => (lang === "vi" ? vi : en) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
const NoticeContext = createContext((_: string) => {});
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState("");
  const notify = useCallback((value: string) => setNotice(value), []);
  return (
    <NoticeContext.Provider value={notify}>
      {children}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}
    </NoticeContext.Provider>
  );
}
export const useNotice = () => useContext(NoticeContext);
