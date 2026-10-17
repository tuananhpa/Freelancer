"""Fetch public Tensan assets and self-hosted fonts; record original sources."""
import concurrent.futures
import html
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'assets'
DEST.mkdir(parents=True, exist_ok=True)
AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

products = {
    'ts1001': 'keo-tan-nhiet-ts1001',
    'ts1009': 'keo-tan-nhiet-ts1009',
    'ts5505': 'keo-silicone-tan-nhiet-ts5505',
    'ts8833': 'keo-2-thanh-phan-ab-ts8833',
    'ts501': 'kem-han-ts501',
    'ts505': 'kem-han-ts505',
    '4109a': 'keo-do-giu-chan-linh-kien-4109a',
    'ts704': 'keo-bao-ve-bo-mach-keo-chong-am-keo-cach-dien-keo-dan-linh-kien-ts704',
}

def product_asset(item):
    key, slug = item
    page = 'https://tensanvn.com/' + slug + '/'
    source = fetch(page).decode('utf-8')
    tags = re.findall(r'<meta\b[^>]*>', source)
    tag = next(t for t in tags if 'property="og:image"' in t)
    url = html.unescape(re.search(r'content="([^"]+)"', tag)[1])
    suffix = pathlib.Path(url.split('?')[0]).suffix
    name = key + suffix
    data = fetch(url)
    assert len(data) > 500, 'Empty product image: ' + key
    (DEST / name).write_bytes(data)
    return {'id': key, 'file': '/assets/' + name, 'page': page, 'source': url}

records = []
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for record in pool.map(product_asset, products.items()):
        records.append(record)
        print(record['id'], record['file'])

direct = {
    'logo.png': 'https://tensanvn.com/wp-content/uploads/2024/07/logo-tensanvn.png',
    'logo-white.png': 'https://tensanvn.com/wp-content/uploads/2024/07/logo-tensan-white.png',
    'company.jpg': 'https://tensanvn.com/wp-content/uploads/2024/07/20200427140414195911-1536x584.jpg',
    'production.png': 'https://tensanvn.com/wp-content/uploads/2026/07/a753472c-d74f-410a-b3a1-5e78055b3099-1024x682.png',
    'laboratory.png': 'https://tensanvn.com/wp-content/uploads/2026/07/0e48fd25-57ae-4634-8011-1c5e5bba2e4b-1024x682.png',
}
for name, url in direct.items():
    try:
        (DEST / name).write_bytes(fetch(url))
        records.append({'file': '/assets/' + name, 'source': url, 'page': 'https://tensanvn.com/gioi-thieu/'})
        print(name)
    except Exception as error:
        print('Asset failed:', name, str(error))

css = fetch('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap').decode()
font_css = []
for index, block in enumerate(re.findall(r'@font-face\s*\{[^}]+\}', css)):
    remote = re.search(r'url\(([^)]+)\)', block)[1]
    name = 'be-vietnam-' + str(index) + '.woff2'
    (DEST / name).write_bytes(fetch(remote))
    font_css.append(block.replace(remote, '/assets/' + name))
(ROOT / 'src' / 'fonts.css').write_text('\n'.join(font_css), encoding='utf-8')
(ROOT / 'docs' / 'ASSET_SOURCES.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
assert len(records) >= len(products)
print('Saved', len(records), 'assets and', len(font_css), 'font subsets')
