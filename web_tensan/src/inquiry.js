export function buildInquiryMailto(values) {
  const subject = `Yêu cầu tư vấn Tensan${values.product?.trim() ? ` – ${values.product.trim()}` : ''}`;
  const body = `Kính gửi đội ngũ Tensan,\n\nHọ tên: ${values.name}\nEmail: ${values.email}\nCông ty: ${values.company || 'Chưa cung cấp'}\nĐiện thoại: ${values.phone || 'Chưa cung cấp'}\nSản phẩm quan tâm: ${values.product || 'Cần tư vấn'}\n\nNhu cầu ứng dụng:\n${values.message}\n\nTrân trọng.`;
  return `mailto:contact@tensanvn.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
