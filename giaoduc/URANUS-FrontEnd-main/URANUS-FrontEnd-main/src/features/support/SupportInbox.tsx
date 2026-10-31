import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import {
  Send,
  Loader2,
  CheckCircle2,
  UserPlus,
  ImagePlus,
  Search,
  MessageSquare,
  Check,
  CheckCheck,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createStompClient } from '../../services/socket';
import { supportApi, SupportConversation, SupportMessage, SupportStatus, ReadReceipt } from '../../services/supportApi';
import { getApiErrorMessage } from '../../services/api';
import { SUPPORT_READ_EVENT } from '../../utils/supportEvents';
import UserAvatar from '../../components/common/UserAvatar';

import PageHeader from '../../components/ui/PageHeader';
import { Headset } from 'lucide-react';
/** "Chua doc" khong phai trang thai trong DB nen loc o phia giao dien. */
type InboxFilter = 'ALL' | 'UNREAD' | SupportStatus;

const FILTERS: Array<{ label: string; value: InboxFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chưa đọc', value: 'UNREAD' },
  { label: 'Chờ xử lý', value: 'OPEN' },
  { label: 'Đang xử lý', value: 'ASSIGNED' },
  { label: 'Đã đóng', value: 'CLOSED' },
];

const STATUS_LABEL: Record<SupportStatus, string> = {
  OPEN: 'Chờ xử lý',
  ASSIGNED: 'Đang xử lý',
  CLOSED: 'Đã đóng',
};

const STATUS_DOT: Record<SupportStatus, string> = {
  OPEN: 'bg-amber-400',
  ASSIGNED: 'bg-emerald-500',
  CLOSED: 'bg-gray-300 dark:bg-night-border',
};

const STATUS_PILL: Record<SupportStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  ASSIGNED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  CLOSED: 'bg-gray-100 text-gray-500 dark:bg-night-elevated dark:text-night-muted',
};

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const parseDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatClock = (iso: string | null | undefined) => {
  const d = parseDate(iso);
  return d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Cot thoi gian trong danh sach: ngan nhu Messenger - 5 phut / 14:03 / T4 / 12/08. */
const formatListTime = (iso: string | null | undefined) => {
  const d = parseDate(iso);
  if (!d) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút`;
  if (isSameDay(d, now)) return formatClock(iso);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Hôm qua';

  if (diffMs < 7 * 86400000) return WEEKDAYS[d.getDay()];
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

/** Dai phan cach giua cac ngay trong khung chat. */
const formatDayDivider = (iso: string) => {
  const d = parseDate(iso);
  if (!d) return '';
  const now = new Date();
  if (isSameDay(d, now)) return 'Hôm nay';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Hôm qua';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Dong tom tat mot hoi thoai trong danh sach ben trai. */
const previewOf = (conversation: SupportConversation) => {
  const text = conversation.lastMessagePreview?.trim();
  if (!text) return 'Chưa có tin nhắn';
  return conversation.lastMessageFromAgent ? `Bạn: ${text}` : text;
};

/** Sap xep giong Messenger: hoi thoai co tin moi nhat len dau. */
const sortByRecent = (list: SupportConversation[]) =>
  [...list].sort((a, b) => {
    const at = parseDate(a.lastMessageAt ?? a.createdAt)?.getTime() ?? 0;
    const bt = parseDate(b.lastMessageAt ?? b.createdAt)?.getTime() ?? 0;
    return bt - at;
  });

/** Hop thu cua bo phan ho tro (OFFICE/ADMIN). */
const SupportInbox: React.FC = () => {
  const { token } = useAuth();

  const [filter, setFilter] = useState<InboxFilter>('ALL');
  const [search, setSearch] = useState('');
  const [showEmpty, setShowEmpty] = useState(false);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selected, setSelected] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<Client | null>(null);
  const selectedRef = useRef<SupportConversation | null>(null);
  const showEmptyRef = useRef(showEmpty);
  const [requesterTyping, setRequesterTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);
  // Hoi thoai duoc tro toi tu thong bao.
  //  ?c=<conversationId> - duong chinh xac, backend gan san tu khi tao thong bao.
  //  ?name=<ten>         - du phong cho thong bao cu chua kem id, ten duoc rut ra
  //                        tu dong tom tat "Ten nguoi gui: noi dung".
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('c');
  const focusName = searchParams.get('name');
  const focusKey = focusId ?? (focusName ? `name:${focusName}` : null);
  const focusHandledRef = useRef<string | null>(null);
  selectedRef.current = selected;
  showEmptyRef.current = showEmpty;

  const apiStatus = filter === 'ALL' || filter === 'UNREAD' ? undefined : filter;

  const loadInbox = useCallback(async (status?: SupportStatus, includeEmpty = false) => {
    setLoadingList(true);
    try {
      setConversations(sortByRecent(await supportApi.inbox(status, includeEmpty)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được hộp thư hỗ trợ.'));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadInbox(apiStatus, showEmpty);
  }, [apiStatus, showEmpty, loadInbox]);

  const openConversation = async (conversation: SupportConversation) => {
    setSelected(conversation);
    setLoadingThread(true);
    setError('');
    // Server danh dau da doc khi tra ve danh sach tin nhan, cap nhat luon o day
    // de huy hieu khong con sau khi da mo.
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? { ...c, unreadFromRequester: 0 } : c))
    );
    // Thanh ben giu huy hieu rieng cua no; bao de no tut xuong ngay thay vi doi
    // lan tai trang sau. Server danh dau da doc trong listMessages ben duoi.
    window.dispatchEvent(new Event(SUPPORT_READ_EVENT));
    try {
      setMessages(await supportApi.listMessages(conversation.id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được nội dung hội thoại.'));
    } finally {
      setLoadingThread(false);
    }
  };

  /**
   * Bam vao thong bao "Tin nhan ho tro moi" phai ra dung khung chat cua nguoi do.
   *
   * Bo loc dang bat co the che mat hoi thoai can mo (vi du dang loc "Da dong" ma
   * thong bao tro toi mot hoi thoai "Cho xu ly"), nen go bo loc truoc khi tim.
   */
  useEffect(() => {
    if (!focusKey || focusHandledRef.current === focusKey) return;
    setFilter('ALL');
    setSearch('');
  }, [focusKey]);

  useEffect(() => {
    if (!focusKey || loadingList || focusHandledRef.current === focusKey) return;

    // Danh sach da sap theo tin moi nhat, nen khi tra theo ten thi ban ghi dau
    // tien tim duoc chinh la hoi thoai gan day nhat cua nguoi do - dung cai ma
    // thong bao dang noi toi. Ten trong thong bao va trong hop thu co the khac
    // kieu chu hoa/thuong nen so khop sau khi ha het ve chu thuong.
    const wantedName = focusName?.trim().toLowerCase();
    const target = focusId
      ? conversations.find((c) => c.id === focusId)
      : conversations.find((c) => c.displayName.trim().toLowerCase() === wantedName);

    focusHandledRef.current = focusKey;

    if (!target) {
      setError(
        focusName
          ? `Không tìm thấy cuộc trò chuyện của ${focusName}.`
          : 'Không mở được hội thoại từ thông báo. Có thể hội thoại đã bị xoá.'
      );
      return;
    }

    openConversation(target);
    // Hop thu co the dai hang chuc dong, cuon dong duoc chon vao tam nhin.
    requestAnimationFrame(() => {
      document.getElementById(`conv-${target.id}`)?.scrollIntoView({ block: 'nearest' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, loadingList, conversations]);

  // Realtime: cap nhat danh sach + tin nhan cua hoi thoai dang mo
  useEffect(() => {
    const client = createStompClient({ token }, [
      {
        destination: '/topic/support.agents',
        handler: (frame) => {
          const updated = JSON.parse(frame.body) as SupportConversation;
          setConversations((prev) => {
            const existing = prev.find((c) => c.id === updated.id);
            // Hoi thoai chua co tin nhan nao khong duoc chen vao hop thu, tru khi
            // ho tro vien da bat che do xem ca hoi thoai rong.
            if (!existing && updated.hasMessages === false && !showEmptyRef.current) return prev;

            // Dang mo hoi thoai nay thi coi nhu da doc, tranh huy hieu nhay len lai.
            const merged = selectedRef.current?.id === updated.id
              ? { ...updated, unreadFromRequester: 0 }
              : updated;
            return sortByRecent([merged, ...prev.filter((c) => c.id !== updated.id)]);
          });
          setSelected((prev) => (prev && prev.id === updated.id ? { ...updated, unreadFromRequester: 0 } : prev));
        },
      },
      {
        // Nguoi dung da doc -> danh dau tin cua ho tro vien la "Da xem"
        destination: '/topic/support.agents.read',
        handler: (frame) => {
          const receipt = JSON.parse(frame.body) as ReadReceipt;
          if (selectedRef.current?.id !== receipt.conversationId) return;
          setMessages((prev) =>
            prev.map((m) => (m.senderRole === 'AGENT' && !m.readAt ? { ...m, readAt: receipt.readAt } : m))
          );
        },
      },
      {
        destination: '/topic/support.agents.messages',
        handler: (frame) => {
          const incoming = JSON.parse(frame.body) as SupportMessage;
          if (selectedRef.current?.id !== incoming.conversationId) return;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        },
      },
      {
        destination: '/topic/support.agents.typing',
        handler: (frame) => {
          try {
            const event = JSON.parse(frame.body);
            if (event.senderRole === 'REQUESTER' && selectedRef.current?.id === event.conversationId) {
              setRequesterTyping(Boolean(event.isTyping));
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              if (event.isTyping) {
                typingTimeoutRef.current = setTimeout(() => setRequesterTyping(false), 3000);
              }
            }
          } catch {
            // ignore
          }
        },
      },
    ]);
    clientRef.current = client;

    return () => {
      client?.deactivate();
      clientRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const reply = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || !selected) return;
    const content = draft.trim();
    setDraft('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      const sent = await supportApi.sendMessage(selected.id, content);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được tin nhắn.'));
      setDraft(content);
    }
  };

  const sendImage = async (file: File) => {
    if (!selected || uploading) return;
    setError('');
    setUploading(true);
    try {
      const url = await supportApi.uploadAttachment(selected.id, file);
      const sent = await supportApi.sendMessage(selected.id, '', url);
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không gửi được ảnh.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runAction = async (action: 'assign' | 'close') => {
    if (!selected) return;
    try {
      const updated = action === 'assign'
        ? await supportApi.assign(selected.id)
        : await supportApi.close(selected.id);
      setSelected(updated);
      loadInbox(apiStatus, showEmpty);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Thao tác không thành công.'));
    }
  };

  const visible = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === 'UNREAD' && c.unreadFromRequester === 0) return false;
      if (!keyword) return true;
      return (
        c.displayName.toLowerCase().includes(keyword) ||
        (c.guestContact ?? '').toLowerCase().includes(keyword) ||
        (c.lastMessagePreview ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [conversations, filter, search]);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadFromRequester > 0 ? 1 : 0), 0),
    [conversations]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        className="mb-4"
        icon={Headset}
        title="Hộp thư hỗ trợ"
        subtitle="Trả lời câu hỏi của học sinh và phụ huynh."
        badge={unreadTotal > 0 && (
          <span className="rounded-full bg-cam px-3 py-1 text-xs font-bold text-white">
            {unreadTotal} cần trả lời
          </span>
        )}
      />

      {error && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Bỏ qua">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex h-[calc(100vh-13rem)] min-h-[520px] gap-4 overflow-hidden">
        {/* ---------------------------------------------------- danh sach hoi thoai */}
        <aside
          className={`flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-night-border dark:bg-night-surface lg:w-[350px] ${
            selected ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 space-y-3 border-b border-gray-100 p-3 dark:border-night-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vutruNhat dark:text-night-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc nội dung..."
                className="w-full rounded-full bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-cam/30 dark:bg-night-elevated dark:text-night-text"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    filter === item.value
                      ? 'bg-cam text-white'
                      : 'bg-gray-50 text-vutruNhat hover:bg-gray-100 dark:bg-night-elevated dark:text-night-muted'
                  }`}
                >
                  {item.label}
                  {item.value === 'UNREAD' && unreadTotal > 0 && ` (${unreadTotal})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <div className="flex justify-center py-10 text-vutruNhat">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <MessageSquare className="h-8 w-8 text-gray-200 dark:text-night-border" />
                <p className="text-sm text-vutruNhat dark:text-night-muted">
                  {search ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có ai nhắn tin'}
                </p>
              </div>
            ) : (
              visible.map((conversation) => {
                const unread = conversation.unreadFromRequester > 0;
                const active = selected?.id === conversation.id;
                return (
                  <button
                    key={conversation.id}
                    id={`conv-${conversation.id}`}
                    onClick={() => openConversation(conversation)}
                    className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
                      active
                        ? 'bg-cam/10 dark:bg-cam/15'
                        : 'hover:bg-gray-50 dark:hover:bg-night-elevated'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <UserAvatar
                        fullName={conversation.displayName}
                        avatarUrl={conversation.requesterAvatar}
                        size="sm"
                      />
                      <span
                        title={STATUS_LABEL[conversation.status]}
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-night-surface ${STATUS_DOT[conversation.status]}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`truncate text-sm text-vutru dark:text-night-text ${
                            unread ? 'font-extrabold' : 'font-semibold'
                          }`}
                        >
                          {conversation.displayName}
                        </span>
                        <span className="shrink-0 text-[11px] text-vutruNhat dark:text-night-muted">
                          {formatListTime(conversation.lastMessageAt ?? conversation.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs ${
                            unread
                              ? 'font-bold text-vutru dark:text-night-text'
                              : 'text-vutruNhat dark:text-night-muted'
                          }`}
                        >
                          {previewOf(conversation)}
                        </span>
                        {unread && (
                          <span className="shrink-0 rounded-full bg-cam px-1.5 text-[11px] font-bold leading-5 text-white">
                            {conversation.unreadFromRequester}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/*
            Hoi thoai rong duoc tao tu dong khi hoc vien mo widget. An di cho hop thu
            gon, nhung van cho xem lai bang mot cu bam de khong mat du lieu nao.
          */}
          <button
            onClick={() => setShowEmpty((v) => !v)}
            className="flex shrink-0 items-center justify-center gap-2 border-t border-gray-100 py-2.5 text-xs font-bold text-vutruNhat transition-colors hover:bg-gray-50 dark:border-night-border dark:text-night-muted dark:hover:bg-night-elevated"
          >
            {showEmpty ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showEmpty ? 'Ẩn hội thoại chưa có tin nhắn' : 'Hiện cả hội thoại chưa có tin nhắn'}
          </button>
        </aside>

        {/* ---------------------------------------------------- khung tro chuyen */}
        <section
          className={`min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-night-border dark:bg-night-surface ${
            selected ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-cam/10 p-5">
                <MessageSquare className="h-8 w-8 text-cam" />
              </div>
              <p className="text-sm text-vutruNhat dark:text-night-muted">
                Chọn một cuộc trò chuyện để xem nội dung
              </p>
            </div>
          ) : (
            <>
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-night-border">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="shrink-0 text-sm font-bold text-cam lg:hidden"
                  >
                    ‹
                  </button>
                  <UserAvatar
                    fullName={selected.displayName}
                    avatarUrl={selected.requesterAvatar}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-vutru dark:text-night-text">{selected.displayName}</p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-vutruNhat dark:text-night-muted">
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${STATUS_PILL[selected.status]}`}>
                        {STATUS_LABEL[selected.status]}
                      </span>
                      {selected.guestContact && <span className="truncate">{selected.guestContact}</span>}
                      {selected.assigneeName && <span className="truncate">· {selected.assigneeName}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => runAction('assign')}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-vutru transition-colors hover:bg-gray-200 dark:bg-night-elevated dark:text-night-text"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Nhận
                  </button>
                  <button
                    onClick={() => runAction('close')}
                    disabled={selected.status === 'CLOSED'}
                    className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-vutru transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-night-elevated dark:text-night-text"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đóng
                  </button>
                </div>
              </header>

              <div className="flex-1 space-y-1 overflow-y-auto bg-kem px-4 py-4 dark:bg-night-page">
                {loadingThread ? (
                  <div className="flex justify-center py-10 text-vutruNhat">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-vutruNhat dark:text-night-muted">
                    Chưa có tin nhắn nào trong hội thoại này
                  </p>
                ) : (
                  messages.map((message, index) => {
                    const mine = message.senderRole === 'AGENT';
                    const prev = messages[index - 1];
                    const next = messages[index + 1];

                    const prevDate = parseDate(prev?.sentAt);
                    const thisDate = parseDate(message.sentAt);
                    const newDay = !prevDate || !thisDate || !isSameDay(prevDate, thisDate);

                    // Gom tin lien tiep cung nguoi trong vong 5 phut thanh mot cum,
                    // chi cum cuoi moi hien gio - giong Messenger.
                    const withinGroup = (a?: SupportMessage, b?: SupportMessage) => {
                      if (!a || !b || a.senderRole !== b.senderRole) return false;
                      const ta = parseDate(a.sentAt)?.getTime();
                      const tb = parseDate(b.sentAt)?.getTime();
                      if (!ta || !tb) return false;
                      return Math.abs(tb - ta) < 5 * 60000;
                    };
                    const groupStart = newDay || !withinGroup(prev, message);
                    const groupEnd =
                      !next ||
                      !withinGroup(message, next) ||
                      !isSameDay(thisDate as Date, parseDate(next.sentAt) as Date);

                    const isLastMine =
                      mine && !messages.slice(index + 1).some((m) => m.senderRole === 'AGENT');

                    return (
                      <React.Fragment key={message.id}>
                        {newDay && thisDate && (
                          <div className="flex justify-center py-3">
                            <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-vutruNhat shadow-soft dark:bg-night-surface dark:text-night-muted">
                              {formatDayDivider(message.sentAt)}
                            </span>
                          </div>
                        )}

                        <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                          {!mine && (
                            <div className={groupEnd ? '' : 'invisible'}>
                              <UserAvatar
                                fullName={selected.displayName}
                                avatarUrl={selected.requesterAvatar}
                                size="sm"
                                className="!h-7 !w-7 !text-[11px] !ring-0"
                              />
                            </div>
                          )}

                          <div className={`flex max-w-[72%] flex-col ${mine ? 'items-end' : 'items-start'}`}>
                            <div
                              title={formatClock(message.sentAt)}
                              className={`whitespace-pre-wrap break-words px-3 py-2 text-sm ${
                                mine
                                  ? 'bg-cam text-white'
                                  : 'bg-white text-vutru shadow-soft dark:bg-night-elevated dark:text-night-text'
                              } ${
                                // Bo goc: cum tin nhan cua cung mot nguoi dinh vao nhau
                                mine
                                  ? `rounded-l-2xl ${groupStart ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${
                                      groupEnd ? 'rounded-br-2xl' : 'rounded-br-md'
                                    }`
                                  : `rounded-r-2xl ${groupStart ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${
                                      groupEnd ? 'rounded-bl-2xl' : 'rounded-bl-md'
                                    }`
                              }`}
                            >
                              {message.imageUrl && (
                                <a href={message.imageUrl} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={message.imageUrl}
                                    alt="Ảnh đính kèm"
                                    loading="lazy"
                                    className={`max-h-60 w-full rounded-xl object-cover ${message.content ? 'mb-1.5' : ''}`}
                                  />
                                </a>
                              )}
                              {message.content}
                            </div>

                            {groupEnd && (
                              <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-vutruNhat dark:text-night-muted">
                                {formatClock(message.sentAt)}
                                {isLastMine &&
                                  (message.readAt ? (
                                    <>
                                      <CheckCheck className="h-3 w-3 text-cam" /> Đã xem
                                    </>
                                  ) : (
                                    <>
                                      <Check className="h-3 w-3" /> Đã gửi
                                    </>
                                  ))}
                              </span>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                {requesterTyping && (
                  <div className="flex items-center gap-2 py-1.5 px-4 text-xs text-vutruNhat dark:text-night-muted italic">
                    <span className="inline-flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-cam rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span>{selected.displayName || 'Khách/Học viên'} đang soạn tin nhắn...</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={reply}
                className="flex shrink-0 items-end gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-night-border"
              >
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
                  disabled={uploading || selected.status === 'CLOSED'}
                  aria-label="Gửi ảnh"
                  title="Gửi ảnh (tối đa 5MB)"
                  className="shrink-0 rounded-xl p-2 text-vutruNhat transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-night-muted dark:hover:bg-night-elevated"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                </button>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  rows={1}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    // O soan tu cao dan theo noi dung, toi da ~5 dong.
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

                    if (selected) {
                      const now = Date.now();
                      if (now - lastTypingSentRef.current > 1500) {
                        lastTypingSentRef.current = now;
                        if (clientRef.current?.connected) {
                          clientRef.current.publish({
                            destination: '/app/support.typing',
                            body: JSON.stringify({ conversationId: selected.id, isTyping: true }),
                          });
                        } else {
                          supportApi.sendTyping(selected.id, true);
                        }
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Enter gui, Shift+Enter xuong dong. Khong bat khi bo go tieng Viet
                    // dang dung phim Enter de chon tu (isComposing).
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      reply();
                    }
                  }}
                  placeholder={selected.status === 'CLOSED' ? 'Hội thoại đã đóng' : 'Nhập câu trả lời...'}
                  disabled={selected.status === 'CLOSED'}
                  className="max-h-[120px] min-w-0 flex-1 resize-none rounded-2xl bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cam/30 disabled:opacity-60 dark:bg-night-elevated dark:text-night-text"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() || selected.status === 'CLOSED'}
                  aria-label="Gửi"
                  className="shrink-0 rounded-full bg-cam p-2.5 text-white transition-opacity disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default SupportInbox;
