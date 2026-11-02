import os, time, hashlib, urllib.request

cloud = 'dlw6jmsyf'
key = '345882647239966'
secret = 'otltJttDEOtTd3eRvV3IxbcCKaY'

for fname, public_id in [
    ('assets/video/hero-alt-desktop.mp4', 'harmony-studio/video/hero-alt-desktop'),
    ('assets/video/hero-alt-mobile.mp4', 'harmony-studio/video/hero-alt-mobile')
]:
    ts = str(int(time.time()))
    s = f'overwrite=true&public_id={public_id}&timestamp={ts}{secret}'
    sig = hashlib.sha1(s.encode('utf-8')).hexdigest()
    
    boundary = '----WebKitFormBoundary' + hashlib.md5(ts.encode()).hexdigest()
    body = bytearray()
    
    def add_field(name, val):
        body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode('utf-8'))
        
    add_field('api_key', key)
    add_field('timestamp', ts)
    add_field('public_id', public_id)
    add_field('overwrite', 'true')
    add_field('signature', sig)
    
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{os.path.basename(fname)}"\r\nContent-Type: video/mp4\r\n\r\n'.encode('utf-8'))
    with open(fname, 'rb') as f:
        body.extend(f.read())
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))
    
    req = urllib.request.Request(
        f'https://api.cloudinary.com/v1_1/{cloud}/video/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req) as resp:
        print(f'Uploaded {fname} to Cloudinary ({resp.status})')
