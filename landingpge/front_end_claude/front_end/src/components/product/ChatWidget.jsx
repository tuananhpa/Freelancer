import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/common/Icon';
import { chatService } from '@/services/api';
import { STORAGE_KEYS } from '@/config/constants';

const POLL_MS = 8000;
const sessionKey = (slug) => `${STORAGE_KEYS.chatSession}.${slug || 'home'}`;

/**
 * Widget chat nổi: chatbot FAQ tự động + chuyển tin cho admin (Hộp thư).
 * Phiên chat lưu sessionId trong localStorage, khách không cần đăng nhập.
 * Backend thật có thể thay polling bằng WebSocket/SSE.
 */
export default function ChatWidget({ productSlug, faqs = [] }) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState(() => { try { return localStorage.getItem(sessionKey(productSlug)); } catch { return null; } });
  const [messages, setMessages] = useState([]);
  const [quick, setQuick] = useState(faqs.map((f) => f.question));
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const init = async () => {
      try {
        if (sessionId) {
          const msgs = await chatService.getMessages(sessionId);
          if (!cancelled) setMessages(msgs);
        } else {
          const res = await chatService.startSession({ productSlug });
          if (cancelled) return;
          setSessionId(res.sessionId);
          try { localStorage.setItem(sessionKey(productSlug), res.sessionId); } catch { /* ignore */ }
          setMessages(res.messages);
          if (res.quickReplies?.length) setQuick(res.quickReplies);
        }
      } catch {
        // phiên cũ không còn -> tạo phiên mới
        try { localStorage.removeItem(sessionKey(productSlug)); } catch { /* ignore */ }
        if (!cancelled && sessionId) setSessionId(null);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [open, sessionId, productSlug]);

  useEffect(() => {
    if (!open || !sessionId) return undefined;
    const t = setInterval(() => chatService.getMessages(sessionId).then(setMessages).catch(() => {}), POLL_MS);
    return () => clearInterval(t);
  }, [open, sessionId]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async (value) => {
    const msg = (value ?? text).trim();
    if (!msg || !sessionId || sending) return;
    setText('');
    setSending(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, from: 'customer', text: msg }]);
    try { setMessages(await chatService.sendMessage(sessionId, msg)); } catch { /* giữ tin tạm */ }
    setSending(false);
  };

  return (
    <>
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Chat với nhà vườn">
          <div className="chat-panel__head">
            <span className="brand__mark" aria-hidden="true">H</span>
            <div style={{ flex: 1 }}><strong>Trợ lý HYTale</strong><small>Thường trả lời trong vài phút</small></div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Đóng chat"><Icon name="x" /></button>
          </div>
          <div className="chat-panel__body" ref={bodyRef} aria-live="polite">
            {messages.map((m) => <div key={m.id} className={`bubble bubble--${m.from}`}>{m.text}</div>)}
          </div>
          {quick.length > 0 && (
            <div className="quick-replies">{quick.map((q) => <button type="button" key={q} onClick={() => send(q)}>{q}</button>)}</div>
          )}
          <form className="chat-panel__form" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <label className="sr-only" htmlFor="chat-input">Tin nhắn</label>
            <input id="chat-input" className="input" placeholder="Nhập câu hỏi…" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
            <button type="submit" className="icon-btn" style={{ background: 'var(--vermilion)', flex: 'none' }} aria-label="Gửi" disabled={sending}><Icon name="send" size={18} /></button>
          </form>
        </div>
      )}
      <button type="button" className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Đóng chat' : 'Mở chat hỗ trợ'} aria-expanded={open}>
        <Icon name={open ? 'x' : 'chat'} size={26} />
      </button>
    </>
  );
}
