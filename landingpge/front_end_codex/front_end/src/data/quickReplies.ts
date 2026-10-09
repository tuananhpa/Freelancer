import type { Localized, QuickReply } from "../types/domain";
export const defaultChatGreeting: Localized = {
  vi: "Chào bạn! Bạn muốn tìm hiểu điều gì?",
  en: "Hello! What would you like to discover?",
};
export const defaultQuickReplies: QuickReply[] = [
  {
    id: "about-hytales",
    enabled: true,
    question: { vi: "HYTales là gì?", en: "What is HYTales?" },
    answer: {
      vi: "HYTales kết hợp mã QR, phim nông sản và nhật ký nguồn gốc để biến bao bì thành một hộ chiếu di sản số.",
      en: "HYTales brings together QR codes, produce films and origin records as a digital heritage passport.",
    },
  },
  {
    id: "growers-join",
    enabled: true,
    question: {
      vi: "Nhà vườn có thể tham gia thế nào?",
      en: "How can growers join?",
    },
    answer: {
      vi: "Hãy chọn “Kết nối cùng HYTales” và gửi thông tin nhà vườn hoặc HTX của bạn.",
      en: "Choose “Connect with HYTales” and tell us about your farm or cooperative.",
    },
  },
];
export function validateQuickReplies(items: QuickReply[]) {
  items.forEach((item, i) => {
    if (!item.question.vi.trim() || !item.answer.vi.trim())
      throw new Error(`Câu hỏi ${i + 1} cần có câu hỏi và trả lời tiếng Việt.`);
  });
}
