"""Dựng video Lookbook chuyển động từ ảnh của khách (tách nền đặt trên nền thương hiệu, chuyển cảnh mượt mà, KHÔNG rung giật).
Xuất assets/video/hero-alt-desktop.mp4 (1920x1080) và hero-alt-mobile.mp4 (720x1280).
"""
import os, subprocess
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(ROOT, 'scratch', 'alt_slides')
os.makedirs(TMP, exist_ok=True)

slides = [
    ('04', '#E7B2A8', '#161413', 'ROUGE'),
    ('00', '#141416', '#F1EFEA', 'NOIR'),
    ('03', '#E6D6BD', '#181614', 'CREME'),
    ('07', '#BCD6D1', '#141A19', 'FLORA'),
]

for idx, (no, bg, ink, word) in enumerate(slides):
    for mode, (W, H) in [('d', (1920, 1080)), ('m', (720, 1280))]:
        im = Image.new('RGB', (W, H), bg)
        cut_path = os.path.join(ROOT, 'assets', 'img', 'cut', f'look-{no}-1800.webp')
        if not os.path.exists(cut_path):
            cut_path = os.path.join(ROOT, 'assets', 'img', 'cut', f'look-{no}-1100.webp')
        cut = Image.open(cut_path).convert('RGBA')
        th = int(H * (0.94 if mode == 'd' else 0.86))
        tw = int(cut.width * th / cut.height)
        cut = cut.resize((tw, th), Image.LANCZOS)
        im.paste(cut, ((W - tw) // 2, H - th), cut)
        im.save(os.path.join(TMP, f'{mode}-{idx}.jpg'), quality=95)

for mode, out, (W, H) in [('d', 'hero-alt-desktop.mp4', (1920, 1080)), ('m', 'hero-alt-mobile.mp4', (720, 1280))]:
    ins = []
    for i in range(4):
        ins += ['-loop', '1', '-t', '4', '-i', os.path.join(TMP, f'{mode}-{i}.jpg')]
    ins += ['-loop', '1', '-t', '1', '-i', os.path.join(TMP, f'{mode}-0.jpg')]
    # Chuyển cảnh fade mượt mà 0.8s, tuyệt đối không zoompan integer giật khung hình
    parts = [f'[{i}:v]scale={W}:{H},fps=24,format=yuv420p[v{i}]' for i in range(5)]
    parts += [
        '[v0][v1]xfade=transition=fade:duration=0.8:offset=3.2[x1]',
        '[x1][v2]xfade=transition=fade:duration=0.8:offset=6.4[x2]',
        '[x2][v3]xfade=transition=fade:duration=0.8:offset=9.6[x3]',
        '[x3][v4]xfade=transition=fade:duration=0.8:offset=12.8,trim=0:12.8,setpts=PTS-STARTPTS[out]',
    ]
    cmd = ['ffmpeg', '-loglevel', 'error', '-y', *ins, '-filter_complex', ';'.join(parts), '-map', '[out]',
           '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
           os.path.join(ROOT, 'assets', 'video', out)]
    subprocess.run(cmd, check=True)
    print('built smooth video:', out)
