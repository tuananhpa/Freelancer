// Dữ liệu mẫu cho bản demo (VITE_DEMO=true). Mọi tên người, lớp, điểm là giả lập.
// Ngày tháng tính tương đối theo lúc mở trang để demo luôn "đang diễn ra".

let s = 20261029;
export const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

export const day = (offset: number, hour = 8, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'OFFICE' | 'TEACHING_ASSISTANT';
export interface DemoUser {
  id: string; email: string; password: string; fullName: string; role: Role;
  avatarUrl: string | null; studentCode?: string; phone?: string; status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  authProvider: 'LOCAL'; createdAt: string; ability?: number;
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
const DEM = ['Minh', 'Thu', 'Gia', 'Ngọc', 'Bảo', 'Khánh', 'Phương', 'Đức', 'Thanh', 'Hải', 'Quỳnh', 'Tuấn', 'Anh', 'Hoài'];
const TEN = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Huy', 'Khoa', 'Linh', 'Lâm', 'My', 'Nam', 'Ngân', 'Nhi', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Thảo', 'Trang', 'Trí', 'Vy', 'Yến', 'Long'];

export const DEMO_PASSWORD = 'Demo@123'; // chỉ dùng cho bản demo, không phải mật khẩu thật

export const users: DemoUser[] = [
  { id: 'u-teacher', email: 'giaovien@demo.local', password: DEMO_PASSWORD, fullName: 'Cô Lê Hạnh', role: 'TEACHER', avatarUrl: null, phone: '0900 000 001', status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-400) },
  { id: 'u-student', email: 'hocsinh@demo.local', password: DEMO_PASSWORD, fullName: 'Trần Minh Anh', role: 'STUDENT', avatarUrl: null, studentCode: 'HS0001', status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-300), ability: 0.84 },
  { id: 'u-admin', email: 'admin@demo.local', password: DEMO_PASSWORD, fullName: 'Quản trị trường', role: 'ADMIN', avatarUrl: null, status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-500) },
  { id: 'u-t2', email: 'huy.pham@demo.local', password: DEMO_PASSWORD, fullName: 'Thầy Phạm Quang Huy', role: 'TEACHER', avatarUrl: null, status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-380) },
  { id: 'u-t3', email: 'trang.nguyen@demo.local', password: DEMO_PASSWORD, fullName: 'Cô Nguyễn Thu Trang', role: 'TEACHER', avatarUrl: null, status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-360) },
  { id: 'u-ta', email: 'trogiang@demo.local', password: DEMO_PASSWORD, fullName: 'Đỗ Hải Yến', role: 'TEACHING_ASSISTANT', avatarUrl: null, status: 'ACTIVE', authProvider: 'LOCAL', createdAt: day(-200) },
];

const seen = new Set(['Trần Minh Anh']);
for (let i = 2; i <= 124; i++) {
  let name = '';
  do name = `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`; while (seen.has(name));
  seen.add(name);
  const code = `HS${String(i).padStart(4, '0')}`;
  users.push({
    id: `s-${i}`, email: `${code.toLowerCase()}@demo.local`, password: DEMO_PASSWORD, fullName: name, role: 'STUDENT',
    avatarUrl: null, studentCode: code, status: i % 41 === 0 ? 'INACTIVE' : 'ACTIVE', authProvider: 'LOCAL',
    createdAt: day(-300 + i), ability: 0.45 + rnd() * 0.5,
  });
}
export const userById = (id: string) => users.find((u) => u.id === id);
const studentsAll = users.filter((u) => u.role === 'STUDENT');

/* ---------- Lớp học ---------- */
export interface DemoClass {
  id: string; name: string; subject: string; section: string; room: string; description: string;
  inviteCode: string; teacherId: string; thumbnail?: string; leaderboardEnabled: boolean; meetingLink?: string;
  createdAt: string; memberIds: string[]; taIds: string[];
}
export const classes: DemoClass[] = [
  { id: 'c-10a1', name: '10A1', subject: 'Ngữ văn', section: 'Học kì I · 2026–2027', room: 'P.204', description: 'Lớp chủ nhiệm, 3 tiết Văn mỗi tuần.', inviteCode: 'VAN10A', teacherId: 'u-teacher', leaderboardEnabled: true, meetingLink: 'https://meet.google.com/demo-10a1', createdAt: day(-60), memberIds: ['u-student', ...studentsAll.slice(1, 34).map((u) => u.id)], taIds: ['u-ta'] },
  { id: 'c-10a3', name: '10A3', subject: 'Ngữ văn', section: 'Học kì I · 2026–2027', room: 'P.206', description: 'Ngữ văn 10 – bộ Kết nối tri thức.', inviteCode: 'VAN10C', teacherId: 'u-teacher', leaderboardEnabled: true, createdAt: day(-58), memberIds: studentsAll.slice(34, 66).map((u) => u.id), taIds: [] },
  { id: 'c-11b2', name: '11B2', subject: 'Ngữ văn', section: 'Học kì I · 2026–2027', room: 'P.301', description: 'Ngữ văn 11 – chuyên đề nghị luận văn học.', inviteCode: 'VAN11B', teacherId: 'u-teacher', leaderboardEnabled: false, createdAt: day(-57), memberIds: studentsAll.slice(66, 96).map((u) => u.id), taIds: [] },
  { id: 'c-12c1', name: '12C1 · Ôn thi tốt nghiệp', subject: 'Ngữ văn', section: 'Ôn thi THPT 2027', room: 'Trực tuyến', description: 'Luyện đề theo cấu trúc mới.', inviteCode: 'ONTHI12', teacherId: 'u-teacher', leaderboardEnabled: true, createdAt: day(-40), memberIds: studentsAll.slice(96, 124).map((u) => u.id), taIds: [] },
  { id: 'c-eng', name: 'CLB Tiếng Anh 10', subject: 'Tiếng Anh', section: 'Chiều thứ 5', room: 'Lab 2', description: 'Câu lạc bộ giao tiếp và luyện IELTS nền tảng.', inviteCode: 'ENG10', teacherId: 'u-t2', leaderboardEnabled: true, createdAt: day(-45), memberIds: ['u-student', ...studentsAll.slice(10, 30).map((u) => u.id)], taIds: [] },
];

/* ---------- Đề thi ---------- */
export type QType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
export interface DemoOption { id: string; content: string; isCorrect: boolean }
export interface DemoQuestion {
  id: string; content: string; questionType: QType; points: number; options: DemoOption[];
  correctText?: string; expectedAnswer?: string; keywords?: string[]; explanation?: string; skillTag?: string;
}
/** TX = thường xuyên (15 phút), GK = giữa kì (1 tiết), CK = cuối kì */
export type AssessType = 'TX' | 'GK' | 'CK';
export interface DemoExam {
  id: string; title: string; examCode: string; durationMinutes: number; isPublished: boolean;
  visibility: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM'; subject: string; grade: string; teacherId: string;
  createdAt: string; assessmentType?: AssessType; description?: string; questions: DemoQuestion[];
  favoritedBy: string[];
}

let qn = 0;
const mc = (content: string, opts: string[], correct: number, skillTag = 'doc-hieu', explanation?: string): DemoQuestion => {
  const id = `q${++qn}`;
  return { id, content, questionType: 'MULTIPLE_CHOICE', points: 1, skillTag, explanation,
    options: opts.map((o, i) => ({ id: `${id}o${i}`, content: o, isCorrect: i === correct })) };
};
const tf = (content: string, stmts: [string, boolean][], skillTag = 'doc-hieu'): DemoQuestion => {
  const id = `q${++qn}`;
  return { id, content, questionType: 'TRUE_FALSE', points: 1, skillTag,
    options: stmts.map(([t, ok], i) => ({ id: `${id}s${i}`, content: t, isCorrect: ok })) };
};
const essay = (content: string, points: number, expectedAnswer: string, keywords: string[], skillTag = 'viet'): DemoQuestion =>
  ({ id: `q${++qn}`, content, questionType: 'ESSAY', points, options: [], expectedAnswer, keywords, skillTag });
const short = (content: string, correctText: string, skillTag = 'tieng-viet'): DemoQuestion =>
  ({ id: `q${++qn}`, content, questionType: 'SHORT_ANSWER', points: 1, options: [], correctText, skillTag });

const doanTrich = '<p><em>“Lòng biết ơn là ký ức của trái tim.”</em> Người biết ơn không chỉ nhớ đến những điều tốt đẹp đã nhận mà còn biết trao lại điều tốt đẹp ấy cho người khác. Trong nhịp sống vội vã hôm nay, một lời cảm ơn chân thành đôi khi lại là điều bị lãng quên nhiều nhất.</p>';

export const exams: DemoExam[] = [
  {
    id: 'e-15p', title: 'Kiểm tra 15 phút – Nghị luận xã hội', examCode: 'NV15A1', durationMinutes: 15, isPublished: true,
    visibility: 'CLASSROOM', subject: 'Ngữ văn', grade: '10', teacherId: 'u-teacher', createdAt: day(-3), assessmentType: 'TX',
    description: 'Bài kiểm tra thường xuyên số 2. Điểm tự động ghi vào sổ điểm cột 15 phút.', favoritedBy: [],
    questions: [
      mc(`${doanTrich}<p>Câu văn in nghiêng trong đoạn trích sử dụng biện pháp tu từ nào?</p>`, ['So sánh', 'Ẩn dụ', 'Nhân hóa', 'Liệt kê'], 1, 'doc-hieu', 'Lòng biết ơn được ví ngầm là “ký ức của trái tim” – đó là ẩn dụ.'),
      mc('<p>Theo đoạn trích, người biết ơn là người như thế nào?</p>', ['Chỉ ghi nhớ điều tốt đã nhận', 'Ghi nhớ và trao lại điều tốt đẹp', 'Luôn nói lời cảm ơn', 'Không quên người đã giúp mình'], 1),
      mc('<p>Phương thức biểu đạt chính của đoạn trích là:</p>', ['Tự sự', 'Miêu tả', 'Nghị luận', 'Biểu cảm'], 2),
      mc('<p>Thao tác lập luận nào <strong>không</strong> xuất hiện trong đoạn trích?</p>', ['Giải thích', 'Bình luận', 'Bác bỏ', 'Nêu nhận xét'], 2, 'lap-luan'),
      mc('<p>Từ “vội vã” trong câu cuối thuộc từ loại nào?</p>', ['Danh từ', 'Động từ', 'Tính từ', 'Phó từ'], 2, 'tieng-viet'),
      mc('<p>Thông điệp chính tác giả muốn gửi gắm là:</p>', ['Hãy sống chậm lại', 'Hãy trân trọng và đáp đền điều tốt đẹp', 'Hãy ghi nhớ quá khứ', 'Hãy giúp đỡ người nghèo'], 1),
      tf('<p>Xác định đúng/sai cho mỗi nhận định sau về đoạn trích:</p>', [
        ['Đoạn trích bàn về một vấn đề tư tưởng, đạo lí.', true],
        ['Tác giả phê phán gay gắt lối sống vô ơn.', false],
        ['Câu mở đầu là một câu trích dẫn.', true],
        ['Đoạn trích sử dụng ngôi kể thứ nhất.', false],
      ], 'lap-luan'),
      short('<p>Điền một từ Hán Việt có nghĩa là “biết ơn” (2 tiếng):</p>', 'tri ân'),
    ],
  },
  {
    id: 'e-gk', title: 'Kiểm tra giữa kì I – Ngữ văn 10 (1 tiết)', examCode: 'NVGK10', durationMinutes: 60, isPublished: true,
    visibility: 'CLASSROOM', subject: 'Ngữ văn', grade: '10', teacherId: 'u-teacher', createdAt: day(-12), assessmentType: 'GK',
    description: 'Đọc hiểu 4 điểm, viết đoạn 2 điểm, viết bài 4 điểm. Phần viết được AI chấm gợi ý theo đáp án giáo viên.', favoritedBy: ['u-teacher'],
    questions: [
      mc('<p>Thể loại của văn bản “Chữ người tử tù” là:</p>', ['Tùy bút', 'Truyện ngắn', 'Kí sự', 'Tiểu thuyết'], 1, 'tac-pham'),
      mc('<p>Nhân vật Huấn Cao nổi bật với vẻ đẹp nào?</p>', ['Tài hoa, khí phách, thiên lương', 'Hiền lành, nhẫn nhục', 'Mưu trí, lanh lợi', 'Giàu có, quyền uy'], 0, 'tac-pham'),
      mc('<p>“Cảnh cho chữ” được tác giả gọi là:</p>', ['Một cảnh tượng xưa nay chưa từng có', 'Một cảnh đẹp thơ mộng', 'Một cảnh buồn thương', 'Một cảnh bình thường'], 0, 'tac-pham'),
      tf('<p>Đúng hay sai?</p>', [['Nguyễn Tuân là nhà văn của chủ nghĩa duy mĩ.', true], ['Tác phẩm in trong tập “Vang bóng một thời”.', true], ['Quản ngục là kẻ tàn ác, vô lương tâm.', false], ['Truyện kết thúc bằng cái chết của Huấn Cao.', false]], 'tac-pham'),
      essay('<p><strong>Câu 5 (2,0 điểm).</strong> Viết đoạn văn khoảng 150 chữ trình bày suy nghĩ về ý nghĩa của lòng biết ơn trong cuộc sống.</p>', 2,
        'Giải thích lòng biết ơn là ghi nhớ, trân trọng; nêu ý nghĩa: gắn kết con người, tạo động lực sống tốt; phê phán thói vô ơn; liên hệ bản thân.',
        ['biết ơn', 'trân trọng', 'gắn kết', 'vô ơn', 'bản thân']),
      essay('<p><strong>Câu 6 (4,0 điểm).</strong> Phân tích vẻ đẹp nhân vật Huấn Cao trong cảnh cho chữ.</p>', 4,
        'Mở bài giới thiệu tác giả, tác phẩm; thân bài: tài hoa (chữ đẹp), khí phách (hiên ngang, coi thường cái chết), thiên lương (khuyên quản ngục giữ thiên lương); nghệ thuật tương phản, ngôn ngữ cổ kính; kết bài khái quát giá trị.',
        ['tài hoa', 'khí phách', 'thiên lương', 'tương phản', 'quản ngục', 'cái đẹp']),
    ],
  },
  {
    id: 'e-ck', title: 'Kiểm tra cuối kì I – Ngữ văn 10', examCode: 'NVCK10', durationMinutes: 90, isPublished: true,
    visibility: 'CLASSROOM', subject: 'Ngữ văn', grade: '10', teacherId: 'u-teacher', createdAt: day(-1), assessmentType: 'CK',
    description: 'Mở từ tuần 18. Cấu trúc theo định hướng đánh giá năng lực.', favoritedBy: [],
    questions: [
      mc('<p>Văn bản nghị luận cần có yếu tố nào?</p>', ['Luận đề, luận điểm, lí lẽ, bằng chứng', 'Nhân vật, cốt truyện', 'Vần, nhịp', 'Lời thoại'], 0, 'lap-luan'),
      essay('<p>Viết bài văn nghị luận (khoảng 600 chữ) bàn về lối sống chủ động của tuổi trẻ.</p>', 6,
        'Giải thích sống chủ động; biểu hiện; ý nghĩa; phản đề sống thụ động; bài học nhận thức và hành động.', ['chủ động', 'tuổi trẻ', 'thụ động', 'ý nghĩa', 'hành động']),
    ],
  },
  {
    id: 'e-eng', title: 'English 10 – Unit 3: Music', examCode: 'ENG103', durationMinutes: 20, isPublished: true,
    visibility: 'PUBLIC', subject: 'Tiếng Anh', grade: '10', teacherId: 'u-t2', createdAt: day(-20), favoritedBy: ['u-student'],
    questions: [
      mc('<p>She ___ the guitar since she was eight.</p>', ['plays', 'has played', 'played', 'is playing'], 1, 'grammar'),
      mc('<p>Choose the word with a different stress: </p>', ['concert', 'audience', 'perform', 'talent'], 2, 'pronunciation'),
      mc('<p>A person who writes music is a ___.</p>', ['composer', 'conductor', 'singer', 'fan'], 0, 'vocabulary'),
      mc('<p>The show was ___ live on TV last night.</p>', ['broadcast', 'broadcasted', 'broadcasting', 'broadcasts'], 0, 'vocabulary'),
      mc('<p>We were excited ___ the concert.</p>', ['at', 'about', 'on', 'with'], 1, 'grammar'),
    ],
  },
  {
    id: 'e-toan', title: 'Toán 10 – Mệnh đề và tập hợp', examCode: 'TOAN101', durationMinutes: 15, isPublished: true,
    visibility: 'PUBLIC', subject: 'Toán', grade: '10', teacherId: 'u-t3', createdAt: day(-25), favoritedBy: [],
    questions: [
      mc('<p>Câu nào sau đây là mệnh đề?</p>', ['Hôm nay trời đẹp quá!', '2 + 3 = 6', 'Bạn có khỏe không?', 'x > 2'], 1, 'menh-de'),
      mc('<p>Cho A = {1; 2; 3}, B = {2; 3; 4}. A ∩ B = ?</p>', ['{1; 4}', '{2; 3}', '{1; 2; 3; 4}', '∅'], 1, 'tap-hop'),
      mc('<p>Số tập con của tập có 3 phần tử là:</p>', ['3', '6', '8', '9'], 2, 'tap-hop'),
      mc('<p>Mệnh đề phủ định của “∀x ∈ ℝ, x² ≥ 0” là:</p>', ['∃x ∈ ℝ, x² < 0', '∀x ∈ ℝ, x² < 0', '∃x ∈ ℝ, x² ≤ 0', '∀x ∈ ℝ, x² ≤ 0'], 0, 'menh-de'),
    ],
  },
  {
    id: 'e-draft', title: 'Đề nháp – Thơ Đường luật', examCode: 'NVDRAFT', durationMinutes: 45, isPublished: false,
    visibility: 'HIDDEN', subject: 'Ngữ văn', grade: '11', teacherId: 'u-teacher', createdAt: day(0, 7), favoritedBy: [],
    questions: [mc('<p>Thơ thất ngôn bát cú có bao nhiêu câu?</p>', ['4', '6', '8', '10'], 2, 'tac-pham')],
  },
];

/* ---------- Bài làm học sinh mẫu (để AI chấm) ---------- */
export const essaySamples = [
  'Lòng biết ơn là sự ghi nhớ và trân trọng những gì người khác đã dành cho mình. Khi biết ơn, con người gắn kết với nhau hơn, xã hội trở nên ấm áp. Ngược lại, thói vô ơn khiến các mối quan hệ rạn nứt. Bản thân em sẽ luôn nói lời cảm ơn và giúp đỡ người khác như cách em từng được giúp.',
  'Biết ơn là một đức tính tốt. Chúng ta cần biết ơn cha mẹ, thầy cô. Nếu không biết ơn thì không tốt. Em sẽ cố gắng học tốt để đền đáp công ơn.',
  'Trong cuộc sống, lòng biết ơn giống như sợi dây vô hình nối con người lại với nhau. Người biết trân trọng sẽ sống tử tế, lan tỏa điều tốt. Tuy vậy, vẫn còn những người vô ơn, coi mọi sự giúp đỡ là điều hiển nhiên. Mỗi bạn trẻ cần rèn luyện bản thân từ những việc nhỏ như cảm ơn bác bảo vệ, cô lao công.',
  'Huấn Cao là người tài hoa, chữ đẹp nổi tiếng. Ông có khí phách hiên ngang, không sợ cái chết. Trong cảnh cho chữ, nghệ thuật tương phản giữa bóng tối nhà ngục và ánh sáng cái đẹp làm nổi bật thiên lương. Ông khuyên quản ngục bỏ nghề để giữ thiên lương.',
];

/* ---------- Thẻ ghi nhớ & từ vựng ---------- */
export const decks = [
  { id: 'd-thuatngu', title: 'Thuật ngữ Văn học 10', description: 'Biện pháp tu từ và khái niệm cơ bản.', visibility: 'PUBLIC', deckType: 'FLASHCARD', subject: 'Ngữ văn', tags: 'Ngữ văn,Lớp 10', ownerId: 'u-teacher', createdAt: day(-30), viewsCount: 412, savesCount: 58, learnerCount: 96, averageRating: 4.8, ratingCount: 21,
    cards: [['Ẩn dụ', 'Gọi tên sự vật này bằng tên sự vật khác có nét tương đồng.'], ['Hoán dụ', 'Gọi tên sự vật bằng tên sự vật khác có quan hệ gần gũi.'], ['Nhân hóa', 'Gán đặc điểm của người cho vật.'], ['Điệp ngữ', 'Lặp lại từ ngữ để nhấn mạnh.'], ['Luận điểm', 'Ý kiến thể hiện quan điểm trong bài nghị luận.'], ['Thiên lương', 'Bản tính tốt đẹp vốn có của con người.']] },
  { id: 'd-ielts', title: 'IELTS Vocabulary – Education', description: 'Từ vựng chủ đề giáo dục band 6.0+.', visibility: 'PUBLIC', deckType: 'VOCAB', subject: 'Tiếng Anh', tags: 'IELTS,Vocabulary', ownerId: 'u-t2', createdAt: day(-40), viewsCount: 1290, savesCount: 210, learnerCount: 340, averageRating: 4.6, ratingCount: 54,
    cards: [['curriculum', 'chương trình học', '/kəˈrɪkjələm/', 'noun', 'The school updated its curriculum.'], ['tuition', 'học phí', '/tjuˈɪʃn/', 'noun', 'Tuition fees have risen.'], ['assess', 'đánh giá', '/əˈses/', 'verb', 'Teachers assess students every term.'], ['literacy', 'khả năng đọc viết', '/ˈlɪtərəsi/', 'noun', 'Digital literacy matters.'], ['enrol', 'ghi danh', '/ɪnˈrəʊl/', 'verb', 'She enrolled in an art course.']] },
  { id: 'd-unit3', title: 'Từ vựng Unit 3 – Music', description: 'Tiếng Anh 10 Global Success.', visibility: 'CLASSROOM', deckType: 'VOCAB', subject: 'Tiếng Anh', tags: 'Lớp 10', ownerId: 'u-t2', createdAt: day(-18), viewsCount: 220, savesCount: 31, learnerCount: 44, averageRating: 4.5, ratingCount: 9,
    cards: [['composer', 'nhà soạn nhạc', '/kəmˈpəʊzə(r)/', 'noun', 'Mozart was a great composer.'], ['audience', 'khán giả', '/ˈɔːdiəns/', 'noun', 'The audience clapped loudly.'], ['perform', 'biểu diễn', '/pəˈfɔːm/', 'verb', 'They perform every Friday.'], ['talent', 'tài năng', '/ˈtælənt/', 'noun', 'She has a talent for singing.']] },
  { id: 'd-hoa', title: 'Hóa 10 – Nguyên tố và kí hiệu', description: '20 nguyên tố đầu bảng tuần hoàn.', visibility: 'PUBLIC', deckType: 'FLASHCARD', subject: 'Hóa học', tags: 'Hóa học,Lớp 10', ownerId: 'u-t3', createdAt: day(-22), viewsCount: 530, savesCount: 77, learnerCount: 120, averageRating: 4.7, ratingCount: 30,
    cards: [['H', 'Hydrogen (Z = 1)'], ['He', 'Helium (Z = 2)'], ['Li', 'Lithium (Z = 3)'], ['C', 'Carbon (Z = 6)'], ['O', 'Oxygen (Z = 8)'], ['Na', 'Sodium (Z = 11)']] },
];

/* ---------- Kho học liệu ---------- */
export const resources: any[] = ([
  ['Giáo án điện tử – Chữ người tử tù', 'SLIDE', '11', 'Ngữ văn', 'u-teacher', 'pptx', 4.2],
  ['Bộ đề ôn giữa kì I Ngữ văn 10 (có đáp án)', 'DOCUMENT', '10', 'Ngữ văn', 'u-teacher', 'pdf', 1.1],
  ['Video: Cách viết đoạn nghị luận 150 chữ', 'VIDEO', '10', 'Ngữ văn', 'u-teacher', 'mp4', 86],
  ['Listening Unit 3 – Music (audio + transcript)', 'AUDIO', '10', 'Tiếng Anh', 'u-t2', 'mp3', 7.4],
  ['Sơ đồ tư duy: Mệnh đề – Tập hợp', 'DOCUMENT', '10', 'Toán', 'u-t3', 'pdf', 0.8],
  ['Đề minh họa tốt nghiệp THPT 2027 – Ngữ văn', 'EXAM', '12', 'Ngữ văn', 'u-teacher', 'pdf', 0.6],
  ['Bảng tuần hoàn rút gọn', 'DOCUMENT', '10', 'Hóa học', 'u-t3', 'pdf', 0.4],
  ['Slide: Thơ Đường luật và cách đọc hiểu', 'SLIDE', '11', 'Ngữ văn', 'u-teacher', 'pptx', 3.6],
] as [string, string, string, string, string, string, number][]).map(([title, resourceType, grade, subject, uploaderId, fileFormat, mb], i) => ({
  id: `r-${i + 1}`, title, resourceType, grade, subject, uploaderId, fileFormat, fileSize: Math.round(mb * 1048576),
  description: `Tài liệu ${subject} lớp ${grade} dùng chung cho tổ bộ môn.`, isPublic: true,
  viewCount: 80 + Math.round(rnd() * 900), likeCount: 5 + Math.round(rnd() * 120), bookmarkCount: Math.round(rnd() * 60),
  createdAt: day(-5 - i * 3), fileName: `${title.slice(0, 24)}.${fileFormat}`,
}));
