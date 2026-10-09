import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Loading } from '@/components/common/StateView';
import PublicLayout from '@/components/layout/PublicLayout';
import RequireAdmin from './RequireAdmin';
import HomePage from '@/pages/public/HomePage';
import ProductPage from '@/pages/public/ProductPage';
import QrRedirectPage from '@/pages/public/QrRedirectPage';
import NotFoundPage from '@/pages/public/NotFoundPage';

// Khu vực admin tải riêng (code-splitting) để trang khách quét QR nhẹ nhất có thể
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout'));
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ProductListPage = lazy(() => import('@/pages/admin/ProductListPage'));
const ProductEditorPage = lazy(() => import('@/pages/admin/ProductEditorPage'));
const QrStudioPage = lazy(() => import('@/pages/admin/QrStudioPage'));
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
const InboxPage = lazy(() => import('@/pages/admin/InboxPage'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const ReviewsPage = lazy(() => import('@/pages/admin/ReviewsPage'));
const LeadsPage = lazy(() => import('@/pages/admin/LeadsPage'));

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* ===== Luồng NGƯỜI DÙNG: không cần đăng nhập ===== */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="p/:slug" element={<ProductPage />} />
          <Route path="q/:code" element={<QrRedirectPage />} />
        </Route>

        {/* ===== Luồng ADMIN: bắt buộc đăng nhập ===== */}
        <Route path="admin/login" element={<LoginPage />} />
        <Route path="admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/new" element={<ProductEditorPage />} />
            <Route path="products/:id" element={<ProductEditorPage />} />
            <Route path="qr" element={<QrStudioPage />} />
            <Route path="qr/:id" element={<QrStudioPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="leads" element={<LeadsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
