/**
 * CPES AI Chatbot Widget (Floating Assistant)
 * Mô phỏng trợ lý AI kỹ thuật công nghiệp hỗ trợ tư vấn s::can, ATi & giải pháp CPES
 */

document.addEventListener('DOMContentLoaded', () => {
  initChatbot();
});

function initChatbot() {
  // Tạo HTML widget nếu chưa có
  if (!document.querySelector('.chatbot-bubble-btn')) {
    const chatHtml = `
      <button type="button" class="chatbot-bubble-btn" id="chatbotBubbleBtn" aria-label="Mở trợ lý AI CPES">
        <span class="chatbot-badge-ping"></span>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      <div class="chatbot-window" id="chatbotWindow" role="region" aria-label="Hộp thoại trợ lý AI">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">AI</div>
            <div class="chatbot-header-text">
              <h4>Trợ Lý Kỹ Thuật CPES</h4>
              <span>Sẵn sàng hỗ trợ 24/7</span>
            </div>
          </div>
          <button type="button" id="chatbotCloseBtn" style="color: #fff; opacity: 0.8; font-size: 1.4rem; padding: 4px;" aria-label="Đóng">&times;</button>
        </div>

        <div class="chatbot-body" id="chatbotBody">
          <div class="chat-msg bot">
            Xin chào! Tôi là Trợ lý AI của <strong>CPES</strong>. Tôi có thể hỗ trợ bạn tìm hiểu về các dòng cảm biến <strong>s::can</strong>, brochure <strong>ATi</strong> hoặc tư vấn giải pháp quan trắc công nghiệp.
            <div style="margin-top: 6px; font-size: 0.78rem; color: var(--muted); font-style: italic;">
              (Bản demo mockup giao diện — chưa kết nối API backend thật)
            </div>
          </div>

          <div class="chat-suggestions">
            <button type="button" class="chat-chip-btn" data-msg="s::can đo được những thông số nào?">
              💧 s::can đo được những thông số nào?
            </button>
            <button type="button" class="chat-chip-btn" data-msg="Brochure ATi gồm những gì?">
              📖 Xem brochure thiết bị ATi
            </button>
            <button type="button" class="chat-chip-btn" data-msg="Tôi muốn nhận báo giá thiết bị">
              📋 Báo giá thiết bị s::can / ATi
            </button>
            <button type="button" class="chat-chip-btn" data-msg="Thông tin liên hệ công ty CPES">
              📞 Thông tin liên hệ & địa chỉ CPES
            </button>
          </div>
        </div>

        <form class="chatbot-footer" id="chatbotForm">
          <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Nhập câu hỏi kỹ thuật của bạn..." autocomplete="off">
          <button type="submit" class="btn btn-sm btn-primary" style="padding: 0 16px;">Gửi</button>
        </form>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = chatHtml;
    document.body.appendChild(wrapper);
  }

  const bubbleBtn = document.querySelector('#chatbotBubbleBtn');
  const chatWindow = document.querySelector('#chatbotWindow');
  const closeBtn = document.querySelector('#chatbotCloseBtn');
  const chatBody = document.querySelector('#chatbotBody');
  const chatForm = document.querySelector('#chatbotForm');
  const chatInput = document.querySelector('#chatbotInput');

  const toggle = (force) => {
    const isOpen = typeof force === 'boolean' ? force : !chatWindow.classList.contains('is-open');
    chatWindow.classList.toggle('is-open', isOpen);
    if (isOpen) {
      setTimeout(() => chatInput?.focus(), 200);
    }
  };

  bubbleBtn.addEventListener('click', () => toggle());
  closeBtn.addEventListener('click', () => toggle(false));

  // Gắn sự kiện cho các chip gợi ý
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.chat-chip-btn');
    if (chip) {
      const q = chip.dataset.msg;
      handleUserMessage(q);
    }
  });

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUserMessage(text);
  });

  function appendMsg(sender, text) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function handleUserMessage(query) {
    appendMsg('user', query);

    // Hiển thị trạng thái đang nhập
    const typing = document.createElement('div');
    typing.className = 'chat-msg bot';
    typing.innerHTML = '<span style="opacity: 0.6;">Đang xử lý thông tin kỹ thuật...</span>';
    chatBody.appendChild(typing);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typing.remove();
      const reply = generateBotReply(query);
      appendMsg('bot', reply);
    }, 450);
  }

  function generateBotReply(q) {
    const lower = q.toLowerCase();

    if (lower.includes('s::can') || lower.includes('thông số') || lower.includes('đo được')) {
      return `
        Đầu dò và cảm biến <strong>s::can (Badger Meter)</strong> đo được dải thông số rất đa dạng bằng phương pháp quang phổ UV-Vis trực tiếp, không dùng hóa chất:
        <br><br>
        • <strong>Chỉ tiêu hữu cơ:</strong> BOD, COD, TOC, DOC, UV254.<br>
        • <strong>Chất rắn & quang học:</strong> TSS, Độ đục (Turbidity), Độ màu (Color).<br>
        • <strong>Chỉ tiêu dinh dưỡng & hóa học:</strong> Amoni (NH4-N), Nitrat (NO3-N), Nitrit (NO2), Clo tự do/tổng, Clo Dioxit, Ozon, H2O2.<br>
        • <strong>Chỉ tiêu cơ bản:</strong> pH, ORP/Redox, Độ dẫn điện (EC/TDS), Nhiệt độ.
        <br><br>
        👉 Bạn có thể xem lưới sản phẩm tại trang <a href="san-pham.html#scan" style="color:var(--brand);font-weight:700;text-decoration:underline;">Sản phẩm s::can</a>.
      `;
    }

    if (lower.includes('brochure') || lower.includes('ati')) {
      return `
        Tài liệu <strong>Brochure ATi Vietnamese</strong> đã được tích hợp dạng sách lật 3D (11 trang) ngay trên website.
        <br><br>
        Brochure giới thiệu chi tiết các hệ thống phân tích nước và khí hàng đầu của ATi (Mỹ / Anh) như Q46, MetriNet, D12...
        <br><br>
        👉 Bạn có thể xem và tải bản PDF gốc tại tab <a href="san-pham.html#ati" style="color:var(--brand);font-weight:700;text-decoration:underline;">Brochure ATi</a>.
      `;
    }

    if (lower.includes('báo giá') || lower.includes('giá') || lower.includes('chi phí')) {
      return `
        Để nhận bảng báo giá chính thức kèm cấu hình kỹ thuật chi tiết theo đúng nhu cầu dự án, bạn có thể gửi yêu cầu nhanh:
        <br><br>
        <button type="button" class="btn btn-sm btn-primary" onclick="openQuoteModal('Tư vấn giải pháp tổng thể')" style="margin-top:4px;">
          Mở form yêu cầu báo giá
        </button>
        <br><br>
        Hoặc gửi email trực tiếp tới <strong>Sales@cpes.vn</strong> / Hotline <strong>(+84) 942 537 025</strong>.
      `;
    }

    if (lower.includes('liên hệ') || lower.includes('địa chỉ') || lower.includes('công ty')) {
      return `
        <strong>CÔNG TY TNHH GIẢI PHÁP CPE (CPES)</strong><br>
        📍 <strong>Địa chỉ:</strong> 490 Phạm Thái Bường, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh<br>
        📞 <strong>Hotline:</strong> (+84) 942 537 025<br>
        ✉️ <strong>Email:</strong> Sales@cpes.vn<br>
        🌐 <strong>Website:</strong> cpes.vn
      `;
    }

    if (lower.includes('nước thải') || lower.includes('nước cấp') || lower.includes('giải pháp')) {
      return `
        CPES chuyên cung cấp 2 nhóm giải pháp quan trắc nước trọng tâm:
        <br><br>
        1. <strong>Quan trắc nước thải tự động liên tục</strong> theo chuẩn Thông tư 10/2021/TT-BTNMT, kết nối truyền dữ liệu về Sở TN&MT.<br>
        2. <strong>Giám sát chất lượng nước cấp & nước uống an toàn</strong> theo chuẩn QCVN 01-1:2018/BYT.
        <br><br>
        👉 Xem chi tiết tại trang <a href="giai-phap.html" style="color:var(--brand);font-weight:700;text-decoration:underline;">Giải pháp CPES</a>.
      `;
    }

    // Default reply
    return `
      Cảm ơn bạn đã đặt câu hỏi. Đội ngũ chuyên gia kỹ thuật của CPES sẽ sẵn sàng tư vấn chi tiết về thiết bị và giải pháp công nghiệp cho bạn.
      <br><br>
      Bạn có muốn chúng tôi liên hệ hỗ trợ trực tiếp qua điện thoại hoặc gửi tài liệu kỹ thuật qua email không?
      <br><br>
      <button type="button" class="btn btn-sm btn-ghost" onclick="openQuoteModal('Hỗ trợ tư vấn kỹ thuật')" style="font-size:0.85rem;">
        Để lại thông tin tư vấn
      </button>
    `;
  }
}

window.initChatbot = initChatbot;
