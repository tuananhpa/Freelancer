/**
 * CPES Data & API Layer (Mock & Live capable)
 * Quản lý dữ liệu sản phẩm, giải pháp và báo giá trong localStorage
 */

const CPES_STORAGE_KEY_PRODUCTS = 'cpes_products_v2';
const CPES_STORAGE_KEY_SOLUTIONS = 'cpes_solutions_v2';
const CPES_STORAGE_KEY_QUOTES = 'cpes_quote_requests_v2';

const CPES_API = {
  // Tải danh sách sản phẩm (từ localStorage hoặc nạp từ file JSON seed)
  async getProducts() {
    try {
      const cached = localStorage.getItem(CPES_STORAGE_KEY_PRODUCTS);
      if (cached) {
        return JSON.parse(cached);
      }
      const res = await fetch('data/products.json');
      if (!res.ok) throw new Error('Không thể tải file products.json');
      const data = await res.json();
      localStorage.setItem(CPES_STORAGE_KEY_PRODUCTS, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Fallback loading products:', err);
      return [];
    }
  },

  // Tải danh sách giải pháp
  async getSolutions() {
    try {
      const cached = localStorage.getItem(CPES_STORAGE_KEY_SOLUTIONS);
      if (cached) {
        return JSON.parse(cached);
      }
      const res = await fetch('data/solutions.json');
      if (!res.ok) throw new Error('Không thể tải file solutions.json');
      const data = await res.json();
      localStorage.setItem(CPES_STORAGE_KEY_SOLUTIONS, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Fallback loading solutions:', err);
      return [];
    }
  },

  // Lưu danh sách sản phẩm (dành cho Admin CRUD)
  saveProducts(products) {
    localStorage.setItem(CPES_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  },

  // Lưu danh sách giải pháp (dành cho Admin CRUD)
  saveSolutions(solutions) {
    localStorage.setItem(CPES_STORAGE_KEY_SOLUTIONS, JSON.stringify(solutions));
  },

  // Lưu danh sách giỏ hàng / báo giá
  saveQuotes(quotes) {
    localStorage.setItem(CPES_STORAGE_KEY_QUOTES, JSON.stringify(quotes));
  },

  // Đặt lại dữ liệu mẫu gốc từ server
  async resetToSeed() {
    localStorage.removeItem(CPES_STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(CPES_STORAGE_KEY_SOLUTIONS);
    return Promise.all([this.getProducts(), this.getSolutions()]);
  },

  // Gửi yêu cầu báo giá (mock)
  submitQuoteRequest(quoteData) {
    try {
      const quotes = JSON.parse(localStorage.getItem(CPES_STORAGE_KEY_QUOTES) || '[]');
      const newQuote = {
        id: 'REQ-' + Date.now().toString(36).toUpperCase(),
        createdAt: new Date().toISOString(),
        status: 'new',
        ...quoteData
      };
      quotes.unshift(newQuote);
      localStorage.setItem(CPES_STORAGE_KEY_QUOTES, JSON.stringify(quotes));
      return { success: true, quoteId: newQuote.id };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  getQuotes() {
    return JSON.parse(localStorage.getItem(CPES_STORAGE_KEY_QUOTES) || '[]');
  }
};

window.CPES_STORAGE_KEY_PRODUCTS = CPES_STORAGE_KEY_PRODUCTS;
window.CPES_STORAGE_KEY_QUOTES = CPES_STORAGE_KEY_QUOTES;

window.CPES_API = CPES_API;
