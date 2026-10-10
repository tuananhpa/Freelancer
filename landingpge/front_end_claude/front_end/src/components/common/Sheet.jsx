import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

/** Bottom sheet trên mobile, modal giữa màn hình trên desktop. */
export default function Sheet({ open, onClose, title, children, variant }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${variant ? `sheet--${variant}` : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        {variant === 'video' ? (
          <button type="button" className="icon-btn video-close" onClick={onClose} aria-label="Đóng">
            <Icon name="x" />
          </button>
        ) : (
          <div className="sheet__head">
            <h2>{title}</h2>
            <button type="button" className="icon-btn sheet__close" onClick={onClose} aria-label="Đóng">
              <Icon name="x" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
