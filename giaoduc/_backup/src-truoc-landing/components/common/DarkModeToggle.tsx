import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface DarkModeToggleProps {
  className?: string;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold transition-colors text-vutruNhat hover:bg-gray-100 dark:hover:bg-white/10 dark:text-gray-300 ${className}`}
      aria-label={isDark ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {isDark ? (
        <>
          <Sun size={14} strokeWidth={2.5} /> Sáng
        </>
      ) : (
        <>
          <Moon size={14} strokeWidth={2.5} /> Tối
        </>
      )}
    </button>
  );
};

export default DarkModeToggle;
