import urllib.request, json, concurrent.futures
from pathlib import Path
urls=json.loads(Path('reference-assets.json').read_text(encoding='utf-8'))
selected=[]
for u in urls:
    if '/images/promo/' in u or '/images/thumbnails/180/180/' in u or '/images/thumbnails/60/60/' in u:
        if u not in selected: selected.append(u)
selected=selected[:65]
Path('assets').mkdir(exist_ok=True)
def download(pair):
    i,u=pair
    try:
        if '/thumbnails/60/60/' in u: u=u.replace('/thumbnails/60/60/','/thumbnails/300/300/')
        ext=Path(u.split('?')[0]).suffix
        name=f'assets/ref-{i}{ext}'
        urllib.request.urlretrieve(u,name)
        return {'url':u,'path':'/'+name}
    except Exception as e: return {'url':u,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: result=list(pool.map(download,enumerate(selected)))
Path('assets/map.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
