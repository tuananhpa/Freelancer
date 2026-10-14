import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  PenLine,
  RefreshCw,
  Sparkles,
  Save,
  Trash2,
} from "lucide-react";
import { Modal, Note, Busy } from "./components";
import { api, today, timeNow, uploadImage } from "./api";
import { slots } from "./catalog";
import type { Meal } from "./types";
export default function MealEditor({
  initial,
  onClose,
  onSaved,
  aiConfigured,
}: {
  initial?: Partial<Meal>;
  onClose: () => void;
  onSaved: () => Promise<void>;
  aiConfigured: boolean;
}) {
  const [m, setM] = useState<Meal>({
      name: "",
      slot: "lunch",
      date: today(),
      time: timeNow(),
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      portion: "1 khẩu phần",
      imageId: "",
      source: "manual",
      ...initial,
    }),
    [mode, setMode] = useState(initial?.id ? "manual" : "photo"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [facing, setFacing] = useState<"environment" | "user">("environment");
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    file = useRef<HTMLInputElement>(null);
  useEffect(
    () => () => stream.current?.getTracks().forEach((t) => t.stop()),
    [],
  );
  const change = (k: keyof Meal, v: any) => setM((x) => ({ ...x, [k]: v }));
  async function loadImage(f: File) {
    setBusy(true);
    setError("");
    try {
      change("imageId", await uploadImage(f));
      setMode("photo");
      stream.current?.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function camera(f = facing) {
    setMode("camera");
    setError("");
    stream.current?.getTracks().forEach((t) => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: f },
        audio: false,
      });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
    } catch {
      setError(
        "Không mở được camera. Hãy cấp quyền hoặc dùng nút tải ảnh từ thiết bị.",
      );
    }
  }
  async function capture() {
    if (!video.current?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = video.current.videoWidth;
    c.height = video.current.videoHeight;
    c.getContext("2d")!.drawImage(video.current, 0, 0);
    c.toBlob(
      (b) => {
        if (b) loadImage(new File([b], "meal.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.85,
    );
  }
  async function analyze() {
    setBusy(true);
    setError("");
    try {
      const { analysis } = await api("/ai/meal", "POST", {
        name: m.name,
        imageId: m.imageId,
      });
      setM((x) => ({
        ...x,
        ...analysis,
        date: x.date,
        time: x.time,
        slot: x.slot,
        imageId: x.imageId,
        source: "ai",
      }));
      setNote(
        analysis.note +
          " Độ tin cậy: " +
          ({ low: "thấp", medium: "vừa", high: "cao" }[
            analysis.confidence as string
          ] ?? "thấp"),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/meals" + (m.id ? "/" + m.id : ""), m.id ? "PUT" : "POST", m);
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={m.id ? "Chỉnh sửa bữa ăn" : "Ghi lại bữa ăn"}
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <div className="tabs">
        <button
          className={mode === "photo" ? "active" : ""}
          onClick={() => setMode("photo")}
        >
          <Upload size={16} />
          Ảnh món ăn
        </button>
        <button
          className={mode === "camera" ? "active" : ""}
          onClick={() => camera()}
        >
          <Camera size={16} />
          Camera
        </button>
        <button
          className={mode === "manual" ? "active" : ""}
          onClick={() => {
            setMode("manual");
            stream.current?.getTracks().forEach((t) => t.stop());
          }}
        >
          <PenLine size={16} />
          Nhập thủ công
        </button>
      </div>
      {mode === "camera" && (
        <div className="camera-panel">
          <video ref={video} playsInline muted autoPlay />
          <div className="actions">
            <button
              className="btn"
              onClick={() => {
                const f = facing === "environment" ? "user" : "environment";
                setFacing(f);
                camera(f);
              }}
            >
              <RefreshCw size={16} />
              Đổi camera
            </button>
            <button className="btn primary" disabled={busy} onClick={capture}>
              <Camera size={16} />
              Chụp ảnh
            </button>
          </div>
        </div>
      )}
      {mode === "photo" && (
        <div className="upload-area">
          {m.imageId ? (
            <img src={"/api/media/" + m.imageId} alt="Ảnh món ăn đã chọn" />
          ) : (
            <>
              <Camera size={32} />
              <h3>Hôm nay bạn ăn gì?</h3>
              <p>Chọn ảnh rõ món ăn để NuTri hỗ trợ ước lượng.</p>
            </>
          )}
          <button
            className="btn"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            <Upload size={17} />
            {m.imageId ? "Đổi ảnh" : "Chọn ảnh từ thiết bị"}
          </button>
        </div>
      )}
      <input
        className="sr-only"
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          if (e.target.files?.[0]) loadImage(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            Ngày ăn
            <input
              required
              type="date"
              value={m.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </label>
          <label>
            Giờ ăn
            <input
              required
              type="time"
              value={m.time}
              onChange={(e) => change("time", e.target.value)}
            />
          </label>
        </div>
        <div className="slot-picker">
          {slots.map((s) => (
            <button
              type="button"
              key={s.id}
              className={m.slot === s.id ? "selected" : ""}
              onClick={() => change("slot", s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label>
          Tên món ăn
          <input
            required
            maxLength={150}
            value={m.name}
            onChange={(e) => change("name", e.target.value)}
            placeholder="Ví dụ: Cơm gà, phở bò…"
          />
        </label>
        <div className="actions">
          <button
            type="button"
            className="btn ai-button"
            disabled={busy || !aiConfigured || (!m.name && !m.imageId)}
            onClick={analyze}
          >
            <Sparkles size={17} />
            Ước lượng bằng AI
          </button>
          {!aiConfigured && (
            <span className="muted small-text">
              Gemini chưa được cấu hình. Bạn có thể nhập số liệu bên dưới.
            </span>
          )}
        </div>
        {note && <Note>{note} Hãy kiểm tra khẩu phần trước khi lưu.</Note>}
        <label>
          Khẩu phần
          <input
            required
            maxLength={150}
            value={m.portion}
            onChange={(e) => change("portion", e.target.value)}
          />
        </label>
        <div className="form-grid four">
          {[
            ["kcal", "Năng lượng (kcal)", 5000],
            ["protein", "Đạm (g)", 500],
            ["carbs", "Tinh bột (g)", 1000],
            ["fat", "Chất béo (g)", 500],
          ].map(([key, label, max]) => (
            <label key={key}>
              {label}
              <input
                required
                type="number"
                step=".1"
                min="0"
                max={max}
                value={m[key as keyof Meal] ?? 0}
                onChange={(e) => change(key as keyof Meal, +e.target.value)}
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions end">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={onClose}
          >
            Hủy
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? (
              <Busy />
            ) : (
              <>
                <Save size={17} />
                Lưu bữa ăn
              </>
            )}
          </button>
        </div>
        <p className="muted small-text">
          Số liệu AI và thư viện là ước lượng tham khảo, không thay thế đánh giá
          chuyên môn.
        </p>
      </form>
    </Modal>
  );
}
