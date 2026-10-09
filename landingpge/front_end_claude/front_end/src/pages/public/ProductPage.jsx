import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { productService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Loading, ErrorState } from '@/components/common/StateView';
import Icon from '@/components/common/Icon';
import HeroBlock from '@/components/product/HeroBlock';
import StoryBlock from '@/components/product/StoryBlock';
import JourneyTimeline from '@/components/product/JourneyTimeline';
import ShortVideoCarousel from '@/components/product/ShortVideoCarousel';
import CtaBlock from '@/components/product/CtaBlock';
import OrderSheet from '@/components/product/OrderSheet';
import ReviewSection from '@/components/product/ReviewSection';
import ChatWidget from '@/components/product/ChatWidget';
import VideoPlayerSheet from '@/components/product/VideoPlayerSheet';

/** Trang Landing Page của 1 sản phẩm / lô hàng — đích đến khi khách quét QR. */
export default function ProductPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { data: product, loading, error, reload } = useAsync(() => productService.getBySlug(slug), [slug]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [video, setVideo] = useState(null);
  useDocumentTitle(product?.name);

  useEffect(() => {
    // Lượt truy cập từ /q/:code đã được ghi ở bước resolve; còn lại ghi là "direct"
    if (product && params.get('src') !== 'qr') productService.trackView(slug, 'direct').catch(() => {});
  }, [product, slug, params]);

  return (
    <div className="pp-shell">
      <div className="pp">
        <header className="site-header">
          <div className="site-header__inner" style={{ paddingInline: 12 }}>
            <Link to="/" className="brand" aria-label="Về trang chủ HYTale"><span className="brand__mark" aria-hidden="true">H</span></Link>
            <div className="secure-bar">
              <Icon name="lock" size={14} strokeWidth={2.4} className="secure-icon" />
              <span className="secure-bar__url">hytales.vn/p/{slug}</span>
            </div>
          </div>
        </header>

        {loading && <Loading label="Đang mở câu chuyện…" />}
        {error && <ErrorState error={error} onRetry={error.status === 404 ? undefined : reload} />}
        {product && (
          <>
            <HeroBlock product={product} onWatchFilm={() => setVideo({ title: product.name, videoUrl: product.hero.videoUrl, posterUrl: product.hero.posterUrl })} />
            <StoryBlock story={product.story} />
            <JourneyTimeline steps={product.timeline} />
            <ShortVideoCarousel videos={product.shortVideos} onPlay={setVideo} />
            <CtaBlock product={product} onOrder={() => setOrderOpen(true)} />
            <ReviewSection slug={product.slug} />
            <OrderSheet open={orderOpen} onClose={() => setOrderOpen(false)} product={product} />
            <VideoPlayerSheet video={video} onClose={() => setVideo(null)} />
            <ChatWidget productSlug={product.slug} faqs={product.faqs} />
          </>
        )}
      </div>
    </div>
  );
}
