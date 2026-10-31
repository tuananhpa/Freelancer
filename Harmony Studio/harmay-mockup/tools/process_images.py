"""Xử lý ảnh khách cung cấp -> WebP.
- cut/: người mẫu tách nền (rembg birefnet-general-lite), cắt sát viền, KHÔNG vẽ đè/xoá logo.
  Logo ESER nằm ở nền nên bị loại tự nhiên khi tách nền.
- photo/: ảnh gốc có bối cảnh đường phố, chỉ cắt khung để logo ESER nằm ngoài vùng hiển thị.
  Ảnh nào không tránh được logo thì KHÔNG xuất bản photo (chỉ dùng bản tách nền).
Chạy:  python tools/process_images.py   (từ thư mục harmay-mockup)
"""
import glob, os, json
from PIL import Image
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), 'Harmony Studio')
OUT = os.path.join(ROOT, 'assets', 'img')
files = sorted(glob.glob(os.path.join(SRC, 'Pasted*.png')))

# crop an toàn (x0,y0,x1,y1 theo tỉ lệ) để logo ESER nằm ngoài khung. None = không tránh được logo.
SAFE = {0: (0, .148, 1, 1), 4: (0, .152, 1, 1), 5: (0, .152, 1, 1), 14: (0, .158, 1, 1),
        15: (0, 0, 1, 1), 16: (0, 0, 1, 1), 17: (0, 0, 1, 1)}
CUT_H = (1800, 1100, 600)       # chiều cao các cỡ ảnh tách nền
PHOTO_W = (1365, 800, 400)      # chiều rộng các cỡ ảnh gốc đã crop

os.makedirs(os.path.join(OUT, 'cut'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'photo'), exist_ok=True)
meta = {}
for i, f in enumerate(files):
    nn = f'{i:02d}'
    m = {}
    cut_path = os.path.join(ROOT, 'scratch', 'cut', f'cut-{nn}.png')
    if os.path.exists(cut_path):
        im = Image.open(cut_path).convert('RGBA')
        a = np.array(im)[:, :, 3]
        ys, xs = np.where(a > 12)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        pad = int(0.012 * im.height)
        box = (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))
        im = im.crop(box)
        w, h = im.size
        m['cut'] = {'ratio': round(w / h, 4), 'sizes': list(CUT_H)}
        for H in CUT_H:
            r = im.resize((max(1, round(w * H / h)), H), Image.LANCZOS) if H < h else im
            r.save(os.path.join(OUT, 'cut', f'look-{nn}-{H}.webp'), 'WEBP', quality=86, alpha_quality=92, method=6)
    if i in SAFE:
        src = Image.open(f).convert('RGB')
        x0, y0, x1, y1 = SAFE[i]
        c = src.crop((int(x0 * src.width), int(y0 * src.height), int(x1 * src.width), int(y1 * src.height)))
        w, h = c.size
        m['photo'] = {'ratio': round(w / h, 4), 'sizes': list(PHOTO_W)}
        for W in PHOTO_W:
            r = c.resize((W, round(h * W / w)), Image.LANCZOS) if W < w else c
            r.save(os.path.join(OUT, 'photo', f'look-{nn}-{W}.webp'), 'WEBP', quality=84, method=6)
    meta[nn] = m
    print(nn, m)
json.dump(meta, open(os.path.join(ROOT, 'scratch', 'img-meta.json'), 'w'), indent=1)
