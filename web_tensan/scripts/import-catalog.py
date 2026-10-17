"""Import the remaining public WooCommerce catalog, without prices/cart data."""
import concurrent.futures
import html
import json
import pathlib
import re
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
items = json.loads((ROOT / 'docs/catalog-source.json').read_text(encoding='utf-8'))
existing = {'keo-tan-nhiet-ts1001', 'keo-tan-nhiet-ts1009', 'keo-silicone-tan-nhiet-ts5505', 'keo-2-thanh-phan-ab-ts8833', 'kem-han-ts501', 'kem-han-ts505', 'keo-do-giu-chan-linh-kien-4109a', 'keo-bao-ve-bo-mach-keo-chong-am-keo-cach-dien-keo-dan-linh-kien-ts704'}

def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower()) if not unicodedata.combining(c)).replace('đ', 'd')

def convert(item):
    name = ' '.join(html.unescape(item['name']).split())
    terms = normalize(name + ' ' + ' '.join(c['name'] for c in item['categories']))
    if 'silicone' in terms or 'silicon' in terms:
        category, label, applications = 'silicone', 'Keo silicone', ['Điện tử', 'Đèn LED']
    elif 'tan nhiet' in terms:
        category, label, applications = 'tan-nhiet', 'Vật liệu tản nhiệt', ['Điện tử', 'Đèn LED', 'Nguồn điện']
    elif any(word in terms for word in ['kem han', 'kem thiec', 'keo do', 'smt', 'keo uv']):
        category, label, applications = 'smt', 'Vật liệu SMT', ['Lắp ráp SMT', 'Điện tử']
    else:
        category, label, applications = 'keo-cong-nghiep', 'Keo công nghiệp', ['Điện tử', 'Nguồn điện']
    match = re.search(r'\b(?:TS\s?-?\d+[A-Z]?|T-?\d+|4109A|SM-?\d+|1603)\b', name, re.I)
    code = match[0].upper().replace(' ', '') if match else name.split()[-1].upper()
    remote = item['images'][0]
    sizes = []
    for segment in remote.get('srcset', '').split(','):
        parts = segment.strip().split()
        if len(parts) == 2 and parts[1].endswith('w'):
            sizes.append((abs(int(parts[1][:-1]) - 600), parts[0]))
    image_url = min(sizes)[1] if sizes else remote['src']
    suffix = pathlib.Path(image_url.split('?')[0]).suffix
    filename = f"catalog-{item['id']}{suffix}"
    request = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        data = response.read()
    assert len(data) > 500, filename
    (ROOT / 'public/assets' / filename).write_bytes(data)
    return {'id': item['slug'], 'code': code, 'name': name, 'category': category, 'image': filename,
            'applications': applications, 'summary': f'{label} phục vụ nhu cầu sản xuất và lắp ráp điện tử.',
            'details': 'Sản phẩm trong danh mục Tensan Việt Nam. Vui lòng liên hệ đội ngũ kỹ thuật để xác nhận thông số, quy cách, điều kiện sử dụng và lựa chọn theo ứng dụng thực tế.',
            'specs': [['Nhóm sản phẩm', label]], 'source': item['permalink'], 'imageSource': image_url}

remaining = [p for p in items if p['slug'] not in existing]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    records = list(pool.map(convert, remaining))
(ROOT / 'src/catalog-imported.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
assert len({p['id'] for p in records}) == len(records)
print('Imported', len(records), 'additional products; public catalog total:', len(items))
