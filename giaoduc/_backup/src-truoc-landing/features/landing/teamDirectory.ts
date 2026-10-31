import type { LucideIcon } from 'lucide-react';
import {
  BriefcaseBusiness,
  Calculator,
  FlaskConical,
  Languages,
  Leaf,
  PenLine,
  Zap,
} from 'lucide-react';

export type TeamRole =
  | 'LEADER'
  | 'LEADER TRỢ GIẢNG'
  | 'GIÁO VIÊN'
  | 'TRỢ GIẢNG'
  | 'NHÂN VIÊN VĂN PHÒNG';

export type TeamMember = {
  name: string;
  role: TeamRole;
  email?: string;
  avatarUrl?: string;
};

export type TeamInfo = {
  team: string;
  subtitle: string;
  icon: LucideIcon;
  members: TeamMember[];
};

export const TEAM_DIRECTORY: TeamInfo[] = [
  {
    team: 'Team Tiếng Anh',
    subtitle: 'Luyện thi chứng chỉ & chương trình phổ thông',
    icon: Languages,
    members: [
      { name: 'Bùi Đức Hoàng', role: 'LEADER', email: 'hoangbd.eng.uranus@gmail.com' },
      { name: 'Bùi Văn Sáng', role: 'GIÁO VIÊN', email: 'sangbv.eng.uranus@gmail.com' },
      { name: 'Đoàn Quỳnh Thảo Vân', role: 'GIÁO VIÊN', email: 'vandqt.eng.uranus@gmail.com' },
      { name: 'Đỗ Chính Danh', role: 'GIÁO VIÊN', email: 'danhdc.eng.uranus@gmail.com' },
      { name: 'Hồ Hoàng Long', role: 'GIÁO VIÊN', email: 'longhh.eng.uranus@gmail.com' },
      { name: 'Lê Trường Thắng', role: 'GIÁO VIÊN', email: 'thanglt.eng.uranus@gmail.com' },
      { name: 'Lô Đại Dương', role: 'GIÁO VIÊN', email: 'duongld.eng.uranus@gmail.com' },
      { name: 'Nguyễn Nhật Tân', role: 'GIÁO VIÊN', email: 'tannn.eng.uranus@gmail.com' },
      { name: 'Nguyễn Thị Huyền Trang', role: 'GIÁO VIÊN', email: 'trangnth.eng.uranus@gmail.com' },
      { name: 'Nguyễn Thị Thuý Vy', role: 'GIÁO VIÊN', email: 'Vyntt.eng.uranus@gmail.com' },
      { name: 'Nguyễn Thị Tuyết Trâm', role: 'GIÁO VIÊN', email: 'tramntt.eng.uranus@gmail.com' },
      { name: 'Trần Minh Khiêm', role: 'GIÁO VIÊN', email: 'khiemtm.eng.ta.uranus@gmail.com' },
      { name: 'Trần Triết Nhân', role: 'GIÁO VIÊN', email: 'ttnhan.eng.uranus@gmail.com' },
      { name: 'Trần Nguyễn Kim Mai', role: 'GIÁO VIÊN', email: 'maitnk.eng.uranus@gmail.com' },
      { name: 'Đặng Hồ Tuấn Cường', role: 'GIÁO VIÊN', email: 'cuongdht.eng.uranus@gmail.com' },
      { name: 'Nguyễn An Hà Trâm', role: 'GIÁO VIÊN', email: 'tramnah.eng.uranus@gmail.com' },
      { name: 'Đào Minh Quân', role: 'TRỢ GIẢNG', email: 'quandm.eng.ta.uranus@gmail.com' },
      { name: 'Hoàng Minh Thông', role: 'TRỢ GIẢNG', email: 'thonghm.eng.ta.uranus@gmail.com' },
      { name: 'Ngô Trung Tấn', role: 'TRỢ GIẢNG', email: 'tannt.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Minh Quang', role: 'TRỢ GIẢNG', email: 'quangnm.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Ngọc Như Ý', role: 'TRỢ GIẢNG', email: 'ynnn.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Phan Như Ngọc', role: 'TRỢ GIẢNG', email: 'ngocnpn.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Quang Huy', role: 'TRỢ GIẢNG', email: 'huynq.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Thị Hồng Nhung', role: 'TRỢ GIẢNG', email: 'nhungnth.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Thiện Phú', role: 'TRỢ GIẢNG', email: 'phunt.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Tiến Đạt', role: 'TRỢ GIẢNG', email: 'datnt.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Viết Hoàng Long', role: 'TRỢ GIẢNG', email: 'longnvh.english.ta.uranus@gmail.com' },
      { name: 'Phan Anh Thịnh', role: 'TRỢ GIẢNG', email: 'thinhpa.eng.ta.uranus@gmail.com' },
      { name: 'Phan Huỳnh Hiền Trang', role: 'TRỢ GIẢNG', email: 'trangphh.eng.ta.uranus@gmail.com' },
      { name: 'Phan Tuấn Khang', role: 'TRỢ GIẢNG', email: 'khangpt.eng.ta.uranus@gmail.com' },
      { name: 'Trần Thúy Ngân', role: 'TRỢ GIẢNG', email: 'ngantt.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Hữu Thắng', role: 'TRỢ GIẢNG', email: 'thangnh.english.ta.uranus@gmail.com' },
      { name: 'Nguyễn Hoàng Khải', role: 'TRỢ GIẢNG', email: 'khainh.english.ta.uranus@gmail.com' },
      { name: 'Nguyễn Ngô Bảo Phúc', role: 'TRỢ GIẢNG', email: 'phucnnb.eng.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team Toán',
    subtitle: 'Nền tảng học thuật & luyện tập tư duy',
    icon: Calculator,
    members: [
      { name: 'Hoàng Anh', role: 'GIÁO VIÊN', email: 'anhh.math.uranus@gmail.com' },
      { name: 'Hứa Nhựt Tuấn', role: 'GIÁO VIÊN', email: 'tuanhn.math.ta.uranus@gmail.com' },
      { name: 'Nguyễn Hồng Thảo Nhi', role: 'GIÁO VIÊN', email: 'nhinht.math.uranus@gmail.com' },
      { name: 'Nguyễn Thị Thu Huyền', role: 'GIÁO VIÊN', email: 'huyenntt.math.ta.uranus@gmail.com' },
      { name: 'Phan Thiện Vỹ', role: 'GIÁO VIÊN', email: 'vypt.math.uranus@gmail.com' },
      { name: 'Trần Hoàng Gia Bảo', role: 'GIÁO VIÊN', email: 'baothg.math.ta.uranus@gmail.com' },
      { name: 'Võ Hoàng Phúc Khải', role: 'GIÁO VIÊN', email: 'khaivhp.math.uranus@gmail.com' },
      { name: 'Phạm Hữu Quân', role: 'GIÁO VIÊN', email: 'quanph.math.uranus@gmail.com' },
      { name: 'Nguyễn Hữu An', role: 'GIÁO VIÊN', email: 'annh.math.ta.uranus@gmail.com' },
      { name: 'Nguyễn Trọng Anh Huy', role: 'LEADER TRỢ GIẢNG', email: 'huynta.math.ta.uranus@gmail.com' },
      { name: 'Nguyễn Ngọc Anh Hoàng', role: 'TRỢ GIẢNG', email: 'hoangnna.math.ta.uranus@gmail.com' },
      { name: 'Trần Nguyễn Hương Xuân', role: 'TRỢ GIẢNG', email: 'xuantnh.math.ta.uranus@gmail.com' },
      { name: 'Trịnh Lê Thành Đạt', role: 'TRỢ GIẢNG', email: 'dattlt.math.ta.uranus@gmail.com' },
      { name: 'Phùng Hoàng Phúc Khang', role: 'TRỢ GIẢNG', email: 'pkhang.math.ta.uranus@gmail.com' },
      { name: 'Trần Gia Bảo', role: 'TRỢ GIẢNG', email: 'baotg2.math.ta.uranus@gmail.com' },
      { name: 'Võ Bảo Duy', role: 'TRỢ GIẢNG', email: 'vobaoduy.uranus@gmail.com' },
      { name: 'Lê Mạnh Hùng', role: 'TRỢ GIẢNG', email: 'hunglm.math.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team Vật Lý',
    subtitle: 'Lý thuyết trọng tâm & thực hành giải đề',
    icon: Zap,
    members: [
      { name: 'Lê Thị Trúc Anh', role: 'GIÁO VIÊN', email: 'anhltt.physic.uranus@gmail.com' },
      { name: 'Nguyễn Bi Anh', role: 'GIÁO VIÊN', email: 'anhnb.physic.uranus@gmail.com' },
      { name: 'Ngô Trung Hiếu', role: 'GIÁO VIÊN', email: 'hieutn.physic.uranus@gmail.com' },
      { name: 'Phạm Trí Nguyên', role: 'TRỢ GIẢNG', email: 'nguyenpt.physic.ta.uranus@gmail.com' },
      { name: 'Trần Hoàng Anh Khoa', role: 'TRỢ GIẢNG', email: 'khoatha.physic.ta.uranus@gmail.com' },
      { name: 'Phạm Thị Thảo Phương', role: 'TRỢ GIẢNG', email: 'phuongptt.physic.ta.uranus@gmail.com' },
      { name: 'Hoàng Thái Sơn', role: 'TRỢ GIẢNG', email: 'sonht.physic.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team Hóa Học',
    subtitle: 'Kiến thức nền & chuyên đề nâng cao',
    icon: FlaskConical,
    members: [
      { name: 'Lê Vũ Song Toàn', role: 'GIÁO VIÊN', email: 'toanlvs.chemistry.uranus@gmail.com' },
      { name: 'Phạm Tiến Dương', role: 'GIÁO VIÊN', email: 'duongpt.chemistry.uranus@gmail.com' },
      { name: 'Trần Thị Như Phúc', role: 'TRỢ GIẢNG', email: 'phucttn.chemistry.ta.uranus@gmail.com' },
      { name: 'Đoàn Lê Duy Lân', role: 'TRỢ GIẢNG', email: 'landld.chemistry.ta.uranus@gmail.com' },
      { name: 'Nguyễn Hữu Vinh', role: 'TRỢ GIẢNG', email: 'vinhnh.chemistry.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team KHTN',
    subtitle: 'Tích hợp kiến thức khoa học tự nhiên',
    icon: Leaf,
    members: [
      { name: 'Lê Huỳnh Đức', role: 'GIÁO VIÊN', email: 'duchl.chemistry.uranus@gmail.com' },
      { name: 'Nguyễn Bảo Phương', role: 'GIÁO VIÊN', email: 'phuongnb.chemistry.uranus@gmail.com' },
      { name: 'Nguyễn Nhất Hoàng Anh', role: 'GIÁO VIÊN', email: 'anhnnh.khtn.uranus@gmail.com' },
      { name: 'Nguyễn Anh Khoa', role: 'LEADER TRỢ GIẢNG', email: 'khoana.physic.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team Ngữ Văn',
    subtitle: 'Tư duy ngôn ngữ & kỹ năng biểu đạt',
    icon: PenLine,
    members: [
      { name: 'Ngô Thị Mỹ Hạnh', role: 'GIÁO VIÊN', email: 'hanhntm.eng.ta.uranus@gmail.com' },
      { name: 'Nguyễn Khiết Đan Vy', role: 'GIÁO VIÊN', email: 'vynkd.eng.ta.uranus@gmail.com' },
    ],
  },
  {
    team: 'Team Văn Phòng',
    subtitle: 'Điều phối vận hành & hỗ trợ học vụ',
    icon: BriefcaseBusiness,
    members: [
      { name: 'Đoàn Thân Hoàng Nguyên', role: 'NHÂN VIÊN VĂN PHÒNG', email: 'nguyendth.math.ta.uranus@gmail.com' },
      { name: 'Nguyễn Hà Gia Huệ', role: 'NHÂN VIÊN VĂN PHÒNG', email: 'huenhg.eng.uranus@gmail.com' },
      { name: 'Nguyễn Hoàng Trường', role: 'NHÂN VIÊN VĂN PHÒNG', email: 'truongnh.eng.uranus@gmail.com' },
      { name: 'Nguyễn Khắc Minh Tuấn', role: 'NHÂN VIÊN VĂN PHÒNG', email: 'tuannkm.eng.ta.uranus@gmail.com' },
      { name: 'Phạm Tuấn Anh', role: 'NHÂN VIÊN VĂN PHÒNG', email: 'anhpt.eng.uranus@gmail.com' },
      { name: 'Cao Thị Yến Vi', role: 'NHÂN VIÊN VĂN PHÒNG' },
    ],
  },
];

export const roleText: Record<TeamRole, string> = {
  LEADER: 'Leader',
  'LEADER TRỢ GIẢNG': 'Leader',
  'GIÁO VIÊN': 'Giáo viên',
  'TRỢ GIẢNG': 'Trợ giảng',
  'NHÂN VIÊN VĂN PHÒNG': 'Văn phòng',
};

export const rolePriority: Record<TeamRole, number> = {
  LEADER: 0,
  'LEADER TRỢ GIẢNG': 1,
  'GIÁO VIÊN': 2,
  'TRỢ GIẢNG': 3,
  'NHÂN VIÊN VĂN PHÒNG': 4,
};

export const isLeaderRole = (role: TeamRole) =>
  role === 'LEADER' || role === 'LEADER TRỢ GIẢNG';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
