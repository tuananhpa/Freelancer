export const site = {
  name: 'Tên nhóm',
  description: 'Nhóm freelance thiết kế và phát triển website, web app. Khám phá dự án, dịch vụ và trao đổi ý tưởng của bạn.',
  email: '', zalo: '', facebook: '', booking: '',
  sampleContent: true,
};

export const projects = [
  {
    slug: 'lanh-house', title: 'Lành House', subtitle: 'Website bán hàng', category: 'Website', kind: 'Dự án mẫu', status: 'published', featured: true,
    description: 'Một cửa hàng gốm và đồ dùng cho những không gian sống giản dị. Giao diện nhẹ nhàng, tập trung vào sản phẩm và trải nghiệm mua sắm.',
    preview: 'store', color: 'sage', duration: 'Chưa cung cấp', tech: ['HTML', 'CSS', 'JavaScript'],
    problem: 'Giúp người mua khám phá sản phẩm và tìm đúng món đồ cho không gian sống mà không bị phân tán bởi quá nhiều thông tin.',
    solution: 'Danh mục rõ ràng, hình ảnh lớn và trải nghiệm nhất quán từ danh sách đến chi tiết sản phẩm trên mọi thiết bị.',
    scope: ['Thiết kế giao diện desktop và mobile', 'Xây dựng trang sản phẩm và danh mục', 'Chuẩn bị cấu trúc kết nối giỏ hàng và thanh toán'],
    roles: ['UI/UX — Thiết kế trải nghiệm', 'Frontend — Phát triển giao diện'], members: [], images: [], video: '', live: '', github: '',
  },
  {
    slug: 'glow-booking', title: 'Glow', subtitle: 'Ứng dụng đặt lịch', category: 'App', kind: 'Dự án mẫu', status: 'published', featured: true,
    description: 'Tìm dịch vụ, chọn chuyên viên và đặt lịch trong một trải nghiệm gọn gàng. Ưu tiên thao tác nhanh trên điện thoại.',
    preview: 'booking', color: 'blue', duration: 'Chưa cung cấp', tech: ['UI/UX', 'Design system', 'Prototype'],
    problem: 'Người dùng cần xem dịch vụ, thời gian còn trống và giá trước khi quyết định đặt lịch.',
    solution: 'Luồng chọn dịch vụ, ngày giờ và kiểm tra thông tin được chia thành các bước đơn giản, dễ hiểu.',
    scope: ['Khảo sát luồng đặt lịch', 'Thiết kế giao diện ứng dụng', 'Prototype và hệ thống thành phần'],
    roles: ['UI/UX — Luồng sử dụng và giao diện'], members: [], images: [], video: '', live: '', github: '',
  },
  {
    slug: 'workflow', title: 'WorkFlow', subtitle: 'Nền tảng quản lý', category: 'UI/UX', kind: 'Dự án mẫu', status: 'published', featured: true,
    description: 'Không gian quản lý công việc với thông tin trực quan. Giúp nhóm nhìn thấy ưu tiên và phối hợp trên cùng một giao diện.',
    preview: 'dashboard', color: 'lilac', duration: 'Chưa cung cấp', tech: ['UI/UX', 'Web app', 'Design system'],
    problem: 'Thông tin công việc phân tán khiến các thành viên khó nắm được việc cần làm và trách nhiệm của mình.',
    solution: 'Tổng quan có thứ tự ưu tiên, trạng thái công việc rõ ràng và danh sách dự án có thể xem nhanh.',
    scope: ['Thiết kế dashboard', 'Thiết kế luồng quản lý công việc', 'Hệ thống giao diện và trạng thái'],
    roles: ['UI/UX — Thiết kế sản phẩm', 'Frontend — Giao diện web app'], members: [], images: [], video: '', live: '', github: '',
  },
];

export const services = [
  {icon:'globe',title:'Website',description:'Website giới thiệu, portfolio và bán hàng. Thiết kế để khách hiểu bạn và tìm được điều họ cần.',deliverables:['Giao diện responsive','Các trang theo phạm vi thống nhất','Tối ưu ảnh và metadata','Mã nguồn và hướng dẫn bàn giao']},
  {icon:'layers',title:'Web app',description:'Ứng dụng web phục vụ công việc của bạn. Từ luồng nghiệp vụ đến giao diện dễ sử dụng.',deliverables:['Phân tích luồng sử dụng','Giao diện và trạng thái dữ liệu','Cấu trúc tích hợp API','Tài liệu vận hành và bảo trì']},
  {icon:'pen',title:'UI/UX',description:'Thiết kế giao diện trực quan, nhất quán. Cân bằng cá tính thương hiệu và nhu cầu người dùng.',deliverables:['Luồng người dùng và wireframe','Thiết kế màn hình desktop/mobile','Design system phù hợp','Prototype và tài nguyên thiết kế']},
];
export const process = [
  {title:'Trao đổi',description:'Lắng nghe nhu cầu, làm rõ mục tiêu và phạm vi dự án.'},
  {title:'Thiết kế',description:'Đề xuất giải pháp và chốt giao diện cùng bạn.'},
  {title:'Phát triển',description:'Xây dựng sản phẩm, kiểm tra các luồng sử dụng.'},
  {title:'Bàn giao',description:'Hướng dẫn sử dụng và thống nhất hỗ trợ sau dự án.'},
];
export const faqs = [
  ['Dự án được báo giá như thế nào?', 'Báo giá dựa trên phạm vi, số lượng màn hình, tính năng và thời hạn. Sau khi làm rõ nhu cầu, hai bên sẽ thống nhất hạng mục và chi phí trước khi bắt đầu.'],
  ['Tôi có thể chỉnh sửa thiết kế không?', 'Các vòng chỉnh sửa và thời điểm chốt thiết kế được thống nhất trong phạm vi dự án. Yêu cầu phát sinh sẽ được trao đổi riêng về chi phí và thời gian.'],
  ['Khi bàn giao tôi nhận được những gì?', 'Tài nguyên, mã nguồn và hướng dẫn sử dụng thuộc phạm vi đã thỏa thuận. Quyền sở hữu, quyền sử dụng và tài khoản dịch vụ được ghi rõ trước khi triển khai.'],
  ['Nhóm có bảo trì sau bàn giao không?', 'Gói hỗ trợ, thời gian bảo hành và các công việc bảo trì được thống nhất theo từng dự án. Bạn có thể đề nghị báo giá bảo trì cùng với báo giá phát triển.'],
];
