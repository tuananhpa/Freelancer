const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

export function filterProducts(products, { query = '', category = 'all' } = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return products.filter(product => {
    const haystack = normalize([product.code, product.name, ...(product.applications || [])].join(' '));
    return (category === 'all' || product.category === category) && terms.every(term => haystack.includes(term));
  });
}

export const getProduct = (products, id) => products.find(product => product.id === id);
