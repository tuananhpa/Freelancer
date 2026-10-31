import React from 'react';

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <symbol id="i-search" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5" />
      </symbol>
      <symbol id="i-x" viewBox="0 0 24 24">
        <path d="M5 5l14 14M19 5 5 19" />
      </symbol>
      <symbol id="i-menu" viewBox="0 0 24 24">
        <path d="M3 7h18M3 12h18M3 17h12" />
      </symbol>
      <symbol id="i-down" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </symbol>
      <symbol id="i-plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="i-arrow" viewBox="0 0 24 24">
        <path d="M4 12h16M14 6l6 6-6 6" />
      </symbol>
      <symbol id="i-arrow-ur" viewBox="0 0 24 24">
        <path d="M7 17 17 7M8 7h9v9" />
      </symbol>
      <symbol id="i-phone" viewBox="0 0 24 24">
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
      </symbol>
      <symbol id="i-zalo" viewBox="0 0 24 24">
        <path d="M12 3.5c-5 0-9 3.4-9 7.6 0 2.4 1.3 4.5 3.3 5.9L5.5 20.5l4-2a10.6 10.6 0 0 0 2.5.3c5 0 9-3.4 9-7.6s-4-7.7-9-7.7Z" />
        <path d="M8 9h3.5L8 13.5h3.5M14 9v4.5" />
      </symbol>
      <symbol id="i-messenger" viewBox="0 0 24 24">
        <path d="M12 3C7 3 3 6.7 3 11.4c0 2.6 1.2 4.9 3.2 6.5V21l3-1.6c.9.2 1.8.4 2.8.4 5 0 9-3.7 9-8.4S17 3 12 3Z" />
        <path d="m7.5 13.5 3-3.2 2.3 2 3.7-2.6-3 3.2-2.3-2Z" />
      </symbol>
      <symbol id="i-chat" viewBox="0 0 24 24">
        <path d="M4 5h16v11H9l-5 4Z" />
        <path d="M8 10h8M8 13h5" />
      </symbol>
      <symbol id="i-filter" viewBox="0 0 24 24">
        <path d="M4 6h16M7 12h10M10 18h4" />
      </symbol>
      <symbol id="i-check" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.7 2.5L16 9.5" />
      </symbol>
      <symbol id="i-zoom" viewBox="0 0 24 24">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5M10.5 8v5M8 10.5h5" />
      </symbol>
      <symbol id="i-pin" viewBox="0 0 24 24">
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </symbol>
      <symbol id="i-mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" />
        <path d="m3 6 9 7 9-7" />
      </symbol>
      <symbol id="i-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </symbol>
      <symbol id="i-copy" viewBox="0 0 24 24">
        <rect x="8" y="8" width="12" height="12" />
        <path d="M16 8V4H4v12h4" />
      </symbol>
    </svg>
  );
}

export function Icon({ name, className = '' }) {
  return (
    <svg className={`icon${className ? ' ' + className : ''}`} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
