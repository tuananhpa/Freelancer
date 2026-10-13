import re, json
from pathlib import Path
s = Path('reference.html').read_text(encoding='utf-8')
urls = re.findall(r'(?:src|data-src)=[\"\x27]([^\"\x27]+)', s)
print('\n'.join(urls[:100]))
Path('reference-assets.json').write_text(json.dumps(urls, ensure_ascii=False), encoding='utf-8')
