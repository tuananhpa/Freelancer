import { useEffect, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  MapPin,
  Menu,
  MonitorPlay,
  Phone,
  UserRound,
  Users,
  X,
  Facebook,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import SolarSystem from './SolarSystem';
import ActivitiesSection from '../activities/ActivitiesSection';
import {
  ABOUT_PILLARS,
  CAMPUSES,
  campusEmbedUrl,
  campusMapUrl,
  type Campus,
  EXAMS,
  FACULTY_POINTS,
  HERO,
  LEARNING_STEPS,
  NAV_LINKS,
  PHONES,
  SECTIONS,
  SOCIAL_LINKS,
  SUBJECTS,
  TRUST_STATS,
} from './landingContent';
import {
  TEAM_DIRECTORY,
  getInitials,
  isLeaderRole,
  rolePriority,
  roleText,
} from './teamDirectory';

type SectionHeadProps = {
  kicker: string;
  heading: string;
  body?: string;
  className?: string;
  headingClassName?: string;
  bodyClassName?: string;
};

const SectionHead = ({
  kicker,
  heading,
  body,
  className = '',
  headingClassName = 'max-w-2xl',
  bodyClassName = 'max-w-2xl',
}: SectionHeadProps) => (
  <div className={`landing-section-head ${className}`.trim()}>
    <p className="landing-kicker">{kicker}</p>
    <h2 className={`landing-heading mt-3 ${headingClassName}`.trim()}>{heading}</h2>
    {body ? <p className={`landing-body mt-5 ${bodyClassName}`.trim()}>{body}</p> : null}
  </div>
);

type NavAnchorProps = {
  href: string;
  label: string;
  active: boolean;
  className?: string;
  onNavigate?: (href: string) => void;
};

const NavAnchor = ({ href, label, active, className = '', onNavigate }: NavAnchorProps) => (
  <a
    href={href}
    className={`landing-nav-link${active ? ' landing-nav-link--active' : ''} ${className}`.trim()}
    onClick={(event) => {
      event.preventDefault();
      onNavigate?.(href);
    }}
  >
    {label}
  </a>
);

/**
 * lucide-react khong co icon TikTok nen ve tay.
 * Dung kieu net vien de dong bo voi cac icon lucide xung quanh (Facebook,
 * MapPin...) - do la ly do khong dung ban to dac.
 */
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M9.7 9.9v3.2a3.1 3.1 0 1 0 2.6 3.1V2.5h3.1a5.2 5.2 0 0 0 5.2 5.2v3.2a8.3 8.3 0 0 1-5.2-1.8v6.6a6.5 6.5 0 1 1-5.7-6.4Z" />
  </svg>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [navSolid, setNavSolid] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(NAV_LINKS[0].href.slice(1));
  const [hasActivities, setHasActivities] = useState(false);
  const [mapCampus, setMapCampus] = useState<Campus | null>(null);

  // Section Hoạt động tự ẩn khi chưa có bài nào được duyệt, nên phải bỏ luôn
  // mục menu tương ứng — nếu không sẽ còn một link trỏ tới section không tồn tại.
  const navLinks = hasActivities
    ? NAV_LINKS
    : NAV_LINKS.filter((link) => link.href !== '#hoat-dong');

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.href.slice(1));
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.25, 0.5] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // chạy lại khi section Hoạt động xuất hiện để observer bắt được nó
  }, [hasActivities]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const handleCTA = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const scrollToSection = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (!el) return;

    // Always scroll programmatically — native hash jumps fail when the
    // target is adjacent (e.g. Đội ngũ → Liên hệ) or the hash already matches.
    const navOffset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.history.replaceState(null, '', href);
    setActiveSection(id);
    closeMobileNav();
  };

  const renderAuthButtons = (layout: 'desktop' | 'mobile'): ReactNode => {
    if (layout === 'desktop') {
      return isAuthenticated ? (
        <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm" className="hidden sm:inline-flex">
          Dashboard
        </Button>
      ) : (
        <Button onClick={() => navigate('/login')} variant="primary" size="sm" className="inline-flex">
          ĐĂNG NHẬP
        </Button>
      );
    }

    return isAuthenticated ? (
      <Button
        onClick={() => {
          closeMobileNav();
          navigate('/dashboard');
        }}
        variant="primary"
        size="md"
        className="w-full"
      >
        Dashboard
      </Button>
    ) : (
      <Button
        onClick={() => {
          closeMobileNav();
          navigate('/login');
        }}
        variant="primary"
        size="md"
        className="w-full"
      >
        ĐĂNG NHẬP
      </Button>
    );
  };

  return (
    <div className="landing min-h-screen font-body overflow-x-clip">
      <Helmet>
        <title>ĐIỂM SÁNG - Hệ thống quản lý học tập và thi cử</title>
        <meta name="description" content="ĐIỂM SÁNG cung cấp chương trình giáo dục phổ thông và luyện thi chứng chỉ trên nền tảng học tập kết hợp trực tiếp và trực tuyến." />
        {/* Bạn có thể thay đổi và thêm các từ khóa tìm kiếm ở dòng bên dưới, cách nhau bởi dấu phẩy */}
        <meta name="keywords" content="Điểm Sáng center, trung tâm uranus, uranus developing, trung tâm tiếng anh uranus, luyện thi uranus, hệ thống quản lý học tập uranus, lms uranus, uranus education, hệ thống quản lý học tập, thi trực tuyến, luyện thi chứng chỉ, học trực tuyến, ĐIỂM SÁNG, học tập kết hợp" />
        <meta property="og:title" content="ĐIỂM SÁNG - Hệ thống quản lý học tập và thi cử" />
        <meta property="og:description" content="ĐIỂM SÁNG cung cấp chương trình giáo dục phổ thông và luyện thi chứng chỉ trên nền tảng học tập kết hợp trực tiếp và trực tuyến." />
        <meta property="og:type" content="website" />
      </Helmet>
      <nav
        className={`landing-nav fixed inset-x-0 top-0 z-50 ${navSolid || mobileNavOpen ? 'landing-nav--solid' : 'landing-nav--hero'}`}
        aria-label="Điều hướng chính"
      >
        <div className="landing-nav-bar relative h-16 w-full">
          <a
            href="/"
            className="landing-nav-logo absolute left-5 sm:left-8 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2.5"
            onClick={(event) => {
              event.preventDefault();
              closeMobileNav();
              window.location.reload();
            }}
          >
            <img src="/logo.svg" alt="" className="w-9 h-9 rounded-lg object-contain" />
            <span className="landing-logo-text">Điểm Sáng</span>
          </a>

          <div className="landing-nav-actions absolute right-3 sm:right-4 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1 sm:gap-2">
            <DarkModeToggle className="!px-2 sm:!px-3 landing-nav-toggle" />
            {renderAuthButtons('desktop')}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl landing-nav-toggle"
              aria-label={mobileNavOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="mx-auto flex h-full w-full max-w-6xl items-center px-5 sm:px-8">
            <div className="landing-nav-logo-gap shrink-0" aria-hidden="true" />
            <div className="hidden min-w-0 items-center gap-5 text-sm font-semibold lg:flex">
              {navLinks.map((link) => (
                <NavAnchor
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={activeSection === link.href.slice(1)}
                  onNavigate={scrollToSection}
                />
              ))}
            </div>
            {/* Reserve space so centered content tabs don't collide with absolute actions */}
            <div className="landing-nav-actions-gap ml-auto shrink-0" aria-hidden="true" />
          </div>
        </div>

        {mobileNavOpen && (
          <div className="lg:hidden border-t border-black/5 dark:border-white/10 bg-white/95 dark:bg-[rgb(18_14_16/0.98)] backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <NavAnchor
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  active={activeSection === link.href.slice(1)}
                  className="py-3 text-base font-semibold"
                  onNavigate={scrollToSection}
                />
              ))}
              <div className="pt-3 mt-1 border-t border-black/5 dark:border-white/10 flex flex-col gap-2">
                {renderAuthButtons('mobile')}
              </div>
            </div>
          </div>
        )}
      </nav>

      <header className="landing-hero relative min-h-[100svh] flex items-end sm:items-center">
        <div className="landing-hero-media" aria-hidden="true">
          <div className="landing-hero-space" />
          <SolarSystem />
          <div className="landing-hero-overlay" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-16 sm:py-28">
          <div className="landing-hero-copy max-w-xl">
            <p className="landing-brand landing-reveal">{HERO.eyebrow}</p>
            <h1 className="landing-title landing-reveal landing-reveal-d1 mt-4 sm:mt-5">{HERO.title}</h1>
            <p className="landing-lede landing-reveal landing-reveal-d2 mt-4">{HERO.lede}</p>
            <div className="landing-reveal landing-reveal-d3 mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleCTA}
                variant="primary"
                size="lg"
                iconRight={<ArrowRight className="w-5 h-5" />}
                className="landing-cta w-full sm:w-auto"
              >
                {isAuthenticated ? 'Vào Học Ngay' : 'Bắt Đầu Học'}
              </Button>
              <a
                href="#ve-chung-toi"
                className="landing-cta-link w-full sm:w-auto"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection('#ve-chung-toi');
                }}
              >
                Tìm Hiểu Thêm
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="landing-trust" aria-label="Thông tin nổi bật">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="landing-trust-frame">
            <dl className="landing-trust-grid">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section id="ve-chung-toi" className="landing-block scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <SectionHead
            kicker={SECTIONS.about.kicker}
            heading={SECTIONS.about.heading}
            body={SECTIONS.about.body}
            headingClassName="landing-heading--single-line"
            bodyClassName="landing-body--full"
          />
          <ul className="landing-pillars mt-12 sm:mt-14">
            {ABOUT_PILLARS.map((pillar) => (
              <li key={pillar.title} className="landing-pillar">
                <div className="landing-pillar-icon" aria-hidden="true">
                  <pillar.icon className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="landing-subhead">{pillar.title}</h3>
                  <p className="landing-body mt-2">{pillar.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="chuong-trinh" className="landing-block landing-block--tint scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <SectionHead
            kicker={SECTIONS.programs.kicker}
            heading={SECTIONS.programs.heading}
            body={SECTIONS.programs.body}
            headingClassName="landing-heading--full"
            bodyClassName="landing-body--full"
          />

          <div className="mt-12 landing-program-grid">
            <article className="landing-program-card">
              <header className="landing-program-head">
                <div className="landing-program-badge" aria-hidden="true">
                  <BookOpen className="w-6 h-6" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="landing-subhead">Chương Trình Phổ Thông</h3>
                    <span className="landing-program-count">6 môn</span>
                  </div>
                  <p className="landing-program-desc">Kiến thức nền tảng lớp 1–12</p>
                </div>
              </header>
              <ul className="landing-program-chips" aria-label="Môn học phổ thông">
                {SUBJECTS.map((subject) => (
                  <li key={subject.name}>
                    <div className="landing-program-chip">
                      <span className="landing-program-chip-icon" aria-hidden="true">
                        <subject.icon className="w-4 h-4" strokeWidth={2.25} />
                      </span>
                      <span className="landing-program-chip-label">{subject.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="landing-program-card">
              <header className="landing-program-head">
                <div className="landing-program-badge landing-program-badge--exam" aria-hidden="true">
                  <GraduationCap className="w-6 h-6" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="landing-subhead">Luyện Thi Chứng Chỉ</h3>
                    <span className="landing-program-count">4 chương trình</span>
                  </div>
                  <p className="landing-program-desc">Luyện thi đại học và chinh phục chứng chỉ tiếng Anh</p>
                </div>
              </header>
              <ul className="landing-program-exams" aria-label="Chương trình luyện thi">
                {EXAMS.map((exam) => (
                  <li key={exam.name}>
                    <div className="landing-program-exam">
                      <span className="landing-program-exam-icon" aria-hidden="true">
                        <exam.icon className="w-4 h-4" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0">
                        <p className="landing-program-exam-name">{exam.name}</p>
                      </div>
                      <span className="landing-program-exam-badge">{exam.short}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="lo-trinh" className="landing-block scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <SectionHead
            kicker={SECTIONS.path.kicker}
            heading={SECTIONS.path.heading}
            body={SECTIONS.path.body}
            headingClassName="landing-heading--full"
            bodyClassName="landing-body--full"
          />

          <ol className="landing-steps mt-12 sm:mt-14">
            {LEARNING_STEPS.map((step, index) => (
              <li key={step.title} className="landing-step">
                <span className="landing-step-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="landing-step-icon" aria-hidden="true">
                  <step.icon className="w-5 h-5" strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="landing-subhead">{step.title}</h3>
                  <p className="landing-body mt-2">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="doi-ngu" className="landing-block landing-block--tint scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <SectionHead
            kicker={SECTIONS.faculty.kicker}
            heading={SECTIONS.faculty.heading}
            body={SECTIONS.faculty.body}
            headingClassName="landing-heading--full"
            bodyClassName="landing-body--full"
          />

          <ul className="landing-faculty-grid mt-12 sm:mt-14">
            {FACULTY_POINTS.map((point, index) => (
              <li key={point.title} className="landing-faculty-card">
                <div className="landing-faculty-card-top">
                  <span className="landing-faculty-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="landing-faculty-icon" aria-hidden="true">
                    <point.icon className="w-5 h-5" strokeWidth={2.25} />
                  </div>
                </div>
                <h3 className="landing-subhead mt-4">{point.title}</h3>
                <p className="landing-body mt-2">{point.body}</p>
              </li>
            ))}
          </ul>

          <div className="landing-team-intro mt-16 sm:mt-20">
            <h3 className="landing-subhead">Đội ngũ theo từng team chuyên môn</h3>
            <p className="landing-body mt-3">
              Mỗi team có leader phụ trách chất lượng chuyên môn, giáo viên triển khai nội dung và
              trợ giảng đồng hành luyện tập cùng học viên.
            </p>
          </div>

          <div className="landing-team-grid mt-8">
            {TEAM_DIRECTORY.map((team) => {
              const leaderCount = team.members.filter(
                (m) => m.role === 'LEADER' || m.role === 'LEADER TRỢ GIẢNG',
              ).length;
              const teacherCount = team.members.filter((m) => m.role === 'GIÁO VIÊN').length;
              const assistantCount = team.members.filter((m) => m.role === 'TRỢ GIẢNG').length;
              const officeCount = team.members.filter(
                (m) => m.role === 'NHÂN VIÊN VĂN PHÒNG',
              ).length;

              return (
                <article key={team.team} className="landing-team-card">
                  <header className="landing-team-head">
                    <div className="landing-team-icon-wrap" aria-hidden="true">
                      <team.icon className="landing-team-icon" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="landing-subhead">{team.team}</h3>
                      <p className="landing-team-subtitle">{team.subtitle}</p>
                    </div>
                    <span className="landing-team-size">{team.members.length} thành viên</span>
                  </header>

                  <div className="landing-team-stats">
                    {leaderCount > 0 && (
                      <span>
                        <BadgeCheck className="w-4 h-4" />
                        {leaderCount} leader
                      </span>
                    )}
                    {teacherCount > 0 && (
                      <span>
                        <Users className="w-4 h-4" />
                        {teacherCount} giáo viên
                      </span>
                    )}
                    {assistantCount > 0 && (
                      <span>
                        <MonitorPlay className="w-4 h-4" />
                        {assistantCount} trợ giảng
                      </span>
                    )}
                    {officeCount > 0 && (
                      <span>
                        <BriefcaseBusiness className="w-4 h-4" />
                        {officeCount} văn phòng
                      </span>
                    )}
                  </div>

                  <ul className="landing-team-members" aria-label={`Danh sách ${team.team}`}>
                    {[...team.members]
                      .sort((a, b) => {
                        const rank = rolePriority[a.role] - rolePriority[b.role];
                        if (rank !== 0) return rank;
                        return a.name.localeCompare(b.name, 'vi');
                      })
                      .map((member) => (
                        <li
                          key={`${team.team}-${member.name}-${member.email ?? 'no-email'}`}
                          className={
                            isLeaderRole(member.role) ? 'landing-team-member--leader' : undefined
                          }
                        >
                          <div className="landing-member-avatar" aria-hidden="true">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt="" />
                            ) : (
                              <span>
                                {getInitials(member.name) || <UserRound className="w-3.5 h-3.5" />}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="landing-member-name">{member.name}</p>
                            <div className="landing-member-meta">
                              <span
                                className={`landing-member-role ${
                                  isLeaderRole(member.role) ? 'landing-member-role--leader' : ''
                                }`}
                              >
                                {roleText[member.role]}
                              </span>
                              {member.email && (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="landing-member-email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>{member.email}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <ActivitiesSection onLoaded={setHasActivities} />

      <section id="lien-he" className="landing-block scroll-mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <SectionHead
            kicker={SECTIONS.contact.kicker}
            heading={SECTIONS.contact.heading}
            body={SECTIONS.contact.body}
            headingClassName="landing-heading--full"
            bodyClassName="landing-body--full"
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div>
              <h3 className="landing-subhead">Địa Chỉ Cơ Sở</h3>
              <ul className="landing-contact-list mt-5">
                {CAMPUSES.map((campus) => (
                  <li key={campus.code}>
                    <MapPin className="landing-contact-icon" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="landing-contact-label">{campus.code}</p>
                      <button
                        type="button"
                        onClick={() => setMapCampus(campus)}
                        aria-label={`Xem bản đồ ${campus.code}: ${campus.address}`}
                        className="landing-contact-value landing-contact-value--address landing-contact-address"
                      >
                        {campus.address}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="landing-subhead">Hotline</h3>
              <ul className="landing-contact-list mt-5">
                {PHONES.map((phone) => (
                  <li key={phone.number}>
                    <Phone className="landing-contact-icon" aria-hidden="true" />
                    <div>
                      <p className="landing-contact-label">{phone.label}</p>
                      <a href={phone.href} className="landing-contact-value landing-contact-phone">
                        {phone.number}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta-band" aria-label="Kêu gọi hành động">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-24">
          <div className="landing-cta-panel">
            <div className="min-w-0 flex-1">
              <p className="landing-logo-text landing-logo-text--accent text-sm">{SECTIONS.cta.kicker}</p>
              <h2 className="landing-heading landing-heading--cta mt-3">{SECTIONS.cta.heading}</h2>
              <p className="landing-body mt-4 max-w-xl">{SECTIONS.cta.body}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button
                onClick={handleCTA}
                variant="primary"
                size="lg"
                iconRight={<ArrowRight className="w-5 h-5" />}
                className="landing-cta"
              >
                {isAuthenticated ? 'Vào phòng học' : 'Đăng Nhập'}
              </Button>
              <a href={PHONES[1].href} className="landing-cta-link">
                Gọi {PHONES[1].number}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
          <div className="landing-footer-grid">
            <div>
              <span className="landing-logo-text text-sm">Điểm Sáng</span>
              <p className="mt-3 max-w-xs leading-relaxed">
                Thành lập từ năm 2015, Điểm Sáng cung cấp chương trình giáo dục phổ thông và luyện thi trên nền tảng học tập kết hợp trực tiếp và trực tuyến.
              </p>

              {/* Chi hien kenh da co link, kenh chua co tu an */}
              {SOCIAL_LINKS.some((social) => social.url) && (
                <div className="landing-social">
                  {SOCIAL_LINKS.filter((social) => social.url).map((social) => (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      title={social.label}
                    >
                      {social.key === 'facebook' ? (
                        <Facebook size={18} aria-hidden="true" />
                      ) : (
                        <TikTokIcon className="w-[18px] h-[18px]" />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="landing-footer-heading">Khám phá</p>
              <ul className="landing-footer-links">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(event) => {
                        event.preventDefault();
                        scrollToSection(link.href);
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="landing-footer-heading">Liên hệ</p>
              <ul className="landing-footer-links">
                {PHONES.map((phone) => (
                  <li key={phone.number}>
                    <a href={phone.href}>{phone.number}</a>
                  </li>
                ))}
                {CAMPUSES.map((campus) => (
                  <li key={campus.code}>
                    <button
                      type="button"
                      onClick={() => setMapCampus(campus)}
                      aria-label={`Xem bản đồ ${campus.code}: ${campus.address}`}
                      className="landing-footer-address"
                    >
                      {campus.code}: {campus.address}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="landing-footer-copy">© {new Date().getFullYear()} Điểm Sáng Education. All rights reserved.</p>
        </div>
      </footer>

      <Modal
        isOpen={mapCampus !== null}
        onClose={() => setMapCampus(null)}
        title={mapCampus ? `Bản đồ — ${mapCampus.code}` : ''}
        maxWidth="3xl"
        footer={
          mapCampus && (
            <a
              href={campusMapUrl(mapCampus)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-camDam hover:underline dark:text-cam"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Mở trong Google Maps để chỉ đường
            </a>
          )
        }
      >
        {mapCampus && (
          <>
            <p className="mb-4 text-sm font-semibold text-vutruNhat">{mapCampus.address}</p>
            <iframe
              key={mapCampus.code}
              title={`Bản đồ ${mapCampus.code}`}
              src={campusEmbedUrl(mapCampus)}
              className="w-full h-[55vh] max-h-[460px] rounded-2xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default LandingPage;
