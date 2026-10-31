import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { applyColorTheme } from '../../utils/colorThemes';

/** Re-applies accent CSS variables on navigation so shell chrome stays in sync. */
export default function ThemeAccentSync() {
  const { colorTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    applyColorTheme(colorTheme);
  }, [colorTheme, location.pathname]);

  return null;
}
