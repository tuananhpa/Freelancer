import { useState, type FormEvent } from "react";
import {
  Plus,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  MessagesSquare,
} from "lucide-react";
import { repository } from "../../services";
import { useResource } from "../../hooks/useResource";
import { useNotice } from "../../app/providers";
import { Loading, ErrorState } from "../../components/common";
import type { QuickReply, Localized } from "../../types/domain";
import { validateQuickReplies } from "../../data/quickReplies";
type Draft = { replies: QuickReply[]; greeting: Localized };
export default function QuickRepliesPage() {
  const { data, loading, error, reload } = useResource(async () => {
    const [settings, products] = await Promise.all([
      repository.settings.get(),
      repository.products.list(true),
    ]);
    return { settings, products };
  });
  const [selected, setSelected] = useState("website");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const notify = useNotice();
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;
  const product = data.products.find((p) => p.id === selected);
  const draft = drafts[selected] ?? {
    replies:
      selected === "website"
        ? data.settings.quickReplies
        : (product?.faq ?? []),
    greeting: data.settings.chatGreeting,
  };
  function update(patch: Partial<Draft>) {
    setDrafts((prev) => ({
      ...prev,
      [selected]: structuredClone({ ...draft, ...patch }),
    }));
    setSaveError("");
  }
  function patchReply(index: number, patch: Partial<QuickReply>) {
    update({
      replies: draft.replies.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  }
  function move(index: number, offset: number) {
    const items = [...draft.replies];
    [items[index], items[index + offset]] = [
      items[index + offset],
      items[index],
    ];
    update({ replies: items });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaveError("");
    try {
      validateQuickReplies(draft.replies);
      if (selected === "website") {
        const latest = await repository.settings.get();
        await repository.settings.save({
          ...latest,
          quickReplies: draft.replies,
          chatGreeting: draft.greeting,
        });
      } else {
        const latest = (await repository.products.list(true)).find(
          (p) => p.id === selected,
        );
        if (!latest)
          throw new Error(
            "Sản phẩm không còn tồn tại. Hãy chọn bộ câu hỏi khác.",
          );
        await repository.products.save({ ...latest, faq: draft.replies });
      }
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[selected];
        return copy;
      });
      reload();
      notify("Đã lưu bộ câu hỏi.");
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Hỏi chuyện quê</p>
          <h1>Hỏi đáp nhanh</h1>
          <p>Chăm chút lời chào và những câu trả lời khách thường cần.</p>
        </div>
      </div>
      <div className="quick-replies-layout">
        <form
          className="admin-panel form-stack"
          onSubmit={(event) => void save(event)}
        >
          <fieldset disabled={busy} className="form-stack quick-reply-fields">
            <label>
              Bộ câu hỏi
              <select
                aria-label="Bộ câu hỏi"
                value={selected}
                disabled={busy}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setSaveError("");
                }}
              >
                <option value="website">Câu hỏi chung · Trang chủ</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.status === "draft" ? " · Bản nháp" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p className="quiet-note">
              {selected === "website"
                ? "Bộ chung dùng trên trang chủ. Lời chào dùng cho toàn bộ trợ lý."
                : "Bộ này dùng riêng khi khách mở câu chuyện sản phẩm. Bạn cũng có thể sửa trong mục Sản phẩm."}{" "}
              Thay đổi được áp dụng sau khi lưu.
            </p>
            {selected === "website" && (
              <div className="form-grid">
                {(["vi", "en"] as const).map((language) => (
                  <label key={language}>
                    Lời chào ({language.toUpperCase()})
                    <textarea
                      aria-label={`Lời chào (${language.toUpperCase()})`}
                      rows={2}
                      maxLength={300}
                      value={draft.greeting[language]}
                      required={language === "vi"}
                      onChange={(event) =>
                        update({
                          greeting: {
                            ...draft.greeting,
                            [language]: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="quick-replies-list">
              {draft.replies.map((item, i) => (
                <article
                  className="quick-reply-item"
                  key={item.id || `${selected}-${i}`}
                >
                  <div className="panel-heading">
                    <h2>Câu hỏi {i + 1}</h2>
                    <div className="quick-reply-actions">
                      <label className="checkbox-label">
                        <input
                          aria-label="Hiển thị câu hỏi"
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(event) =>
                            patchReply(i, { enabled: event.target.checked })
                          }
                        />
                        Hiển thị
                      </label>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Đưa lên trên"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Đưa xuống dưới"
                        disabled={i === draft.replies.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown size={17} />
                      </button>
                      <button
                        className="icon-button danger-icon"
                        type="button"
                        aria-label="Xóa câu hỏi"
                        onClick={() =>
                          update({
                            replies: draft.replies.filter((_, n) => n !== i),
                          })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="form-grid">
                    {(["vi", "en"] as const).map((language) => (
                      <div className="form-stack" key={language}>
                        <label>
                          Câu hỏi ({language.toUpperCase()})
                          <input
                            aria-label={`Câu hỏi (${language.toUpperCase()})`}
                            value={item.question[language]}
                            maxLength={200}
                            required={language === "vi"}
                            onChange={(event) =>
                              patchReply(i, {
                                question: {
                                  ...item.question,
                                  [language]: event.target.value,
                                },
                              })
                            }
                          />
                        </label>
                        <label>
                          Trả lời ({language.toUpperCase()})
                          <textarea
                            aria-label={`Trả lời (${language.toUpperCase()})`}
                            rows={4}
                            value={item.answer[language]}
                            maxLength={3000}
                            required={language === "vi"}
                            onChange={(event) =>
                              patchReply(i, {
                                answer: {
                                  ...item.answer,
                                  [language]: event.target.value,
                                },
                              })
                            }
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            {!draft.replies.length && (
              <div className="media-empty">
                <MessagesSquare size={30} />
                Chưa có câu hỏi gợi ý. Khách vẫn có thể gửi câu hỏi vào hộp thư.
              </div>
            )}
            <button
              type="button"
              className="button button-outline"
              onClick={() =>
                update({
                  replies: [
                    ...draft.replies,
                    {
                      id: crypto.randomUUID(),
                      enabled: true,
                      question: { vi: "", en: "" },
                      answer: { vi: "", en: "" },
                    },
                  ],
                })
              }
            >
              <Plus size={17} />
              Thêm câu hỏi
            </button>
            {saveError && (
              <p className="form-error" role="alert">
                {saveError}
              </p>
            )}
            <div className="quick-reply-save">
              <small>
                {drafts[selected]
                  ? "Có thay đổi chưa lưu."
                  : "Bộ câu hỏi đã lưu."}
              </small>
              <button type="submit" className="button" disabled={busy}>
                <Save size={17} />
                {busy ? "Đang lưu…" : "Lưu bộ câu hỏi"}
              </button>
            </div>
          </fieldset>
        </form>
        <aside className="admin-panel quick-reply-preview">
          <p className="eyebrow">Khách sẽ thấy</p>
          <h2>Hỏi chuyện quê</h2>
          <p>{draft.greeting.vi}</p>
          <div>
            {draft.replies
              .filter((item) => item.enabled !== false)
              .map((item, i) => (
                <details key={item.id || i}>
                  <summary>{item.question.vi || "Câu hỏi mới"}</summary>
                  <p>
                    {item.answer.vi || "Nội dung trả lời sẽ xuất hiện ở đây."}
                  </p>
                </details>
              ))}
          </div>
          <small>
            Tiếng Anh để trống sẽ dùng nội dung tiếng Việt. Bản xem trước chưa
            áp dụng ra website cho đến khi lưu.
          </small>
        </aside>
      </div>
    </>
  );
}
