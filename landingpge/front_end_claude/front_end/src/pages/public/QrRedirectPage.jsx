import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { productService } from '@/services/api';
import { Loading, ErrorState } from '@/components/common/StateView';

/**
 * /q/:code — đường dẫn ngắn in trên tem QR (Dynamic QR).
 * Hỏi backend mã này đang trỏ tới sản phẩm nào, ghi nhận lượt quét, rồi chuyển hướng.
 * Đổi nội dung/đích trong CMS mà không phải in lại tem.
 */
export default function QrRedirectPage() {
  const { code } = useParams();
  const [state, setState] = useState({ slug: null, error: null });

  useEffect(() => {
    productService.resolveQr(code)
      .then((r) => setState({ slug: r.slug, error: null }))
      .catch((error) => setState({ slug: null, error }));
  }, [code]);

  if (state.slug) return <Navigate to={`/p/${state.slug}?src=qr`} replace />;
  if (state.error) return <ErrorState error={state.error} />;
  return <Loading label="Đang mở câu chuyện quê…" />;
}
