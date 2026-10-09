import { useState, type FormEvent } from "react";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";
import type { Product, Block, Localized } from "../../types/domain";
import { Modal } from "../../components/common";
import { repository } from "../../services";
import { useNotice } from "../../app/providers";
import { ProductMediaEditor } from "./ProductMediaEditor";
import { createProductDraft } from "../../services/productDraft";
import { orderUnits } from "../../services/inquiries";
const blockNames: Record<Block, string> = {
  hero: "Header, video & định danh",
  story: "Câu chuyện & bộ sưu tập ảnh",
  journey: "Hành trình sản phẩm",
  videos: "Thư viện phim ngắn",
  cta: "Quà tặng & cảm nhận",
};
export function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [p, setP] = useState(() => structuredClone(product));
  const [tab, setTab] = useState("info");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const notify = useNotice();
  const patch = <K extends keyof Product>(key: K, value: Product[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));
  const field = (
    key: "subtitle" | "region" | "season" | "story",
    label: string,
  ) => (
    <div className="localized-fields">
      <label>
        {label} (VI)
        <textarea
          rows={key === "story" ? 6 : 2}
          value={p[key].vi}
          onChange={(e) => patch(key, { ...p[key], vi: e.target.value })}
        />
      </label>
      <label>
        {label} (EN)
        <textarea
          rows={key === "story" ? 6 : 2}
          value={p[key].en}
          onChange={(e) => patch(key, { ...p[key], en: e.target.value })}
        />
      </label>
    </div>
  );
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await repository.products.save({
        ...p,
        orderUnit: p.orderUnit?.trim() || "kg",
      });
      notify("Đã lưu sản phẩm. Nội dung công khai sẽ dùng bản cập nhật.");
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const timelineField = (
    i: number,
    key: "title" | "detail",
    lang: keyof Localized,
    value: string,
  ) =>
    patch(
      "timeline",
      p.timeline.map((x, n) =>
        n === i ? { ...x, [key]: { ...x[key], [lang]: value } } : x,
      ),
    );
  return (
    <Modal
      wide
      className="product-editor-modal"
      title={
        product.name ? "Chăm chút câu chuyện sản phẩm" : "Tạo câu chuyện mới"
      }
      onClose={onClose}
    >
      <form onSubmit={save} className="editor-form">
        <div className="editor-tabs" role="tablist">
          {[
            { id: "info", name: "Thông tin lô" },
            { id: "story", name: "Câu chuyện" },
            { id: "media", name: "Ảnh & video" },
            { id: "journey", name: "Hành trình" },
            { id: "blocks", name: "Khối & hỏi đáp" },
          ].map((x) => (
            <button
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              key={x.id}
              className={tab === x.id ? "active" : ""}
              onClick={() => setTab(x.id)}
            >
              {x.name}
            </button>
          ))}
        </div>
        <div className="editor-body form-stack">
          {tab === "info" && (
            <>
              <div className="form-grid">
                <label>
                  Tên sản phẩm (VI)
                  <input
                    value={p.name}
                    onChange={(e) => patch("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Tên sản phẩm (EN)
                  <input
                    value={p.nameEn}
                    onChange={(e) => patch("nameEn", e.target.value)}
                  />
                </label>
                <label>
                  Mã lô hàng
                  <div className="batch-code-input">
                    <input
                      aria-label="Mã lô hàng"
                      value={p.batchCode}
                      onChange={(e) => patch("batchCode", e.target.value)}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Tạo mã lô mới"
                      title="Tạo mã lô mới"
                      onClick={() =>
                        patch("batchCode", createProductDraft().batchCode)
                      }
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <small>
                    Mã được tạo tự động. Bạn có thể sửa theo quy ước của mình.
                  </small>
                </label>
                <label>
                  Ngày thu hoạch / sản xuất
                  <input
                    type="date"
                    value={p.harvestedAt}
                    onChange={(e) => patch("harvestedAt", e.target.value)}
                  />
                </label>
                <label>
                  Hạn sử dụng
                  <input
                    type="date"
                    value={p.expiresAt}
                    onChange={(e) => patch("expiresAt", e.target.value)}
                  />
                </label>
                <label>
                  Đơn vị mặc định
                  <input
                    list="product-order-units"
                    value={p.orderUnit ?? "kg"}
                    maxLength={30}
                    required
                    onChange={(e) => patch("orderUnit", e.target.value)}
                  />
                  <datalist id="product-order-units">
                    {orderUnits.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                  <small>
                    Chọn gợi ý hoặc nhập đơn vị phù hợp với sản phẩm.
                  </small>
                </label>
              </div>
              {field("region", "Vùng trồng")}
              {field("season", "Mùa vụ")}
              <label>
                Chứng nhận (mỗi dòng một tên)
                <textarea
                  rows={2}
                  value={p.certifications.join("\n")}
                  onChange={(e) =>
                    patch(
                      "certifications",
                      e.target.value.split("\n").filter(Boolean),
                    )
                  }
                />
                <small>
                  Chỉ nhập chứng nhận đã có hồ sơ từ chủ thể; bản mẫu không
                  chứng minh tính xác thực.
                </small>
              </label>
              <div className="form-grid">
                <label>
                  Trạng thái
                  <select
                    aria-label="Trạng thái"
                    value={p.status}
                    onChange={(e) =>
                      patch("status", e.target.value as Product["status"])
                    }
                  >
                    <option value="published">Công khai</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={p.demo}
                    onChange={(e) => patch("demo", e.target.checked)}
                  />
                  Đánh dấu lô minh họa
                </label>
              </div>
            </>
          )}
          {tab === "story" && (
            <>
              {field("subtitle", "Tiêu đề câu chuyện")}
              {field("story", "Nội dung chuyện")}
              <label>
                Lời kể / bản đọc video
                <textarea
                  rows={6}
                  value={p.transcript}
                  onChange={(e) => patch("transcript", e.target.value)}
                />
              </label>
            </>
          )}
          {tab === "media" && (
            <ProductMediaEditor
              product={p}
              onChange={(updates) => setP((prev) => ({ ...prev, ...updates }))}
              onBusy={setUploading}
              onError={setError}
            />
          )}
          {tab === "journey" && (
            <>
              <div className="journey-editor-heading">
                <p>
                  <strong>{p.timeline.length} mốc hành trình</strong> · Các mốc
                  được đánh số theo thứ tự từ đầu đến cuối. Thêm mốc mới hoặc
                  bấm biểu tượng thùng rác để xóa mốc.
                </p>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() =>
                    patch("timeline", [
                      ...p.timeline,
                      {
                        date: String(p.timeline.length + 1),
                        title: { vi: "Mốc mới", en: "New step" },
                        detail: { vi: "", en: "" },
                      },
                    ])
                  }
                >
                  <Plus size={16} />
                  Thêm mốc hành trình
                </button>
              </div>
              {!p.timeline.length && (
                <p className="empty-message">
                  Chưa có mốc hành trình. Thêm mốc đầu tiên để bắt đầu; trang
                  sản phẩm sẽ ẩn phần này khi chưa có mốc.
                </p>
              )}
              {p.timeline.map((event, i) => (
                <div className="timeline-editor" key={i}>
                  <div className="panel-heading">
                    <h3>Mốc {i + 1}</h3>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Xóa mốc ${i + 1}`}
                      onClick={() =>
                        patch(
                          "timeline",
                          p.timeline.filter((_, n) => n !== i),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <label>
                      Tiêu đề (VI)
                      <input
                        value={event.title.vi}
                        onChange={(e) =>
                          timelineField(i, "title", "vi", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Tiêu đề (EN)
                      <input
                        value={event.title.en}
                        onChange={(e) =>
                          timelineField(i, "title", "en", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Mô tả (VI)
                      <textarea
                        value={event.detail.vi}
                        onChange={(e) =>
                          timelineField(i, "detail", "vi", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Mô tả (EN)
                      <textarea
                        value={event.detail.en}
                        onChange={(e) =>
                          timelineField(i, "detail", "en", e.target.value)
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "blocks" && (
            <>
              <h3>Các khối của trang trải nghiệm</h3>
              <div className="block-list">
                {(Object.keys(blockNames) as Block[]).map((block) => (
                  <label key={block} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={p.blocks.includes(block)}
                      onChange={(e) =>
                        patch(
                          "blocks",
                          e.target.checked
                            ? [...p.blocks, block]
                            : p.blocks.filter((b) => b !== block),
                        )
                      }
                    />
                    {blockNames[block]}
                  </label>
                ))}
              </div>
              <h3>Hỏi đáp cho trợ lý</h3>
              {p.faq.map((f, i) => (
                <div className="timeline-editor" key={i}>
                  <div className="panel-heading">
                    <h4>Câu hỏi {i + 1}</h4>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Xóa câu hỏi"
                      onClick={() =>
                        patch(
                          "faq",
                          p.faq.filter((_, n) => n !== i),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {(["question", "answer"] as const).map((key) => (
                    <div className="form-grid" key={key}>
                      {(["vi", "en"] as const).map((lang) => (
                        <label key={lang}>
                          {key === "question" ? "Câu hỏi" : "Trả lời"} (
                          {lang.toUpperCase()})
                          <textarea
                            value={f[key][lang]}
                            onChange={(e) =>
                              patch(
                                "faq",
                                p.faq.map((x, n) =>
                                  n === i
                                    ? {
                                        ...x,
                                        [key]: {
                                          ...x[key],
                                          [lang]: e.target.value,
                                        },
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                className="button button-outline"
                onClick={() =>
                  patch("faq", [
                    ...p.faq,
                    {
                      question: { vi: "", en: "" },
                      answer: { vi: "", en: "" },
                    },
                  ])
                }
              >
                <Plus size={16} />
                Thêm hỏi đáp
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="editor-footer">
          <span>Thay đổi được lưu riêng cho sản phẩm này.</span>
          <button className="button" disabled={busy || uploading}>
            <Save size={17} />
            {busy ? "Đang lưu…" : "Lưu sản phẩm"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
