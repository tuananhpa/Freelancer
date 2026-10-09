import { useEffect, useState } from 'react';
import { adminService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import Icon from '@/components/common/Icon';
import { formatDateTime } from '@/utils/format';

/** Hộp thư: admin xem hội thoại từ widget chat và trả lời trực tiếp khách. */
export default function InboxPage() {
  useDocumentTitle('Hộp thư chat');
  const threads = useAsync(() => adminService.listThreads(), []);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!activeId) return;
    adminService.getThread(activeId).then((t) => { setThread(t); threads.reload(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const reply = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setThread(await adminService.reply(activeId, text));
    setText('');
  };

  if (threads.loading && !threads.data) return <Loading />;
  if (threads.error) return <ErrorState error={threads.error} onRetry={threads.reload} />;

  return (
    <>
      <div className="page-head"><div><p>Live chat</p><h1>Hộp thư khách hàng</h1></div>
        <button type="button" className="btn btn--outline" onClick={threads.reload}>Làm mới</button></div>
      <div className="inbox">
        <div className="inbox__list">
          {threads.data.length === 0 && <p className="empty">Chưa có hội thoại. Mở trang sản phẩm và bấm nút chat để thử.</p>}
          {threads.data.map((t) => (
            <button type="button" key={t.id} className={`inbox__item ${t.id === activeId ? 'is-on' : ''}`} onClick={() => setActiveId(t.id)}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{t.customerName} · {t.productName}</strong>
                {t.unread > 0 && <span className="badge badge--red">{t.unread}</span>}
              </span>
              <small>{t.lastMessage?.text}</small>
              <small>{formatDateTime(t.updatedAt)}</small>
            </button>
          ))}
        </div>
        <div className="inbox__thread">
          {!thread ? <p className="empty">Chọn một hội thoại để xem.</p> : (
            <>
              <div className="inbox__msgs">
                {thread.messages.map((m) => <div key={m.id} className={`bubble bubble--${m.from}`} title={formatDateTime(m.at)}>{m.text}</div>)}
              </div>
              <form onSubmit={reply} className="chat-panel__form">
                <label className="sr-only" htmlFor="reply">Trả lời</label>
                <input id="reply" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Trả lời khách…" />
                <button type="submit" className="btn btn--primary"><Icon name="send" size={16} /> Gửi</button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
