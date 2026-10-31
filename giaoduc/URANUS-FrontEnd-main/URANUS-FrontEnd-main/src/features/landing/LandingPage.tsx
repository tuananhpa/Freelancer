import { useEffect, useRef, type MouseEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ActivitiesSection from '../activities/ActivitiesSection';
// Nội dung tĩnh của landing (đồng bộ với mockup đã duyệt); hành vi gắn ở dưới
import landingHtml from './landing.html?raw';
import './landing.css';

const CTA_MARK = '<section class="cta">';
const [topHtml, bottomHtml] = [landingHtml.slice(0, landingHtml.indexOf(CTA_MARK)), landingHtml.slice(landingHtml.indexOf(CTA_MARK))];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { colorTheme, setColorTheme, toggleTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);

  // Nút chọn bảng màu phản ánh bảng màu hiện tại
  useEffect(() => {
    rootRef.current?.querySelectorAll<HTMLElement>('[data-pal]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pal === colorTheme)));
  }, [colorTheme]);

  // Các bước "Cách hoạt động": bước nào ở giữa màn hình thì sáng lên cùng hình minh họa
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const steps = [...root.querySelectorAll<HTMLElement>('.step')];
    const visuals = [...root.querySelectorAll<HTMLElement>('.sv')];
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const i = Number((en.target as HTMLElement).dataset.step);
      steps.forEach((s, j) => s.classList.toggle('on', j === i));
      visuals.forEach((s, j) => s.classList.toggle('on', j === i));
    }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const pal = t.closest<HTMLElement>('[data-pal]');
    if (pal) return setColorTheme(pal.dataset.pal as 'ink' | 'chalk');
    if (t.closest('[data-dark]')) return toggleTheme();
    if (t.closest('[data-go]')) {
      e.preventDefault();
      navigate(isAuthenticated ? '/dashboard' : '/login');
    }
  };

  return (
    <>
      <Helmet>
        <title>Điểm Sáng – Lớp học và chấm điểm thông minh</title>
        <meta name="description" content="Tạo bài kiểm tra 15 phút, 1 tiết; chấm trắc nghiệm tự động, AI gợi ý điểm tự luận theo đáp án giáo viên; tổng hợp điểm học kì và xuất Excel." />
        <meta property="og:title" content="Điểm Sáng – Lớp học và chấm điểm thông minh" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="lp" ref={rootRef} onClick={onClick}>
        <div dangerouslySetInnerHTML={{ __html: topHtml }} />
        <div className="wrap">
          <ActivitiesSection />
        </div>
        <div dangerouslySetInnerHTML={{ __html: bottomHtml }} />
      </div>
    </>
  );
}
