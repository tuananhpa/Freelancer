import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  RotateCcw,
  Copy,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { api } from "./api";
import { questionGroups } from "./catalog";
import { Note, Busy } from "./components";
type Message = { role: string; content: string; id?: string };
export default function Chat({
  onClose,
  configured,
  name,
  notify,
}: {
  onClose: () => void;
  configured: boolean;
  name: string;
  notify: (s: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [group, setGroup] = useState("Dinh dưỡng"),
    [confirmReset, setConfirmReset] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api("/chat")
      .then((r) => setMessages(r.messages))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function send(value = input) {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const { answer } = await api("/ai/chat", "POST", { message: value });
      setMessages((m) => [
        ...m,
        { role: "user", content: value },
        { role: "assistant", content: answer },
      ]);
      setInput("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-overlay">
      <section className="chat-panel" aria-label="Trò chuyện với NuTri">
        <header className="chat-head">
          <span className="assistant-avatar">
            <MessageCircle size={24} />
          </span>
          <div>
            <h2>NuTri AI</h2>
            <p>Góc hỏi đáp của {name}</p>
          </div>
          <button
            className="icon-btn"
            aria-label="Làm mới cuộc trò chuyện"
            onClick={() => setConfirmReset(true)}
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="icon-btn"
            aria-label="Đóng cửa sổ chat"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>
        <div className="chat-messages">
          <div className="chat-message assistant">
            <Sparkles size={19} />
            <div>
              Chào bạn! Mình là NuTri, cùng bạn tìm hiểu món ăn, dinh dưỡng và
              những thói quen hằng ngày. Hôm nay bạn muốn hỏi điều gì?
            </div>
          </div>
          {messages.map((m, i) => (
            <div className={"chat-message " + m.role} key={m.id ?? i}>
              <div>
                {m.content}
                {m.role === "assistant" && (
                  <button
                    className="copy-btn"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(m.content)
                        .then(() => notify("Đã sao chép."))
                        .catch(() => notify("Trình duyệt không cho sao chép."))
                    }
                  >
                    <Copy size={13} />
                    Sao chép
                  </button>
                )}
              </div>
            </div>
          ))}
          {busy && <Busy />}
          <div ref={end} />
        </div>
        <div className="chat-bottom">
          {!configured && (
            <Note>
              Gemini chưa được cấu hình. Chat sẽ hoạt động sau khi quản trị viên
              cập nhật khóa.
            </Note>
          )}
          {!messages.length && (
            <>
              <div className="chips small-chips">
                {Object.keys(questionGroups).map((g) => (
                  <button
                    key={g}
                    className={group === g ? "selected" : ""}
                    onClick={() => setGroup(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="question-list">
                {questionGroups[group].map((q) => (
                  <button
                    key={q}
                    disabled={busy || !configured}
                    onClick={() => send(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              aria-label="Câu hỏi cho NuTri"
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi về món ăn, thói quen…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="btn primary"
              aria-label="Gửi câu hỏi"
              disabled={busy || !configured || !input.trim()}
            >
              <Send size={19} />
            </button>
          </form>
          <small>
            NuTri có thể nhầm. Gợi ý giáo dục, không thay thế tư vấn chuyên môn.
          </small>
        </div>
        {confirmReset && (
          <div className="chat-reset-confirm">
            <p>Xóa lịch sử cuộc trò chuyện này?</p>
            <button className="btn" onClick={() => setConfirmReset(false)}>
              Giữ lại
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                try {
                  await api("/chat", "DELETE");
                  setMessages([]);
                  setConfirmReset(false);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Xóa lịch sử
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
