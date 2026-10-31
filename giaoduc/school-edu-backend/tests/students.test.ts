import { describe, it, expect, beforeAll } from 'vitest';
import * as XLSX from 'xlsx';
import { api, BASE, login, makeUser } from './helpers';

let admin = '';
let teacher: Awaited<ReturnType<typeof makeUser>>;
let classId = '';
const tag = String(Date.now() % 1e6);
const codeA = `HS${tag}A`, codeB = `HS${tag}B`;

beforeAll(async () => {
  admin = await login('Admin', 'admin123@');
  teacher = await makeUser(admin, 'TEACHER');
  classId = (await api('POST', '/classes', { name: `Lớp 6A ${tag}`, teacherId: teacher.id }, admin)).data.id;
});

const xlsxFile = (rows: unknown[][]) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'DS');
  return new File([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })], 'ds.xlsx');
};
const importTo = async (path: string, file: File, token: string, classroomId?: string) => {
  const fd = new FormData();
  fd.append('file', file);
  if (classroomId) fd.append('classroomId', classroomId);
  const r = await fetch(`${BASE}/api/v1/students${path}`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, json: await r.json() as any };
};

describe('Hồ sơ học sinh', () => {
  it('giáo viên nhập Excel vào lớp mình: tách mã - tên, chuẩn hóa SĐT, ngày sinh nhiều dạng', async () => {
    const f = xlsxFile([['Cơ sở', 'Học sinh', 'Ngày sinh', 'SĐT'], ['CS1', `${codeA} - Nguyễn Văn An`, '14/07/2012', 912345678], ['CS1', `${codeB} - Trần Thị Bình`, 41000, '0987 654 321'], ['CS1', 'dòng lỗi không có mã', '', '']]);
    const r = await importTo('/import', f, teacher.token, classId);
    expect(r.status).toBe(200);
    expect(r.json.data).toHaveLength(2);
    expect(r.json.data[0]).toMatchObject({ studentCode: codeA, fullName: 'Nguyễn Văn An', dateOfBirth: '2012-07-14', phone: '0912345678', status: 'PENDING', enrollments: [{ classroomId: classId }] });
    expect(r.json.data[1]).toMatchObject({ dateOfBirth: '2012-04-01', phone: '0987654321' });
    const other = await makeUser(admin, 'TEACHER');
    expect((await importTo('/import', f, other.token, classId)).status).toBe(403);
  });
  it('lọc theo lớp và từ khóa; tra mã công khai che SĐT; tự đăng ký bị tắt', async () => {
    const l = await api('GET', `/v1/students?className=${encodeURIComponent(`6A ${tag}`)}&keyword=bình`, undefined, admin);
    expect(l.data.content.map((x: any) => x.studentCode)).toEqual([codeB]);
    const v = await api('GET', `/v1/students/verify-code?code=${codeA.toLowerCase()}&fullName=${encodeURIComponent('nguyễn  văn an'.normalize('NFD'))}`);
    expect(v.data.phone).toBe('****5678');
    expect((await api('GET', `/v1/students/verify-code?code=${codeA}&fullName=Ai%20do`)).status).toBe(400);
    expect((await api('POST', '/v1/students/register', { studentCode: codeA })).status).toBe(403);
  });
  it('học sinh liên kết bằng mã + ngày sinh thì vào lớp; sửa, chuyển lớp, xóa', async () => {
    const s = await makeUser(admin, 'STUDENT');
    expect((await api('POST', '/v1/students/link-account', { studentCode: codeA, dateOfBirth: '15/07/2012' }, s.token)).status).toBe(400);
    expect((await api('POST', '/v1/students/link-account', { studentCode: codeA, dateOfBirth: '14-7-2012' }, s.token)).status).toBe(200);
    const mine = await api('GET', '/classes', undefined, s.token);
    expect(JSON.stringify(mine.data)).toContain(classId);
    const prof = await api('GET', `/v1/students/user/${s.id}`, undefined, teacher.token);
    expect(prof.data).toMatchObject({ studentCode: codeA, status: 'ACTIVE' });
    const pid = prof.data.id;
    expect((await api('PUT', `/v1/students/${pid}`, { studentCode: codeB }, admin)).status).toBe(400);
    expect((await api('PUT', `/v1/students/${pid}`, { fullName: 'Nguyễn Văn Ân' }, admin)).data.fullName).toBe('Nguyễn Văn Ân');
    expect((await api('PUT', `/v1/students/${pid}/classrooms`, { classroomIds: [] }, admin)).data.enrollments).toEqual([]);
    expect(JSON.stringify((await api('GET', '/classes', undefined, s.token)).data)).not.toContain(classId);
    expect((await api('PUT', `/v1/students/${pid}`, { fullName: 'x' }, teacher.token)).status).toBe(403);
    const b = (await api('GET', `/v1/students?keyword=${codeB}`, undefined, admin)).data.content[0];
    await api('DELETE', '/v1/students/bulk', [b.id], admin);
    expect((await api('GET', `/v1/students?keyword=${codeB}`, undefined, admin)).data.totalElements).toBe(0);
  });
});
