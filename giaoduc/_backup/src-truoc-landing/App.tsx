import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingOverlay from './components/ui/LoadingOverlay';


// Lazy loaded feature components
const Login = lazy(() => import('./features/auth/Login'));
const Register = lazy(() => import('./features/auth/Register'));
const VerifyEmail = lazy(() => import('./features/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('./features/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./features/auth/ResetPassword'));
const RoleSelection = lazy(() => import('./features/auth/RoleSelection'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const ExamList = lazy(() => import('./features/exam/ExamList'));
const CreateExam = lazy(() => import('./features/exam/CreateExam'));
const ExamTake = lazy(() => import('./features/exams/ExamTake'));
const ExamProctoring = lazy(() => import('./features/exams/ExamProctoring'));
const ExamResult = lazy(() => import('./features/exams/ExamResult'));
const ExamAnalytics = lazy(() => import('./features/exams/ExamAnalytics'));
const ExamHistory = lazy(() => import('./features/profile/ExamHistory'));
const ProfileLayout = lazy(() => import('./features/profile/ProfileLayout'));
const ProfileEdit = lazy(() => import('./features/profile/ProfileEdit'));
const ProfileAppearance = lazy(() => import('./features/profile/ProfileAppearance'));
const ProfileSecurity = lazy(() => import('./features/profile/ProfileSecurity'));
const FlashcardList = lazy(() => import('./features/flashcards/FlashcardList'));
const CreateFlashcard = lazy(() => import('./features/flashcards/CreateFlashcard'));
const FlashcardStatistics = lazy(() => import('./features/flashcards/FlashcardStatistics'));
const LibraryPage = lazy(() => import('./features/library/LibraryPage'));
const FolderDetailPage = lazy(() => import('./features/library/FolderDetailPage'));
const ResourceDetailPage = lazy(() => import('./features/library/ResourceDetailPage'));
const VocabStudy = lazy(() => import('./features/vocabulary/VocabStudy'));
const VocabList = lazy(() => import('./features/vocabulary/VocabList'));
const CreateVocab = lazy(() => import('./features/vocabulary/CreateVocab'));
const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const CourseList = lazy(() => import('./features/courses/CourseList'));
const LecturePage = lazy(() => import('./features/courses/LecturePage'));
const CourseDetail = lazy(() => import('./features/courses/CourseDetail'));
const CourseViewer = lazy(() => import('./features/courses/CourseViewer'));
const CourseEditor = lazy(() => import('./features/courses/CourseEditor'));
const UserManagement = lazy(() => import('./features/admin/UserManagement'));
const AssignmentList = lazy(() => import('./features/assignments/AssignmentList'));
const AssignmentTake = lazy(() => import('./features/assignments/AssignmentTake'));
const AssignmentGrade = lazy(() => import('./features/assignments/AssignmentGrade'));
const AssignmentCreate = lazy(() => import('./features/assignments/AssignmentCreate'));
const ClassDashboard = lazy(() => import('./features/classroom/ClassDashboard'));
const ClassDetailLayout = lazy(() => import('./features/classroom/ClassDetailLayout'));
const ClassStream = lazy(() => import('./features/classroom/ClassStream'));
const ClassworkList = lazy(() => import('./features/classroom/ClassworkList'));
const ClassAssignmentCreate = lazy(() => import('./features/classroom/ClassAssignmentCreate'));
const ClassPeople = lazy(() => import('./features/classroom/ClassPeople'));
const ClassGradebook = lazy(() => import('./features/classroom/ClassGradebook'));
const ClassAttendance = lazy(() => import('./features/classroom/ClassAttendance'));
const ClassLeaderboard = lazy(() => import('./features/classroom/ClassLeaderboard'));
const ClassCourses = lazy(() => import('./features/classroom/ClassCourses'));
const NotificationPage = lazy(() => import('./features/notifications/NotificationPage'));
const ProgressReportPage = lazy(() => import('./features/progress/ProgressReportPage'));
const LearningPathPage = lazy(() => import('./features/learning-path/LearningPathPage'));
const ShareResolvePage = lazy(() => import('./features/share/ShareResolvePage'));
const AuditLogs = lazy(() => import('./features/admin/AuditLogs'));
const StudentImport = lazy(() => import('./features/admin/StudentImport'));
const ActivityManagement = lazy(() => import('./features/activities/ActivityManagement'));
const ActivityDetailPage = lazy(() => import('./features/activities/ActivityDetailPage'));
const SupportInbox = lazy(() => import('./features/support/SupportInbox'));
import SupportWidget from './features/support/SupportWidget';
import Portal from './components/ui/Portal';
const CourseDiscussions = lazy(() => import('./features/courses/CourseDiscussions'));
const DiscussionDetail = lazy(() => import('./features/courses/DiscussionDetail'));
const CalendarPage = lazy(() => import('./features/calendar/CalendarPage'));
const CertificateViewer = lazy(() => import('./features/certificates/CertificateViewer'));
const ProfileCertificates = lazy(() => import('./features/profile/ProfileCertificates'));
const MistakeVaultPage = lazy(() => import('./features/mistake-vault/MistakeVaultPage'));

const FlashcardDetail = lazy(() => import('./features/flashcards/FlashcardDetail'));
const FlashcardStudyMode = lazy(() => import('./features/flashcards/FlashcardStudyMode'));
const FlashcardLearnMode = lazy(() => import('./features/flashcards/FlashcardLearnMode'));
const FlashcardTestMode = lazy(() => import('./features/flashcards/FlashcardTestMode'));
const FlashcardMatchGame = lazy(() => import('./features/flashcards/FlashcardMatchGame'));

const GOOGLE_CLIENT_ID = "268507710666-pgd45otcd8dh4sliu6eu7is4vbmabkjb.apps.googleusercontent.com";

// Bảo vệ route: chưa đăng nhập → /login
// Đã đăng nhập nhưng chưa chọn role → /role-selection
// Đã đăng nhập, đã có role nhưng không đúng quyền → /dashboard
const PrivateRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) => {
  const { isAuthenticated, isUnassigned, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (isUnassigned) return <Navigate to="/role-selection" replace />;
  if (roles && user) {
    const effectiveRoles = roles.flatMap(r => r === 'TEACHER' ? ['TEACHER', 'TEACHING_ASSISTANT'] : [r]);
    if (!effectiveRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route yêu cầu đăng nhập bằng popup (thay vì chuyển hướng trực tiếp)
const AuthRequiredModalRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isUnassigned } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isAuthenticated && isUnassigned) return <Navigate to="/role-selection" replace />;

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-kem/20 dark:bg-night-page/20">
        <div className="pointer-events-none select-none blur-[4px] opacity-80 h-screen overflow-hidden">
          {children}
        </div>
        <Portal><div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-night-surface rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-fade-in border border-gray-100 dark:border-night-border">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-cam rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-vutru mb-2">Yêu cầu đăng nhập</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
              Bạn cần đăng nhập hoặc tạo tài khoản để có thể làm bài thi này.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/login', { state: { from: location } })}
                className="w-full py-3 bg-cam text-white font-bold rounded-xl hover:bg-camDam transition-all shadow-lg shadow-cam/20 hover:shadow-cam/40 hover:-translate-y-0.5"
              >
                Đăng nhập ngay
              </button>
              <button
                onClick={() => navigate('/register', { state: { from: location } })}
                className="w-full py-3 bg-gray-100 dark:bg-night-elevated text-vutru font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/5 transition-colors"
              >
                Tạo tài khoản mới
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2 font-medium"
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div></Portal>
      </div>
    );
  }

  return <>{children}</>;
};

// Route chỉ hiển thị khi chưa đăng nhập
const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isUnassigned } = useAuth();
  if (isAuthenticated && !isUnassigned) return <Navigate to="/dashboard" replace />;
  if (isAuthenticated && isUnassigned) return <Navigate to="/role-selection" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Suspense fallback={<LoadingOverlay text="Đang tải..." />}>
          <Routes>
          {/* Root path displays Landing Page for guests, and redirects to Dashboard for logged-in users */}
          <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />

          {/* Public routes (chỉ khi chưa đăng nhập) */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
          <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
          <Route path="/verify-certificate/:code" element={<CertificateViewer />} />
          <Route path="/hoat-dong/:slug" element={<ActivityDetailPage />} />

          {/* Role Selection — chỉ dành cho người đã đăng nhập nhưng chưa chọn role */}
          <Route path="/role-selection" element={<RoleSelectionGuard />} />

          {/* Protected routes — bọc trong Layout */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="/notifications" element={
            <PrivateRoute>
              <Layout><NotificationPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/calendar" element={
            <PrivateRoute>
              <Layout><CalendarPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/progress" element={
            <PrivateRoute>
              <Layout><ProgressReportPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/learning-path" element={
            <PrivateRoute>
              <Layout><LearningPathPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/mistake-vault" element={
            <PrivateRoute roles={['STUDENT']}>
              <Layout><MistakeVaultPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/share/:token" element={
            <PrivateRoute>
              <Layout><ShareResolvePage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/lectures" element={<Navigate to="/dashboard" replace />} />

          <Route path="/courses" element={
            <PrivateRoute>
              <Layout><CourseList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/create" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CourseEditor /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:id/edit" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CourseEditor /></Layout>
            </PrivateRoute>
          } />

          <Route path="/support/inbox" element={
            <PrivateRoute roles={['OFFICE', 'ADMIN']}>
              <Layout><SupportInbox /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:id" element={
            <PrivateRoute>
              <Layout><CourseDetail /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:id/discussions" element={
            <PrivateRoute>
              <Layout><CourseDiscussions /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:id/discussions/:discussionId" element={
            <PrivateRoute>
              <Layout><DiscussionDetail /></Layout>
            </PrivateRoute>
          } />

          <Route path="/calendar" element={
            <PrivateRoute>
              <Layout><CalendarPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:courseId/assignments" element={
            <PrivateRoute>
              <Layout><AssignmentList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:courseId/assignments/create" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><AssignmentCreate /></Layout>
            </PrivateRoute>
          } />

          <Route path="/assignments/:id/take" element={
            <PrivateRoute>
              <Layout><AssignmentTake /></Layout>
            </PrivateRoute>
          } />

          <Route path="/assignments/:id/grade" element={
            <PrivateRoute>
              <Layout><AssignmentGrade /></Layout>
            </PrivateRoute>
          } />

          <Route path="/courses/:id/study" element={
            <PrivateRoute>
              <CourseViewer />
            </PrivateRoute>
          } />

          <Route path="/exams" element={
            <PrivateRoute>
              <Layout><ExamList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/create" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CreateExam /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/:id/edit" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CreateExam /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/take/:id" element={
            <AuthRequiredModalRoute>
              {/* ExamTake is full screen, no Layout wrapping */}
              <ExamTake />
            </AuthRequiredModalRoute>
          } />

          <Route path="/exams/:id/proctoring" element={
            <PrivateRoute>
              <Layout><ExamProctoring /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/:id/analytics" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><ExamAnalytics /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/results/:resultId" element={
            <PrivateRoute>
              <Layout><ExamResult /></Layout>
            </PrivateRoute>
          } />

          <Route path="/exams/result/:resultId" element={
            <PrivateRoute>
              <Layout><ExamResult /></Layout>
            </PrivateRoute>
          } />

          <Route path="/library" element={
            <PrivateRoute>
              <Layout><LibraryPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/library/resources/:id" element={
            <PrivateRoute>
              <Layout><ResourceDetailPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/library/folders/:id" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><FolderDetailPage /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards" element={
            <PrivateRoute>
              <Layout><FlashcardList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards/create" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CreateFlashcard /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards/:id/edit" element={
            <PrivateRoute>
              <Layout><CreateFlashcard /></Layout>
            </PrivateRoute>
          } />

          {/* Old routes mapped to new ones or kept with different names if needed, but since we are unifying, we will use the Flashcard ones. The statistics and vocab routes are kept. */}
          <Route path="/flashcards/:id/statistics" element={
            <Suspense fallback={<LoadingOverlay text="Đang tải thống kê..." />}>
              <Layout><FlashcardStatistics /></Layout>
            </Suspense>
          } />

          <Route path="/flashcards/:id" element={
            <PrivateRoute>
              <Layout><FlashcardDetail /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards/:id/study" element={
            <Suspense fallback={<LoadingOverlay text="Đang tải học phần..." />}>
              <Layout><FlashcardStudyMode /></Layout>
            </Suspense>
          } />

          <Route path="/flashcards/:id/learn" element={
            <Suspense fallback={<LoadingOverlay text="Đang tải chế độ học..." />}>
              <Layout><FlashcardLearnMode /></Layout>
            </Suspense>
          } />

          <Route path="/flashcards/:id/test" element={
            <Suspense fallback={<LoadingOverlay text="Đang chuẩn bị bài kiểm tra..." />}>
              <Layout><FlashcardTestMode /></Layout>
            </Suspense>
          } />

          <Route path="/flashcards/:id/match" element={
            <Suspense fallback={<LoadingOverlay text="Đang tải trò chơi ghép thẻ..." />}>
              <Layout><FlashcardMatchGame /></Layout>
            </Suspense>
          } />

          <Route path="/vocabulary" element={
            <PrivateRoute>
              <Layout><VocabList /></Layout>
            </PrivateRoute>
          } />

          <Route path="/vocabulary/create" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN']}>
              <Layout><CreateVocab /></Layout>
            </PrivateRoute>
          } />

          <Route path="/vocabulary/:id/edit" element={
            <PrivateRoute>
              <Layout><CreateVocab /></Layout>
            </PrivateRoute>
          } />

          <Route path="/vocabulary/:id/study" element={
            <PrivateRoute>
              <Layout><VocabStudy /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards/decks/:id" element={
            <PrivateRoute>
              <Layout><FlashcardDetail /></Layout>
            </PrivateRoute>
          } />

          <Route path="/vocabs" element={<Navigate to="/vocabulary" replace />} />
          <Route path="/vocabs/:id" element={
            <PrivateRoute>
              <Layout><VocabStudy /></Layout>
            </PrivateRoute>
          } />
          <Route path="/vocabs/:id/study" element={
            <PrivateRoute>
              <Layout><VocabStudy /></Layout>
            </PrivateRoute>
          } />

          <Route path="/flashcards/:id/vocab" element={
            <PrivateRoute>
              <Layout><VocabStudy /></Layout>
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Layout><ProfileLayout /></Layout>
            </PrivateRoute>
          }>
            <Route index element={<ProfileEdit />} />
            <Route path="appearance" element={<ProfileAppearance />} />
            <Route path="security" element={<ProfileSecurity />} />
            <Route path="history" element={<ExamHistory />} />
            <Route path="certificates" element={<ProfileCertificates />} />
          </Route>

          {/* Classroom Routes */}
          <Route path="/classes" element={
            <PrivateRoute>
              <Layout><ClassDashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="/classes/:id" element={
            <PrivateRoute>
              <ClassDetailLayout />
            </PrivateRoute>
          }>
            <Route index element={<ClassStream />} />
            <Route path="classwork" element={<ClassworkList />} />
            <Route path="people" element={<ClassPeople />} />
            <Route path="grades" element={<ClassGradebook />} />
            <Route path="attendance" element={<ClassAttendance />} />
            <Route path="leaderboard" element={<Navigate to="../" replace />} />
            <Route path="courses" element={<ClassCourses />} />
            <Route path="assignments/create" element={
              <PrivateRoute>
                <ClassAssignmentCreate />
              </PrivateRoute>
            } />
            <Route path="assignments/:assignmentId/edit" element={
              <PrivateRoute>
                <ClassAssignmentCreate />
              </PrivateRoute>
            } />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/users" element={
            <PrivateRoute roles={['ADMIN', 'OFFICE']}>
              <Layout isViewportConstrained={true}><UserManagement /></Layout>
            </PrivateRoute>
          } />

          <Route path="/admin/audit-logs" element={
            <PrivateRoute roles={['ADMIN', 'OFFICE']}>
              <Layout isViewportConstrained={true}>
                <AuditLogs />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/admin/students" element={
            <PrivateRoute roles={['TEACHER', 'ADMIN', 'OFFICE']}>
              <Layout isViewportConstrained={true}>
                <StudentImport defaultTab="import" />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/admin/classes" element={
            <PrivateRoute roles={['ADMIN', 'OFFICE']}>
              <Layout isViewportConstrained={true}>
                <StudentImport defaultTab="classes" />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/admin/activities" element={
            <PrivateRoute roles={['ADMIN']}>
              <Layout isViewportConstrained={true}>
                <ActivityManagement />
              </Layout>
            </PrivateRoute>
          } />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        {/* Ngoai <Routes> de bong bong ho tro co mat o moi trang, ke ca landing/login */}
        <SupportWidget />
      </Router>
    </GoogleOAuthProvider>
  );
}

// Guard cho /role-selection: chỉ hiển thị khi đã login + chưa có role
function RoleSelectionGuard() {
  const { isAuthenticated, isUnassigned } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isUnassigned) return <Navigate to="/dashboard" replace />;
  return <RoleSelection />;
}

export default App;
