import type { Language } from "../types/domain";

export function localizedVideo(
  vi: string | undefined,
  en: string | undefined,
  language: Language,
): string {
  return (language === "en" ? en?.trim() || vi?.trim() : vi?.trim()) || "";
}
