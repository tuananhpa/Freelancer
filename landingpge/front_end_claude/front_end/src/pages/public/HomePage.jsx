import { productService } from '@/services/api';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import HomeHero from '@/components/home/HomeHero';
import ProductShowcase from '@/components/home/ProductShowcase';
import HowItWorks from '@/components/home/HowItWorks';
import HeritageQuote from '@/components/home/HeritageQuote';
import CompareTable from '@/components/home/CompareTable';
import PartnerSection from '@/components/home/PartnerSection';
import ChatWidget from '@/components/product/ChatWidget';

/** Trang chủ giới thiệu HYTale — khách vào xem tự do, không cần đăng nhập. */
export default function HomePage() {
  useDocumentTitle('Chạm mã QR – Mở câu chuyện quê');
  const { data: products, loading } = useAsync(() => productService.listPublished(), []);
  const featured = products?.find((p) => p.slug.startsWith('vai-trung')) || products?.[0];

  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero featured={featured} />
        <ProductShowcase products={products || []} loading={loading} />
        <HowItWorks />
        <HeritageQuote />
        <CompareTable />
        <PartnerSection />
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
