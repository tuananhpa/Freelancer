const STEPS = [
  { title: 'Quét bằng Zalo hoặc Camera', text: 'Không cần cài ứng dụng, không bắt đăng nhập. Mã QR động dẫn thẳng tới trang của đúng lô hàng.' },
  { title: 'Xem phim Cinematic 9:16', text: 'Video dọc tự phát (tắt tiếng), giọng thuyết minh di sản, câu chuyện làng nghề và hành trình mùa vụ.' },
  { title: 'Kiểm chứng & đặt mua lại', text: 'Xem chứng nhận OCOP, VietGAP, chỉ dẫn địa lý; gửi tặng bạn bè hoặc nhắn Zalo trực tiếp nhà vườn.' },
];

export default function HowItWorks() {
  return (
    <section className="section section--sand" id="cach-hoat-dong">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">3 giây đầu tiên</span>
          <h2 className="section__title">Từ tem nhãn im lìm thành thuyết minh viên 24/7</h2>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="step">
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
