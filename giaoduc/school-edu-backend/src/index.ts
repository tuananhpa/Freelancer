import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv, Bindings } from './types';
import { ApiError, errorBody, ok } from './lib/http';
import authRoutes from './routes/auth';
import { me, adminUsers } from './routes/users';
import classes, { classroomsV1, classExams } from './routes/classrooms';
import gamification from './routes/gamification';
import exams from './routes/exams';
import mistakeVault from './routes/mistakeVault';
import assignments from './routes/assignments';
import { aiRoutes, aiPreview, publicSettings, adminSettings } from './routes/settings';
import { notifications, analytics, calendar, calendarV1, auditLogs, search, folders } from './routes/misc';
import flashcards, { share, vocabAi } from './routes/flashcards';
import resources, { files, media } from './routes/resources';
import students from './routes/students';
import activities, { publicActivities } from './routes/activities';
import support from './routes/support';
import examImport from './routes/examImport';
import { scanDeadlines } from './cron';
export { RealtimeHub } from './realtime';
import courses, { lessonComments, discussions, certificates, learningPath } from './routes/courses';

export const app = new Hono<AppEnv>();

app.use('/api/*', async (c, next) => {
  const allowed = (c.env.CORS_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return cors({ origin: (o) => (allowed.includes(o) ? o : null), credentials: true, allowHeaders: ['Authorization', 'Content-Type', 'X-Guest-Token'], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], maxAge: 600 })(c, next);
});
app.use('/api/*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

app.get('/api/health', (c) => ok(c, { status: 'ok' }));
app.route('/api/auth', authRoutes);
app.route('/api/users/me/ai-settings', aiRoutes);
app.route('/api/users/me', me);
app.route('/api/admin/users', adminUsers);
app.route('/api/admin/settings', adminSettings);
app.route('/api/public/settings', publicSettings);
app.route('/api/ai', aiPreview);
app.route('/api/classes', classes);
app.route('/api/v1/classrooms', classroomsV1);
app.route('/api/v1/class-exams', classExams);
app.route('/api/gamification', gamification);
app.route('/api/exams', examImport); // trước exams để /import-* không bị /:id bắt
app.route('/api/exams', exams);
app.route('/api/mistake-vault', mistakeVault);
app.route('/api/v1/assignments', assignments);
app.route('/api/notifications', notifications);
app.route('/api/analytics', analytics);
app.route('/api/calendar', calendar);
app.route('/api/v1/calendar', calendarV1);
app.route('/api/audit-logs', auditLogs);
app.route('/api/search', search);
app.route('/api/folders', folders);
app.route('/api/flashcards', flashcards);
app.route('/api/share', share);
app.route('/api/vocabulary/ai', vocabAi);
app.route('/api/resources', resources);
app.route('/api/v1/files', files);
app.route('/api/media', media);
app.route('/api/v1/students', students);
app.route('/api/activities', activities);
app.route('/api/public/activities', publicActivities);
app.route('/api/support', support);
app.route('/api/courses', courses);
app.route('/api/lessons/:lessonId/comments', lessonComments);
app.route('/api/v1/discussions', discussions);
app.route('/api/v1/certificates', certificates);
app.route('/api/learning-path', learningPath);

// WebSocket STOMP (frontend: VITE_WS_URL=wss://<host>/ws)
app.get('/ws', (c) => (c.env.REALTIME && c.req.header('Upgrade') === 'websocket' ? c.env.REALTIME.get(c.env.REALTIME.idFromName('hub')).fetch(c.req.raw) : c.text('Expected WebSocket', 426)));
app.all('/api/*', (c) => c.json(errorBody(404, 'RESOURCE_NOT_FOUND', 'Không tìm thấy đường dẫn API.'), 404));
// Ngoài /api: trả frontend (SPA) từ Workers Assets
app.all('*', (c) => (c.env.ASSETS ? c.env.ASSETS.fetch(c.req.raw) : c.text('Not found', 404)));

app.onError((err, c) => {
  if (err instanceof ApiError) return c.json(errorBody(err.status, err.errorCode, err.message), err.status as 400);
  // Không trả chi tiết lỗi nội bộ cho client
  console.error('[api]', c.req.method, new URL(c.req.url).pathname, err instanceof Error ? err.message : 'unknown');
  return c.json(errorBody(500, 'SYSTEM_ERROR', 'Lỗi hệ thống. Vui lòng thử lại sau.'), 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledController, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil(scanDeadlines(env).catch((e) => console.error('[cron]', e instanceof Error ? e.message : e)));
  },
} satisfies ExportedHandler<Bindings>;
