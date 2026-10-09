import { useState } from "react";
import { MessageCircle, HeartHandshake, Star, Send, Check } from "lucide-react";
import { repository, isMock } from "../../services";
import { useResource } from "../../hooks/useResource";
import { useNotice } from "../../app/providers";
import { Loading, ErrorState, formatDate } from "../../components/common";
import { isReviewImage } from "../../utils/media";
import { MediaImage } from "../../components/Media";
export default function InboxPage() {
  const { data, loading, error, reload } = useResource(async () => ({
    messages: await repository.messages.list(),
    inquiries: await repository.inquiries.list(),
    reviews: await repository.reviews.list(),
  }));
  const [tab, setTab] = useState("messages");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const notify = useNotice();
  async function respond(id: string) {
    if (!reply[id]?.trim()) return;
    setBusy(true);
    try {
      await repository.messages.reply(id, reply[id].trim());
      reload();
      notify(isMock ? "Đã lưu phản hồi." : "Đã gửi phản hồi.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function contact(id: string) {
    try {
      await repository.inquiries.update(id, "contacted");
      reload();
      notify("Đã đánh dấu đã liên hệ.");
    } catch (e) {
      notify((e as Error).message);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Gặp người thưởng thức</p>
          <h1>Hộp thư & kết nối</h1>
          <p>Những lời hỏi thăm và cảm nhận, từ phía bên kia mã QR.</p>
        </div>
      </div>
      <div className="inbox-tabs">
        {[
          {
            id: "messages",
            name: "Câu hỏi",
            icon: MessageCircle,
            count: data?.messages.length,
          },
          {
            id: "inquiries",
            name: "Yêu cầu kết nối",
            icon: HeartHandshake,
            count: data?.inquiries.length,
          },
          {
            id: "reviews",
            name: "Cảm nhận",
            icon: Star,
            count: data?.reviews.length,
          },
        ].map(({ id, name, icon: Icon, count }) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {name}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {tab === "messages" && (
        <div className="inbox-list">
          {data?.messages.length ? (
            data.messages.map((m) => (
              <article className="admin-panel" key={m.id}>
                <div className="panel-heading">
                  <div>
                    <strong>{m.name}</strong>
                    <small>{formatDate(m.createdAt)}</small>
                  </div>
                  <span
                    className={`status-badge ${m.reply ? "published" : ""}`}
                  >
                    {m.reply ? "Đã phản hồi" : "Chờ phản hồi"}
                  </span>
                </div>
                <p className="message-question">{m.question}</p>
                {m.reply && (
                  <div className="chat-answer">
                    <strong>Phản hồi đã lưu</strong>
                    <p>{m.reply}</p>
                  </div>
                )}
                <label className="form-stack">
                  Phản hồi
                  <textarea
                    rows={3}
                    value={reply[m.id] ?? m.reply ?? ""}
                    onChange={(e) =>
                      setReply({ ...reply, [m.id]: e.target.value })
                    }
                    maxLength={2000}
                  />
                </label>
                <button
                  className="button button-small"
                  disabled={busy || !(reply[m.id] ?? m.reply)?.trim()}
                  onClick={() => void respond(m.id)}
                >
                  <Send size={15} />
                  {isMock ? "Lưu phản hồi" : "Gửi phản hồi"}
                </button>
              </article>
            ))
          ) : (
            <div className="admin-panel empty-inbox">
              <MessageCircle size={38} />
              <h2>Chưa có câu hỏi.</h2>
              <p>
                Thử gửi câu hỏi qua nút “Hỏi chuyện quê” ở trang trải nghiệm.
              </p>
            </div>
          )}
        </div>
      )}
      {tab === "inquiries" && (
        <div className="inbox-list">
          {data?.inquiries.length ? (
            data.inquiries.map((i) => (
              <article className="admin-panel" key={i.id}>
                <div className="panel-heading">
                  <div>
                    <strong>{i.name}</strong>
                    <small>
                      {i.phone} · {formatDate(i.createdAt)}
                    </small>
                  </div>
                  <span className="status-badge">
                    {i.type === "purchase"
                      ? "Quà tặng / mua thêm"
                      : "Đối tác / HTX"}
                  </span>
                </div>
                {i.type === "purchase" && i.quantity && (
                  <p className="inquiry-product">
                    <strong>{i.productName || i.productId}</strong> ·{" "}
                    {i.quantity} {i.unit}
                  </p>
                )}
                <p>{i.note || "Không có lời nhắn bổ sung."}</p>
                <div className="inquiry-actions">
                  <a
                    className="underlined-link"
                    href={`tel:${i.phone.replace(/[^\d+]/g, "")}`}
                  >
                    Gọi liên hệ
                  </a>
                  <button
                    className="button button-small button-outline"
                    disabled={i.status === "contacted"}
                    onClick={() => void contact(i.id)}
                  >
                    <Check size={15} />
                    {i.status === "contacted"
                      ? "Đã liên hệ"
                      : "Đánh dấu đã liên hệ"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="admin-panel empty-inbox">
              <HeartHandshake size={38} />
              <h2>Chưa có yêu cầu kết nối.</h2>
              <p>
                Yêu cầu từ form quà tặng hoặc kết nối HTX sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </div>
      )}
      {tab === "reviews" && (
        <div className="inbox-list">
          {data?.reviews.length ? (
            data.reviews.map((r) => (
              <article className="admin-panel" key={r.id}>
                <div className="panel-heading">
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {formatDate(r.createdAt)} · {r.productId}
                    </small>
                  </div>
                  <span className="review-stars">
                    {r.rating}/5 <Star size={15} fill="currentColor" />
                  </span>
                </div>
                <p>{r.text}</p>
                {r.image && isReviewImage(r.image) && (
                  <MediaImage
                    className="inbox-review-photo"
                    src={r.image}
                    alt="Ảnh cảm nhận"
                  />
                )}
              </article>
            ))
          ) : (
            <div className="admin-panel empty-inbox">
              <Star size={38} />
              <h2>Chưa có cảm nhận.</h2>
              <p>
                Cảm nhận của khách trên trang sản phẩm sẽ xuất hiện tại đây.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
