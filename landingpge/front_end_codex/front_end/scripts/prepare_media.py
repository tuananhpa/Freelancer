"""Read original HYTales assets; write optimized previews only inside this frontend."""
from pathlib import Path
from PIL import Image
import subprocess

root = Path(__file__).resolve().parents[1]
source = root.parents[1] / 'HYTales'
out = root / 'public' / 'media'
out.mkdir(parents=True, exist_ok=True)
mapping = [('nhan-long','nhanlong.jpg','NHA'),('vai-trung','vaitrung.jpg','VA'),('cam-duong-canh','camduong.jpg','CAM')]
for slug, img, prefix in mapping:
    with Image.open(source / 'image' / img) as im:
        im.convert('RGB').resize((min(im.width,1600),round(im.height*min(im.width,1600)/im.width))).save(out / f'{slug}.webp', 'WEBP', quality=85)
    video = next(p for p in (source / 'Video').iterdir() if p.name.startswith(prefix))
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(video),'-t','30','-vf','scale=-2:720','-c:v','libx264','-preset','fast','-crf','29','-c:a','aac','-b:a','80k','-movflags','+faststart',str(out / f'{slug}.mp4')], check=True)
    for i, timestamp in enumerate([8,16,24]):
        subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(timestamp),'-i',str(video),'-frames:v','1','-vf','scale=-2:900',str(out / f'{slug}-scene-{i+1}.webp')], check=True)
    print(f'Prepared {slug}', flush=True)
