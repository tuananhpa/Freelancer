export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isTypoGmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  if (!emailLower.includes('@')) return false;
  
  const [, domain] = emailLower.split('@');
  
  // Các trường hợp gõ sai gmail phổ biến
  const typoDomains = [
    'gmai.com',
    'gamil.com',
    'gmail.con',
    'gmail.com.vn',
    'gmal.com',
    'gmail.co',
    'gmail.vn'
  ];
  
  return typoDomains.includes(domain);
};

export const validateEmailSyntax = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Email không được để trống.';
  if (!isValidEmail(email)) return 'Sai định dạng email (ví dụ: ten@gmail.com).';
  if (isTypoGmail(email)) return 'Có vẻ bạn gõ sai đuôi "@gmail.com". Vui lòng kiểm tra lại.';
  return null; // Không có lỗi
};
