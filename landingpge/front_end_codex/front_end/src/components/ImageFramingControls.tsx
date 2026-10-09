import type { ImageDisplay } from "../types/domain";
import { normalizeImageDisplay } from "../services/imageDisplay";
import { MediaImage } from "./Media";
export function ImageFramingControls({
  src,
  value,
  onChange,
  logo = false,
}: {
  src: string;
  value?: ImageDisplay;
  onChange: (display: ImageDisplay) => void;
  logo?: boolean;
}) {
  const display = normalizeImageDisplay(value, logo ? "contain" : "cover");
  return (
    <div className="image-framing">
      <div className={`image-frame-preview ${logo ? "logo-preview" : ""}`}>
        <MediaImage
          src={src}
          display={display}
          alt="Xem trước vùng ảnh hiển thị"
        />
      </div>
      <label>
        Cách hiển thị
        <select
          value={display.fit}
          onChange={(e) =>
            onChange({ ...display, fit: e.target.value as ImageDisplay["fit"] })
          }
        >
          <option value="cover">Lấp đầy khung</option>
          <option value="contain">Giữ toàn bộ ảnh</option>
        </select>
      </label>
      <div className="image-framing-row">
        <label>
          Vị trí ngang <output>{display.x}%</output>
          <input
            aria-label="Vị trí ngang"
            type="range"
            min="0"
            max="100"
            value={display.x}
            onChange={(e) =>
              onChange({ ...display, x: Number(e.target.value) })
            }
          />
        </label>
        <label>
          Vị trí dọc <output>{display.y}%</output>
          <input
            aria-label="Vị trí dọc"
            type="range"
            min="0"
            max="100"
            value={display.y}
            onChange={(e) =>
              onChange({ ...display, y: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <div className="image-focus-presets">
        {[
          { label: "Trái", x: 0, y: 50 },
          { label: "Giữa", x: 50, y: 50 },
          { label: "Phải", x: 100, y: 50 },
          { label: "Trên", x: 50, y: 0 },
          { label: "Dưới", x: 50, y: 100 },
        ].map((p) => (
          <button
            type="button"
            key={p.label}
            aria-pressed={display.x === p.x && display.y === p.y}
            onClick={() => onChange({ ...display, x: p.x, y: p.y })}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p>
        Chọn vùng cần giữ trong khung. Khi giữ toàn bộ ảnh, khung có thể có
        khoảng trống; file gốc được giữ nguyên.
      </p>
    </div>
  );
}
