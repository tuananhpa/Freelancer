import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, X, Send, Leaf, ChevronRight } from "lucide-react";
import { repository, isMock } from "../services";
import { useResource } from "../hooks/useResource";
import { useLanguage } from "../app/providers";
import type { Localized, QuickReply } from "../types/domain";
import { SocialWidgets } from "./SocialWidgets";
import { defaultChatGreeting, defaultQuickReplies } from "../data/quickReplies";
type ChatTurn = { id: string; role: "user" | "assistant"; text: Localized };
const turn = (role: ChatTurn["role"], text: Localized): ChatTurn => ({
  id: crypto.randomUUID(),
  role,
  text,
});
export function ChatWidget() {
  const { slug } = useParams();
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: product, reload: reloadProduct } = useResource(
    () => (slug ? repository.products.get(slug) : Promise.resolve(undefined)),
    [slug],
  );
  const { data: settings, reload: reloadSettings } = useResource(() =>
    repository.settings.get(),
  );
  const faqs = (
    product?.faq ??
    settings?.quickReplies ??
    defaultQuickReplies
  ).filter((item) => item.enabled !== false);
  const greeting = settings?.chatGreeting ?? defaultChatGreeting;
  useEffect(() => {
    if (open) {
      reloadProduct();
      reloadSettings();
    }
  }, [open, reloadProduct, reloadSettings]);
  useEffect(() => {
    if (open && bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [open, messages, busy]);
  function askQuick(reply: QuickReply) {
    setError("");
    setMessages((previous) => [
      ...previous,
      turn("user", reply.question),
      turn("assistant", reply.answer),
    ]);
  }
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    const matchingReply = faqs.find((reply) =>
      [reply.question.vi, reply.question.en].some(
        (q) => q.trim().toLocaleLowerCase() === text.toLocaleLowerCase(),
      ),
    );
    if (matchingReply) {
      setMessages((previous) => [
        ...previous,
        turn("user", { vi: text, en: text }),
        turn("assistant", matchingReply.answer),
      ]);
      setQuestion("");
      setError("");
      return;
    }
    setError("");
    setBusy(true);
    setQuestion("");
    setMessages((previous) => [
      ...previous,
      turn("user", { vi: text, en: text }),
    ]);
    try {
      await repository.messages.add({
        name: t("Khách ghé thăm", "Visitor"),
        question: text,
        productId: product?.id,
      });
      setMessages((previous) => [
        ...previous,
        turn(
          "assistant",
          isMock
            ? {
                vi: "Đã lưu câu hỏi vào hộp thư quản trị.",
                en: "Your question is saved in the admin inbox.",
              }
            : {
                vi: "Đã gửi câu hỏi. Đội ngũ hỗ trợ sẽ tiếp nhận.",
                en: "Your question has been sent to our team.",
              },
        ),
      ]);
    } catch (e) {
      setError((e as Error).message);
      setQuestion((current) => current || text);
      setMessages((previous) => [
        ...previous,
        turn("assistant", {
          vi: "Câu hỏi chưa gửi được. Bạn có thể thử gửi lại.",
          en: "Your question could not be sent. Please try again.",
        }),
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }
  return (
    <div className="chat-widget">
      {!open && <SocialWidgets />}
      {open && (
        <section
          className="chat-panel"
          aria-label={t("Trợ lý HYTales", "HYTales assistant")}
        >
          <div className="chat-heading">
            <span>
              <Leaf size={20} />
              <strong>
                {t("Bạn hỏi, chuyện quê đáp", "Ask about our stories")}
              </strong>
            </span>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label={t("Đóng trò chuyện", "Close chat")}
            >
              <X size={20} />
            </button>
          </div>
          <div className="chat-body" ref={bodyRef}>
            <div
              className="chat-transcript"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-label={t("Lịch sử trò chuyện", "Chat history")}
            >
              <div className="chat-greeting">
                {greeting[lang] || greeting.vi}
              </div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message chat-message-${message.role} ${message.role === "assistant" ? "chat-answer" : ""}`}
                >
                  <small>
                    {message.role === "user" ? t("Bạn", "You") : "HYTales"}
                  </small>
                  <p>{message.text[lang] || message.text.vi}</p>
                </div>
              ))}
              {busy && (
                <p className="chat-pending" role="status">
                  {t("Đang gửi câu hỏi…", "Sending your question…")}
                </p>
              )}
            </div>
          </div>
          {!!faqs.length && (
            <details className="chat-suggestions" open>
              <summary>{t("Gợi ý câu hỏi", "Suggested questions")}</summary>
              <div>
                {faqs.map((f, i) => (
                  <button
                    className="faq-button"
                    key={f.id || i}
                    disabled={busy}
                    onClick={() => askQuick(f)}
                  >
                    {f.question[lang] || f.question.vi}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </details>
          )}
          <form className="chat-composer" onSubmit={send}>
            <label htmlFor="chat-question">
              {t("Gửi câu hỏi cho đội ngũ", "Send a question to our team")}
            </label>
            <div className="chat-input">
              <input
                id="chat-question"
                ref={inputRef}
                name="question"
                required
                maxLength={500}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("Nhập câu hỏi…", "Your question…")}
              />
              <button
                className="icon-button"
                disabled={busy || !question.trim()}
                aria-label={t("Gửi câu hỏi", "Send question")}
              >
                <Send size={18} />
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <small>
            {t("Trợ lý theo kịch bản của HYTales", "HYTales guided assistant")}
          </small>
        </section>
      )}
      <button
        className="chat-launcher"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("Hỏi HYTales", "Ask HYTales")}
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
        <span>{t("Hỏi chuyện quê", "Ask us")}</span>
      </button>
    </div>
  );
}
