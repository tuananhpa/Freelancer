/** Bộ icon nét (stroke) nội bộ — không phụ thuộc thư viện ngoài. */
const PATHS = {
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></>,
  play: <><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></>,
  playSolid: <path d="M7 4v16l13-8z" fill="currentColor" stroke="none" />,
  mute: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="m22 9-6 6M16 9l6 6" /></>,
  sound: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none" />,
  pin: <><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.3-4A8.4 8.4 0 1 1 21 11.5z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  send: <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  chart: <path d="M3 3v18h18M7 15l4-4 3 3 6-6" />,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></>,
  cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
};

export default function Icon({ name, size = 20, strokeWidth = 2, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
