import React, { useMemo, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  colorThemeOptions,
  ColorThemeId,
  themeCategories,
  ColorThemeOption,
} from '../../utils/colorThemes';

const modeOptions = [
  { id: 'light' as const, label: 'Sáng', icon: Sun },
  { id: 'dark' as const, label: 'Tối', icon: Moon },
  { id: 'system' as const, label: 'Hệ thống', icon: Monitor },
];

const modeLabels: Record<(typeof modeOptions)[number]['id'], string> = {
  light: 'Sáng',
  dark: 'Tối',
  system: 'Hệ thống',
};

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, resolvedTheme, colorTheme, setColorTheme } = useTheme();
  const toast = useToast();
  const [category, setCategory] = useState<ColorThemeOption['category'] | 'all'>('all');
  const activeColor = colorThemeOptions.find((opt) => opt.id === colorTheme);

  const filteredThemes = useMemo(
    () => (category === 'all' ? colorThemeOptions : colorThemeOptions.filter((o) => o.category === category)),
    [category],
  );

  const handleModeChange = (id: (typeof modeOptions)[number]['id']) => {
    setTheme(id);
    const nextResolved =
      id === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'Tối'
          : 'Sáng'
        : id === 'dark'
          ? 'Tối'
          : 'Sáng';
    toast.success(`Đã chuyển chế độ ${modeLabels[id]}`, {
      description: `Giao diện hiện tại: ${nextResolved}`,
    });
  };

  const handleColorChange = (id: ColorThemeId) => {
    setColorTheme(id);
    const opt = colorThemeOptions.find((o) => o.id === id);
    toast.success(`Đã áp dụng ${opt?.label ?? id}`, {
      description: '4 màu palette đã phân vai trò trên giao diện.',
    });
  };

  const swatch = activeColor?.preview;
  const c1 = swatch?.[0] ?? '#FF5A1F';
  const c2 = swatch?.[1] ?? '#F4380B';
  const c3 = swatch?.[2] ?? '#FFC53D';
  const c4 = swatch?.[3] ?? '#FFEDE3';

  return (
    <div className="space-y-6">
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-night-border">
          <h3 className="font-bold text-vutru">Xem trước trực tiếp</h3>
          <p className="text-sm text-vutruNhat mt-1">
            4 màu palette được dùng xen kẽ — không chỉ màu đầu tiên.
          </p>
        </div>
        {activeColor && (
          <div className="flex h-2 w-full">
            {activeColor.preview.map((c) => (
              <span key={c} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        <div className="p-5 space-y-4 bg-kem/50 dark:bg-night-elevated/50">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="btn btn-chinh !py-2 !px-5 text-sm">Nút chính</span>
            <span className="btn btn-vien !py-2 !px-5 text-sm">Nút viền</span>
            <span className="inline-flex items-center text-sm font-bold text-accent">Link accent →</span>
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-accent-highlight text-accent-dark">Badge</span>
            <label className="inline-flex items-center gap-2 text-sm text-vutru cursor-pointer">
              <input type="checkbox" defaultChecked readOnly className="w-4 h-4" />
              Checkbox
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: c1 }}
            >
              U
            </span>
            <div>
              <p className="text-sm font-bold text-vutru">{activeColor?.label ?? 'Điểm Sáng Classic'}</p>
              <p className="text-xs text-vutruNhat">
                Chính {c1} · Phụ {c2} · Nhấn {c3} · Đậm {c4}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-6">
        <div>
          <h3 className="font-bold text-vutru mb-1">Chế độ hiển thị</h3>
          <p className="text-sm text-vutruNhat mb-4">
            Hiện tại: <span className="font-semibold text-accent">{resolvedTheme === 'dark' ? 'Tối' : 'Sáng'}</span>
            {theme === 'system' ? ' (theo hệ thống)' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {modeOptions.map((opt) => {
              const ModeIcon = opt.icon;
              return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleModeChange(opt.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                  theme === opt.id
                    ? 'theme-sidebar-active scale-[1.02] border-transparent'
                    : 'border-gray-200 dark:border-night-border text-vutruNhat hover:border-gray-300'
                }`}
              >
                <ModeIcon size={16} strokeWidth={2.25} />
                {opt.label}
              </button>
            );})}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-night-border">
          <div className="mb-4">
            <h3 className="font-bold text-vutru mb-1">Palette màu (solid)</h3>
            <p className="text-sm text-vutruNhat">
              {colorThemeOptions.length} palette · cảm hứng{' '}
              <a href="https://colorhunt.co/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Color Hunt
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                category === 'all' ? 'theme-sidebar-active' : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat'
              }`}
            >
              Tất cả
            </button>
            {themeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  category === cat.id ? 'theme-sidebar-active' : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredThemes.map((opt) => {
              const selected = colorTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleColorChange(opt.id)}
                  className={`text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                    selected ? 'scale-[1.02] shadow-soft border-accent-secondary' : 'border-gray-200 dark:border-night-border hover:border-gray-300'
                  }`}
                >
                  <div className="flex h-2">
                    {opt.preview.map((c) => (
                      <span key={c} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-vutru truncate mb-1.5">{opt.label}</p>
                    <p className="text-[10px] text-vutruNhat leading-snug line-clamp-2">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
