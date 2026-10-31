import { Client, IMessage } from '@stomp/stompjs';

export const wsUrl =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8080/ws`;

interface StompAuth {
  /** JWT cua nguoi dung da dang nhap. */
  token?: string | null;
  /** Token cua khach vang lai, dung khi chua dang nhap. */
  guestToken?: string | null;
}

/**
 * Tao STOMP client da gan danh tinh.
 *
 * Server chi cho subscribe khi CONNECT co danh tinh hop le, nen phai gui
 * Authorization (hoac X-Guest-Token) ngay o buoc bat tay.
 */
export function createStompClient(
  auth: StompAuth,
  subscriptions: Array<{ destination: string; handler: (message: IMessage) => void }>
): Client | null {
  if (import.meta.env.VITE_DEMO === 'true') return null; // bản demo không có máy chủ WebSocket
  const connectHeaders: Record<string, string> = {};
  if (auth.token) {
    connectHeaders.Authorization = `Bearer ${auth.token}`;
  } else if (auth.guestToken) {
    connectHeaders['X-Guest-Token'] = auth.guestToken;
  } else {
    return null; // khong co danh tinh thi khong ket noi
  }

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders,
    reconnectDelay: 5000,
    onConnect: () => {
      subscriptions.forEach(({ destination, handler }) => client.subscribe(destination, handler));
    },
  });

  client.activate();
  return client;
}
