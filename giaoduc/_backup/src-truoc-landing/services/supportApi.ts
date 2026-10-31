import api from './api';

const GUEST_TOKEN_KEY = 'uranus_support_guest_token';
const GUEST_CONVERSATION_KEY = 'uranus_support_conversation_id';

export type SupportStatus = 'OPEN' | 'ASSIGNED' | 'CLOSED';
export type SupportSenderRole = 'REQUESTER' | 'AGENT';

export interface SupportMessage {
  id: string;
  conversationId: string;
  content: string | null;
  imageUrl: string | null;
  senderRole: SupportSenderRole;
  senderId: string | null;
  senderName: string | null;
  senderAvatar: string | null;
  sentAt: string;
  readAt: string | null;
}

export interface SupportConversation {
  id: string;
  status: SupportStatus;
  subject: string | null;
  displayName: string;
  requesterId: string | null;
  requesterAvatar: string | null;
  guestContact: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  lastMessageAt: string | null;
  unreadFromRequester: number;
  /** Trich doan tin nhan cuoi - hop thu hien nhu Messenger thay vi hien dong lien he. */
  lastMessagePreview?: string | null;
  /** Tin cuoi do ho tro vien gui -> hien tien to "Ban: ". */
  lastMessageFromAgent?: boolean | null;
  /** false khi hoi thoai duoc tao tu dong luc mo widget nhung chua ai nhan gi. */
  hasMessages?: boolean;
}

export interface ReadReceipt {
  conversationId: string;
  readerRole: SupportSenderRole;
  readAt: string;
}

export interface GuestSession {
  guestToken: string;
  conversation: SupportConversation;
}

/** Guest token la bi mat truy cap hoi thoai cua khach - chi luu o may khach. */
export const guestSession = {
  getToken: () => localStorage.getItem(GUEST_TOKEN_KEY),
  getConversationId: () => localStorage.getItem(GUEST_CONVERSATION_KEY),
  save: (token: string, conversationId: string) => {
    localStorage.setItem(GUEST_TOKEN_KEY, token);
    localStorage.setItem(GUEST_CONVERSATION_KEY, conversationId);
  },
  clear: () => {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    localStorage.removeItem(GUEST_CONVERSATION_KEY);
  },
};

const guestHeaders = () => {
  const token = guestSession.getToken();
  return token ? { 'X-Guest-Token': token } : undefined;
};

export const supportApi = {
  /** Khach vang lai: tao phien chat moi. Bat buoc co ten + lien he de CSKH goi lai duoc. */
  openGuestSession: async (guestName: string, guestContact: string, subject?: string): Promise<GuestSession> => {
    const res = await api.post('/support/guest-session', { guestName, guestContact, subject });
    guestSession.save(res.data.guestToken, res.data.conversation.id);
    return res.data;
  },

  /** Nguoi dung da dang nhap: lay lai hoi thoai dang mo hoac tao moi. */
  openConversation: async (subject?: string): Promise<SupportConversation> => {
    const res = await api.post('/support/conversations', { subject });
    return res.data;
  },

  /** Gan hoi thoai khach vao tai khoan sau khi ho dang nhap. */
  claim: async (guestToken: string): Promise<SupportConversation> => {
    const res = await api.post('/support/conversations/claim', { guestToken });
    return res.data;
  },

  getConversation: async (id: string): Promise<SupportConversation> => {
    const res = await api.get(`/support/conversations/${id}`, { headers: guestHeaders() });
    return res.data;
  },

  listMessages: async (id: string): Promise<SupportMessage[]> => {
    const res = await api.get(`/support/conversations/${id}/messages`, { headers: guestHeaders() });
    return res.data;
  },

  sendMessage: async (id: string, content: string, imageUrl?: string): Promise<SupportMessage> => {
    const res = await api.post(
      `/support/conversations/${id}/messages`,
      { content, imageUrl },
      { headers: guestHeaders() }
    );
    return res.data;
  },

  /** Tra ve URL anh da tai len, sau do gui kem trong mot tin nhan. */
  uploadAttachment: async (id: string, file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post(`/support/conversations/${id}/attachments`, form, {
      headers: { ...(guestHeaders() || {}), 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  },

  /**
   * Hop thu CSKH. Mac dinh backend bo qua hoi thoai chua co tin nhan nao
   * (duoc tao tu dong khi hoc vien mo widget) - bat includeEmpty de xem lai.
   */
  inbox: async (status?: SupportStatus, includeEmpty = false): Promise<SupportConversation[]> => {
    const res = await api.get('/support/inbox', {
      params: { ...(status ? { status } : {}), ...(includeEmpty ? { includeEmpty: true } : {}) },
    });
    return res.data;
  },

  /** So hoi thoai dang cho tra loi - dung cho huy hieu tren muc "Ho tro". */
  unreadCount: async (): Promise<number> => {
    const res = await api.get('/support/inbox/unread-count');
    return res.data;
  },

  assign: async (id: string): Promise<SupportConversation> => {
    const res = await api.post(`/support/conversations/${id}/assign`);
    return res.data;
  },

  close: async (id: string): Promise<SupportConversation> => {
    const res = await api.post(`/support/conversations/${id}/close`);
    return res.data;
  },

  sendTyping: async (id: string, isTyping: boolean): Promise<void> => {
    try {
      await api.post(`/support/conversations/${id}/typing`, { isTyping }, { headers: guestHeaders() });
    } catch {
      // ignore
    }
  },
};

export interface TypingEvent {
  conversationId: string;
  senderRole: SupportSenderRole;
  senderName: string;
  isTyping: boolean;
}

/** Kenh lien he ngoai - chi la deep link, tin nhan khong chay vao hop thu CSKH trong app. */
export const externalChannels = {
  messenger: import.meta.env.VITE_MESSENGER_URL as string | undefined,
  zalo: import.meta.env.VITE_ZALO_URL as string | undefined,
};
