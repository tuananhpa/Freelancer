import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Headset, Send, X, MessageCircle, Loader2, ImagePlus } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../../context/AuthContext';
import { createStompClient } from '../../services/socket';
import {
  supportApi,
  guestSession,
  externalChannels,
  SupportConversation,
  SupportMessage,
  ReadReceipt,
} from '../../services/supportApi';
import { getApiErrorMessage } from '../../services/api';

/** Chi hien gio phut - ngay thang da ro trong ngu canh cuoc tro chuyen. */
const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Bong bong chat ho tro noi o goc man hinh.
 * Dung duoc ca khi chua dang nhap: luc do phien duoc dinh danh bang guest token.
 */
const SupportWidget: React.FC = () => {
  const { user, token, isAdmin, isOffice } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Ho tro vien dung trang hop thu rieng, khong can bong bong nay
  const isAgent = isAdmin || isOffice;

  const appendMessage = useCallback((incoming: SupportMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
  }, []);

  /** Khach da chat truoc roi moi dang nhap: gan hoi thoai vao tai khoan de khong mat lich su. */
  useEffect(() => {
    const pendingGuestToken = guestSession.getToken();
    // Khong gan cho ho tro vien: neu ho dang nhap tren may dang co phien khach,
    // hoi thoai se bi keo ve chinh tai khoan CSKH thay vi giu nguyen cua khach.
    if (user && !isAgent && pendingGuestToken) {
      supportApi
        .claim(pendingGuestToken)
        .then(() => guestSession.clear())
        .catch(() => guestSession.clear());
    }
  }, [user, isAgent]);

  const loadExisting = useCallback(async (conversationId: string) => {
    const [conv, msgs] = await Promise.all([
      supportApi.getConversation(conversationId),
      supportApi.listMessages(conversationId),
    ]);
    setConversation(conv);
    setMessages(msgs);
  }, []);

  const initialise = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (user) {
        const conv = await supportApi.openConversation();
        setConversation(conv);
        setMessages(await supportApi.listMessages(conv.id));
      } else {
        const existingId = guestSession.getConversationId();
        if (existingId) {
          await loadExisting(existingId);
        }
        // Chua co phien khach -> hien form nhap ten/lien he (conversation van null)
      }
    } catch (err) {
      // Phien khach cu khong con hop le -> xoa de bat dau lai
      guestSession.clear();
      setConversation(null);
      setError(getApiErrorMessage(err, 'Không mở được cuộc trò chuyện. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [user, loadExisting]);

  useEffect(() => {
    if (isOpen && !conversation && !loading) {
      initialise();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Nhan tin nhan realtime qua hang doi rieng cua chinh minh
  useEffect(() => {
    if (!conversation) return;

    const client = createStompClient(
      { token, guestToken: user ? null : guestSession.getToken() },
      [
        {
          destination: '/user/queue/support',
          handler: (frame) => {
            const incoming = JSON.parse(frame.body) as SupportMessage;
            if (incoming.conversationId === conversation.id) appendMessage(incoming);
          },
        },
        {
          // Ho tro vien da doc -> danh dau tin cua minh la "Da xem"
          destination: '/user/queue/support.read',
          handler: (frame) => {
            const receipt = JSON.parse(frame.body) as ReadReceipt;
            if (receipt.conversationId !== conversation.id) return;
            setMessages((prev) =>
              prev.map((m) =>
                m.senderRole === 'REQUESTER' && !m.readAt ? { ...m, readAt: receipt.readAt } : m
              )
            );
          },
        },
        {
          destination: '/user/queue/support.typing',
          handler: (frame) => {
            try {
              const event = JSON.parse(frame.body);
              if (event.conversationId === conversation.id) {
                setAgentTyping(Boolean(event.isTyping));
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (event.isTyping) {
                  typingTimeoutRef.current = setTimeout(() => setAgentTyping(false), 3000);
                }
              }
            } catch {
              // ignore
            }
          },
        },
      ]
    );
    clientRef.current = client;

    return () => {
      client?.deactivate();
      clientRef.current = null;
    };
  }, [conversation, token, user, appendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startGuestChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestContact.trim()) return;
    setError('');
    setLoading(true);
    try {
      const session = await supportApi.openGuestSession(guestName.trim(), guestContact.trim());
      setConversation(session.conversation);
      setMessages([]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tạo được cuộc trò chuyện.'));
    } finally {
      setLoading(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!conversation || uploading) return;
    setError('');
    setUploading(true);
    try {
      const url = await supportApi.uploadAttachment(conversation.id, file);
      appendMessage(await supportApi.sendMessage(conversation.id, '', url));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được ảnh.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !conversation || sending) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      appendMessage(await supportApi.sendMessage(conversation.id, content));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được tin nhắn.'));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  if (isAgent) return null;

  return (
    <>
      {/* Nut noi */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Đóng hỗ trợ' : 'Mở hỗ trợ'}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-cam px-4 py-3 text-white shadow-cam transition-transform hover:-translate-y-0.5"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
        <span className="hidden text-sm font-bold sm:inline">Hỗ trợ</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[520px] max-h-[calc(100vh-8rem)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-night-border dark:bg-night-surface">
          <header className="flex items-center gap-2 border-b border-gray-100 bg-cam px-4 py-3 text-white dark:border-night-border">
            <Headset className="h-5 w-5" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Hỗ trợ ĐIỂM SÁNG</p>
              <p className="truncate text-xs opacity-90">
                {conversation?.assigneeName
                  ? `Đang trò chuyện với ${conversation.assigneeName}`
                  : 'Thường phản hồi trong giờ hành chính'}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-kem px-4 py-4 dark:bg-night-page">
            {loading && (
              <div className="flex justify-center py-6 text-vutruNhat dark:text-night-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {!loading && !conversation && !user && (
              <form onSubmit={startGuestChat} className="space-y-3">
                <p className="text-sm text-vutruNhat dark:text-night-muted">
                  Cho chúng tôi xin vài thông tin để liên hệ lại nếu cuộc trò chuyện bị gián đoạn.
                </p>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tên của bạn"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cam dark:border-night-border dark:bg-night-elevated dark:text-night-text"
                />
                <input
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  placeholder="Email hoặc số điện thoại"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cam dark:border-night-border dark:bg-night-elevated dark:text-night-text"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cam py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Bắt đầu trò chuyện
                </button>
              </form>
            )}

            {!loading && conversation && messages.length === 0 && (
              <p className="py-6 text-center text-sm text-vutruNhat dark:text-night-muted">
                Xin chào! Bạn cần hỗ trợ điều gì?
              </p>
            )}

            {messages.map((message, index) => {
              const mine = message.senderRole === 'REQUESTER';
              // Chi hien trang thai o tin cuoi cung cua minh, tranh lap lai day man hinh
              const isLastMine =
                mine && !messages.slice(index + 1).some((m) => m.senderRole === 'REQUESTER');

              return (
                <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'bg-cam text-white'
                        : 'bg-white text-vutru shadow-soft dark:bg-night-elevated dark:text-night-text'
                    }`}
                  >
                    {!mine && message.senderName && (
                      <p className="mb-0.5 text-xs font-bold opacity-70">{message.senderName}</p>
                    )}
                    {message.imageUrl && (
                      <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={message.imageUrl}
                          alt="Ảnh đính kèm"
                          loading="lazy"
                          className={`max-h-48 w-full rounded-xl object-cover ${message.content ? 'mb-1.5' : ''}`}
                        />
                      </a>
                    )}
                    {message.content}
                  </div>
                  <span className="mt-0.5 px-1 text-[10px] text-vutruNhat dark:text-night-muted">
                    {formatTime(message.sentAt)}
                    {isLastMine && (message.readAt ? ' · Đã xem' : ' · Đã gửi')}
                  </span>
                </div>
              );
            })}

            {agentTyping && (
              <div className="flex items-center gap-2 py-1 px-3 text-xs text-vutruNhat dark:text-night-muted italic">
                <span className="inline-flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span>Hỗ trợ viên đang soạn tin nhắn...</span>
              </div>
            )}
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {conversation && (
            <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 dark:border-night-border">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) sendImage(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || conversation.status === 'CLOSED'}
                aria-label="Gửi ảnh"
                title="Gửi ảnh (tối đa 5MB)"
                className="shrink-0 rounded-xl p-2 text-vutruNhat hover:bg-gray-100 disabled:opacity-40 dark:text-night-muted dark:hover:bg-night-elevated"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              </button>
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (conversation) {
                    const now = Date.now();
                    if (now - lastTypingSentRef.current > 1500) {
                      lastTypingSentRef.current = now;
                      if (clientRef.current?.connected) {
                        clientRef.current.publish({
                          destination: '/app/support.typing',
                          body: JSON.stringify({ conversationId: conversation.id, isTyping: true }),
                        });
                      } else {
                        supportApi.sendTyping(conversation.id, true);
                      }
                    }
                  }
                }}
                placeholder={conversation.status === 'CLOSED' ? 'Hội thoại đã đóng' : 'Nhập tin nhắn...'}
                disabled={conversation.status === 'CLOSED'}
                className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none disabled:opacity-60 dark:bg-night-elevated dark:text-night-text"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim() || conversation.status === 'CLOSED'}
                aria-label="Gửi"
                className="rounded-xl bg-cam p-2 text-white disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}

          {(externalChannels.messenger || externalChannels.zalo) && (
            <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-2 text-xs dark:border-night-border">
              <span className="text-vutruNhat dark:text-night-muted">Hoặc nhắn qua</span>
              {externalChannels.messenger && (
                <a
                  href={externalChannels.messenger}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-bold text-cam hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Messenger
                </a>
              )}
              {externalChannels.zalo && (
                <a
                  href={externalChannels.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-cam hover:underline"
                >
                  Zalo
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SupportWidget;
