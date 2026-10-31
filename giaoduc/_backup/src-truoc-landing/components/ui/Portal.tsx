import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Dua overlay/modal ra thang document.body. Modal render long trong trang se bi
 * lech hoac nam duoi thanh tieu de neu co phan tu cha co transform (card hover
 * noi len, animation) hoac tao stacking context rieng - lop mo khong phu het.
 */
const Portal = ({ children }: { children: ReactNode }) => {
  if (typeof document === 'undefined') return <>{children}</>;
  return createPortal(children, document.body);
};

export default Portal;
