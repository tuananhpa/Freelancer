import type { Bindings } from './types';
import { all, count, one } from './db';
import { javaTime } from './lib/time';
import { notify } from './lib/notify';

/** "2099-03-10T08:00:00" (giờ VN) → "08:00 10/03/2099" */
const fmt = (utc: string) => { const t = javaTime(utc)!; return `${t.slice(11, 16)} ${t.slice(8, 10)}/${t.slice(5, 7)}/${t.slice(0, 4)}`; };
console.assert(fmt('2099-03-10T01:00:00.000Z') === '08:00 10/03/2099', 'cron fmt');

/**
 * ClassDeadlineReminderScheduler (30 phút/lần): nhắc học sinh còn bài/đề chưa làm khi hạn còn ≤ 24 giờ,
 * nhắc khẩn khi ≤ 6 giờ và báo giáo viên số em chưa nộp. Java chống trùng bằng bộ nhớ 36 giờ;
 * ở đây tra bảng notifications (Worker không giữ bộ nhớ giữa các lần chạy).
 */
export async function scanDeadlines(env: Bindings, nowMs = Date.now()) {
  const now = new Date(nowMs).toISOString(), next24 = new Date(nowMs + 86_400_000).toISOString(), since = new Date(nowMs - 36 * 3_600_000).toISOString();
  const sentRecently = async (userId: string, key: string) => !!(await one(env, "SELECT 1 AS x FROM notifications WHERE user_id = ? AND entity_type = 'DEADLINE_REMINDER' AND entity_id = ? AND created_at > ?", userId, key, since));
  const items = [
    ...(await all<any>(env, "SELECT a.id, a.title, a.due_date AS due, c.id AS cid, c.name AS cname, c.teacher_id, 'assign' AS kind FROM assignments a JOIN classrooms c ON c.id = a.classroom_id WHERE a.due_date > ? AND a.due_date <= ?", now, next24)),
    ...(await all<any>(env, "SELECT ce.id, e.title, ce.close_time AS due, c.id AS cid, c.name AS cname, c.teacher_id, ce.exam_id, 'exam' AS kind FROM class_exams ce JOIN exams e ON e.id = ce.exam_id JOIN classrooms c ON c.id = ce.classroom_id WHERE ce.close_time > ? AND ce.close_time <= ?", now, next24)),
  ];
  let sent = 0;
  for (const it of items) {
    const hoursLeft = Math.floor((Date.parse(it.due) - nowMs) / 3_600_000);
    const urgent = hoursLeft <= 6, milestone = urgent ? 'urgent' : '24h', when = fmt(it.due), link = `/classes/${it.cid}/classwork`, left = hoursLeft > 0 ? `${hoursLeft} giờ` : 'ít phút';
    const students = await all<{ user_id: string }>(env, "SELECT user_id FROM class_members WHERE classroom_id = ? AND role = 'STUDENT'", it.cid);
    let missing = 0;
    for (const s of students) {
      // giữ đúng truy vấn Java: bài tập thì đếm mọi bài chưa nộp hạn trong (now, hạn bài này]; đề thì mọi đề còn mở chưa làm
      const pending = it.kind === 'assign'
        ? await count(env, 'SELECT COUNT(*) AS n FROM assignments a WHERE a.classroom_id = ? AND a.due_date > ? AND a.due_date <= ? AND NOT EXISTS (SELECT 1 FROM assignment_submissions x WHERE x.assignment_id = a.id AND x.student_id = ?)', it.cid, now, it.due, s.user_id)
        : await count(env, 'SELECT COUNT(*) AS n FROM class_exams ce WHERE ce.classroom_id = ? AND ce.close_time > ? AND NOT EXISTS (SELECT 1 FROM student_exam_results r WHERE r.exam_id = ce.exam_id AND r.student_id = ?)', it.cid, now, s.user_id);
      if (!pending) continue;
      missing++;
      const key = `${it.kind}_${it.id}_${milestone}`;
      if (await sentRecently(s.user_id, key)) continue;
      const [title, msg] = it.kind === 'assign'
        ? urgent ? [`🔥 KHẨN CẤP: Bài tập ${it.title} sắp hết hạn!`, `Chỉ còn ${left} nữa là hết hạn nộp bài trong lớp ${it.cname} (${when}). Vui lòng nộp ngay!`]
          : [`⏰ Nhắc nhở hạn chót: ${it.title}`, `Bài tập trong lớp ${it.cname} sẽ hết hạn nộp vào lúc ${when}. Hãy sắp xếp hoàn thành sớm!`]
        : urgent ? [`🔥 KHẨN CẤP: Đề thi ${it.title} sắp đóng!`, `Chỉ còn ${left} nữa là kết thúc thời gian thi trong lớp ${it.cname} (${when}). Hãy làm bài thi ngay!`]
          : [`⏰ Nhắc nhở đóng đề thi: ${it.title}`, `Đề thi trong lớp ${it.cname} sẽ đóng vào lúc ${when}. Hãy chuẩn bị và làm bài sớm!`];
      await notify(env, s.user_id, title, msg, link, 'DEADLINE', null, 'DEADLINE_REMINDER', key);
      sent++;
    }
    const tkey = `${it.kind}_summary_${it.id}`;
    if (it.teacher_id && missing > 0 && urgent && !(await sentRecently(it.teacher_id, tkey))) {
      await notify(env, it.teacher_id, it.kind === 'assign' ? `📊 Tiến độ bài tập: ${it.title}` : `📊 Tiến độ đề thi: ${it.title}`,
        it.kind === 'assign' ? `Lớp ${it.cname} có bài tập sắp đến hạn lúc ${when}. Hiện còn ${missing} học viên chưa nộp bài.` : `Lớp ${it.cname} có đề thi sắp đóng lúc ${when}. Hiện còn ${missing} học viên chưa hoàn thành bài thi.`,
        link, 'DEADLINE', null, 'DEADLINE_REMINDER', tkey);
      sent++;
    }
  }
  return sent;
}
