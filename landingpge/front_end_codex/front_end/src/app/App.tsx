import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider, NoticeProvider } from "./providers";
import { AuthProvider, ProtectedAdmin } from "./auth";
import { PublicLayout } from "../components/Layout";
import { Loading, NotFound } from "../components/common";
import { ThemeProvider, SiteSettingsProvider } from "./appearance";
const Home = lazy(() => import("../pages/HomePage"));
const Product = lazy(() => import("../pages/ProductPage"));
const QrLanding = lazy(() => import("../pages/QrLandingPage"));
const Login = lazy(() => import("../pages/admin/LoginPage"));
const Admin = lazy(() => import("../pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("../pages/admin/DashboardPage"));
const Products = lazy(() => import("../pages/admin/ProductsPage"));
const QR = lazy(() => import("../pages/admin/QrPage"));
const Inbox = lazy(() => import("../pages/admin/InboxPage"));
const Settings = lazy(() => import("../pages/admin/SettingsPage"));
const QuickReplies = lazy(() => import("../pages/admin/QuickRepliesPage"));
function ScrollManager() {
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
    else {
      const id = decodeURIComponent(location.hash.slice(1));
      const timeout = setTimeout(
        () => document.getElementById(id)?.scrollIntoView(),
        300,
      );
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, location.hash]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ThemeProvider>
          <SiteSettingsProvider>
            <NoticeProvider>
              <AuthProvider>
                <ScrollManager />
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route element={<PublicLayout />}>
                      <Route index element={<Home />} />
                      <Route path="/p/:slug" element={<Product />} />
                      <Route path="/q/:id" element={<QrLanding />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route path="/admin/login" element={<Login />} />
                    <Route element={<ProtectedAdmin />}>
                      <Route path="/admin" element={<Admin />}>
                        <Route index element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="qr" element={<QR />} />
                        <Route path="inbox" element={<Inbox />} />
                        <Route path="settings" element={<Settings />} />
                        <Route
                          path="quick-replies"
                          element={<QuickReplies />}
                        />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Route>
                  </Routes>
                </Suspense>
              </AuthProvider>
            </NoticeProvider>
          </SiteSettingsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
