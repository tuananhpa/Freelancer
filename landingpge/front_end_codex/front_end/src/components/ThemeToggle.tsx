import { Moon, Sun } from "lucide-react";
import { useTheme } from "../app/appearance";
import { useLanguage } from "../app/providers";
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  const label =
    theme === "day"
      ? t("Chuyển sang Night", "Switch to Night")
      : t("Chuyển sang Day", "Switch to Day");
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={theme === "night"}
    >
      {theme === "day" ? <Moon size={18} /> : <Sun size={18} />}
      <span>{theme === "day" ? "Night" : "Day"}</span>
    </button>
  );
}
