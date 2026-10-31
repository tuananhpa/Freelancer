import { Hono } from 'hono';
import type { AppEnv, Bindings, UserRow } from '../types';
import { body, raw, uuid } from '../lib/http';
import { auth } from '../lib/auth';
import { all, one, run } from '../db';
import { javaTime, nowISO, todayVN } from '../lib/time';
import { notify } from '../lib/notify';

const XP: Record<string, number> = { EXAM_COMPLETE: 50, LESSON_COMPLETE: 20, FLASHCARD_STUDY: 15, ASSIGNMENT_SUBMIT: 30, DAILY_LOGIN: 10, CLASSROOM_JOIN: 25, MISTAKE_REVIEW: 12 };
const parseBadges = (s: string | null) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/** GamificationService.recordActivity: cộng XP, cập nhật chuỗi ngày, mở huy hiệu */
export async function recordActivity(env: Bindings, user: Pick<UserRow, 'id'>, type: string) {
  const xp = XP[type] ?? 10;
  const today = todayVN();
  await run(env, 'INSERT INTO user_activity_log (id, user_id, activity_type, activity_date, xp_earned, created_at) VALUES (?,?,?,?,?,?)', uuid(), user.id, type, today, xp, nowISO());
  const s = (await one<{ total_xp: number; current_streak: number; longest_streak: number; last_activity_date: string | null; badges: string | null }>(env, 'SELECT * FROM user_gamification WHERE user_id = ?', user.id))
    ?? { total_xp: 0, current_streak: 0, longest_streak: 0, last_activity_date: null, badges: '[]' };
  const total = s.total_xp + xp;
  const last = s.last_activity_date;
  const streak = !last ? 1 : last === today ? s.current_streak : daysBetween(last, today) === 1 ? s.current_streak + 1 : 1;
  const longest = Math.max(s.longest_streak, streak);
  const old = parseBadges(s.badges);
  const badges = [...old];
  const add = (b: string, cond: boolean) => { if (cond && !badges.includes(b)) badges.push(b); };
  add('STREAK_3', streak >= 3); add('STREAK_7', streak >= 7); add('XP_100', total >= 100); add('XP_500', total >= 500);
  await run(env, `INSERT INTO user_gamification (user_id, total_xp, current_streak, longest_streak, last_activity_date, badges) VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET total_xp = excluded.total_xp, current_streak = excluded.current_streak, longest_streak = excluded.longest_streak, last_activity_date = excluded.last_activity_date, badges = excluded.badges`,
    user.id, total, streak, longest, today, JSON.stringify(badges));
  for (const b of badges) if (!old.includes(b)) await notify(env, user.id, 'Huy hiệu mới!', `Chúc mừng! Bạn vừa mở khóa huy hiệu '${b}'.`, '/dashboard', 'GAMIFICATION', null, 'BADGE', b);
  return { totalXp: total, currentStreak: streak, longestStreak: longest, badges, lastActivityDate: today };
}

export async function gamificationStats(env: Bindings, userId: string) {
  const s = (await one<any>(env, 'SELECT * FROM user_gamification WHERE user_id = ?', userId)) ?? { total_xp: 0, current_streak: 0, longest_streak: 0, last_activity_date: null, badges: '[]' };
  const recent = await all<any>(env, 'SELECT activity_type, xp_earned, activity_date, created_at FROM user_activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', userId);
  const level = Math.max(1, Math.floor(s.total_xp / 100) + 1);
  const daysInactive = s.last_activity_date ? daysBetween(s.last_activity_date, todayVN()) : 3;
  const health = Math.max(0, Math.min(100, 100 - daysInactive * 25));
  const mood = health <= 25 ? 'SLEEPING' : health <= 50 ? 'HUNGRY' : s.current_streak >= 7 ? 'EXCITED' : s.current_streak >= 3 ? 'HAPPY' : 'NORMAL';
  const title = level >= 20 ? 'Huyền thoại vũ trụ' : level >= 10 ? 'Thám hiểm sao' : level >= 5 ? 'Phi hành gia trẻ' : 'Mầm non';
  return {
    totalXp: s.total_xp, diamonds: Math.max(0, Math.floor(s.total_xp / 5) + s.current_streak * 10), currentStreak: s.current_streak, longestStreak: s.longest_streak,
    badges: parseBadges(s.badges), lastActivityDate: s.last_activity_date, uranianLevel: level, uranianHealth: health, uranianMood: mood, uranianTitle: title,
    recentActivities: recent.map((a) => ({ activityType: a.activity_type, xpEarned: a.xp_earned, activityDate: javaTime(a.created_at) ?? a.activity_date })),
  };
}

const r = new Hono<AppEnv>();
r.use('*', auth());
r.get('/', async (c) => raw(c, await gamificationStats(c.env, c.get('user').id)));
r.post('/activity', async (c) => {
  const b = await body(c);
  await recordActivity(c.env, c.get('user'), String(b.activityType || 'DAILY_LOGIN').slice(0, 50));
  return raw(c, await gamificationStats(c.env, c.get('user').id));
});
r.get('/leaderboard', async (c) => {
  const metric = (c.req.query('metric') || 'TIME').toUpperCase();
  const rows = await all<any>(c.env, `SELECT u.id, u.full_name, u.email, u.avatar_url, COALESCE(g.total_xp,0) AS xp, COALESCE(g.current_streak,0) AS streak,
      (SELECT COUNT(*) FROM user_activity_log l WHERE l.user_id = u.id) AS acts FROM users u LEFT JOIN user_gamification g ON g.user_id = u.id WHERE u.role = 'STUDENT'`);
  const list = rows.map((u) => ({ userId: u.id, fullName: u.full_name || u.email.split('@')[0], username: `@${u.email.split('@')[0]}`, avatarUrl: u.avatar_url, level: Math.max(1, Math.floor(u.xp / 100) + 1), totalXp: u.xp, currentStreak: u.streak, studyMinutes: Math.floor(u.acts * 25 + u.xp * 0.4), rank: 0 }));
  list.sort((a, b) => (metric === 'XP' ? b.totalXp - a.totalXp : b.studyMinutes - a.studyMinutes));
  list.forEach((x, i) => { x.rank = i + 1; });
  return raw(c, list);
});
export default r;
