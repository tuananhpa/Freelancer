import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import { Brand } from "./common";
import { ChatWidget } from "./ChatWidget";
import { useLanguage } from "../app/providers";
import { useResource } from "../hooks/useResource";
import { repository } from "../services";
import { ThemeToggle } from "./ThemeToggle";
export function PublicLayout() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: contact } = useResource(() => repository.settings.get());
  const section = (id: string) =>
    location.pathname === "/" ? `#${id}` : `/#${id}`;
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Đến nội dung chính", "Skip to content")}
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            className={open ? "main-nav is-open" : "main-nav"}
            aria-label={t("Điều hướng chính", "Main navigation")}
          >
            <a onClick={() => setOpen(false)} href={section("cau-chuyen")}>
              {t("Câu chuyện quê", "Our story")}
            </a>
            <a onClick={() => setOpen(false)} href={section("dac-san")}>
              {t("Đặc sản Hưng Yên", "Local treasures")}
            </a>
            <a onClick={() => setOpen(false)} href={section("ho-chieu")}>
              {t("Hộ chiếu di sản", "Heritage passport")}
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="language-button"
              onClick={() => setLang(lang === "vi" ? "en" : "vi")}
              aria-label={t("Switch to English", "Chuyển sang tiếng Việt")}
            >
              <span className={lang === "vi" ? "active" : ""}>VI</span>
              <span className="language-divider">/</span>
              <span className={lang === "en" ? "active" : ""}>EN</span>
            </button>
            <ThemeToggle />
            <a
              className="button button-small header-contact"
              href={section("ket-noi")}
            >
              {t("Kết nối cùng HYTales", "Connect with HYTales")}
              <ArrowUpRight size={16} />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-expanded={open}
              aria-label={t("Mở menu", "Open menu")}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Brand light />
            <p>
              {t(
                "Một mã QR. Một câu chuyện. Một miền quê được gìn giữ.",
                "One QR. One story. A place to remember.",
              )}
            </p>
          </div>
          <div>
            <h3>{t("Khám phá", "Explore")}</h3>
            <a href="/#dac-san">{t("Những thức quà quê", "Local treasures")}</a>
            <a href="/#ho-chieu">
              {t("Hộ chiếu di sản số", "Digital heritage passport")}
            </a>
          </div>
          <div>
            <h3>{t("Cùng chúng tôi", "Join us")}</h3>
            <a href="/#ket-noi">
              {t("Dành cho nhà vườn & HTX", "For growers & cooperatives")}
            </a>
            <Link to="/admin/login">
              <LockKeyhole size={14} />
              {t("Không gian quản trị", "Admin workspace")}
            </Link>
            {contact?.email &&
              /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email) && (
                <a href={"mailto:" + encodeURIComponent(contact.email)}>
                  {contact.email}
                </a>
              )}
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © 2026 HYTales.{" "}
            {t(
              "Gìn giữ chuyện quê, nâng tầm nông sản.",
              "Preserve stories. Elevate local produce.",
            )}
          </span>
          <span>
            <MapPin size={14} />
            Hưng Yên, Việt Nam
          </span>
          <span>
            <ShieldCheck size={14} />
            {t("Trải nghiệm không cần tài khoản", "Explore without an account")}
          </span>
        </div>
      </footer>
      <ChatWidget key={location.pathname} />
    </>
  );
}
