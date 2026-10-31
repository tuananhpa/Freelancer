"""Sinh assets/js/data.js từ thông tin look + kích thước ảnh (scratch/img-meta.json).
Mô tả chỉ tả những gì nhìn thấy trên ảnh. Không có giá, chất liệu, số liệu.
Chạy: python tools/build_data.py (từ thư mục harmay-mockup), sau process_images.py
"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, 'scratch', 'img-meta.json')))

NICHES = [
    dict(id='dam-cong-so', name='Đầm công sở', short='Công sở', note='Dáng ôm, đường cắt gọn, đi làm cả ngày.', photo='00', cut='09'),
    dict(id='dam-du-tiec', name='Đầm dự tiệc', short='Dự tiệc', note='Tay bồng, đuôi cá, ánh nhũ cho buổi tối.', photo='04', cut='12'),
    dict(id='set-chan-vay', name='Set & chân váy', short='Set & chân váy', note='Áo và chân váy phối theo màu, mặc rời hoặc đi cặp.', photo='14', cut='06'),
    dict(id='ao-dai', name='Áo dài', short='Áo dài', note='Áo dài cách tân, hoa vẽ trên nền sáng.', photo='15', cut='16'),
]

# tint = màu nền chương rút từ chính bộ đầm; ink = màu chữ trên nền đó
COLLECTIONS = [
    dict(id='rouge', code='ROUGE', name='Đỏ son', tint='#E7B2A8', ink='#9E1B17', accent='#C9241F', dark=False,
         tag='Đỏ son, cam đất', blurb='Đỏ son và cam đất, tay bồng và đuôi cá. Màu đi trước, dáng đi sau.', hero='04', looks=['04', '12', '10']),
    dict(id='creme', code='CREME', name='Kem nắng', tint='#E6D6BD', ink='#4A3A26', accent='#B58A4B', dark=False,
         tag='Kem, be, vàng nhạt', blurb='Kem, be và vàng nhạt. Dáng mềm, tay phồng, ánh nhũ rất nhẹ.', hero='03', looks=['03', '02', '05', '08', '11', '14']),
    dict(id='noir', code='NOIR', name='Mực & tuyết', tint='#17171A', ink='#F1EFEA', accent='#C9241F', dark=True,
         tag='Đen, trắng, xanh dương', blurb='Đen, trắng và một mảng xanh dương. Đường cắt gọn cho ngày dài ở văn phòng.', hero='00', looks=['00', '01', '17', '09']),
    dict(id='flora', code='FLORA', name='Vườn hoa', tint='#BCD6D1', ink='#175C5F', accent='#1F7A7C', dark=False,
         tag='Họa tiết hoa, xanh ngọc, áo dài', blurb='Hoa in và hoa vẽ trên nền xanh ngọc, tím và trắng. Có cả áo dài.', hero='07', looks=['07', '06', '13', '15', '16']),
]

# name, niche, color label, pieces visible on the photo
LOOKS = {
    '00': ('Đầm đen cổ sơ mi tay trắng', 'dam-cong-so', 'Đen, trắng', ['Đầm bút chì thân đen', 'Tay xếp ly màu trắng', 'Nơ ruy băng đen', 'Túi xách trắng']),
    '01': ('Đầm đen cổ sơ mi, góc nghiêng', 'dam-cong-so', 'Đen, trắng', ['Đầm bút chì thân đen', 'Cổ sơ mi trắng', 'Nơ ruy băng đen', 'Túi xách trắng']),
    '02': ('Đầm be cổ xếp ly', 'dam-du-tiec', 'Be', ['Cổ xếp ly bản lớn', 'Tay bồng', 'Chân váy xếp tầng', 'Túi hạt ngọc trai']),
    '03': ('Đầm kem cổ V ôm dáng', 'dam-cong-so', 'Kem vàng', ['Đầm ôm cổ V', 'Hoa cài áo', 'Túi xách vân da']),
    '04': ('Đầm đỏ tay bồng đuôi cá', 'dam-du-tiec', 'Đỏ son', ['Đầm tay bồng', 'Chân váy đuôi cá', 'Thắt lưng đen', 'Túi đen']),
    '05': ('Đầm kem ánh nhũ dáng chữ A', 'dam-du-tiec', 'Kem ánh nhũ', ['Đầm tay bồng ngắn', 'Eo chiết', 'Túi đen', 'Giày nude']),
    '06': ('Áo họa tiết hoa, chân váy xanh ngọc', 'set-chan-vay', 'Xanh ngọc', ['Áo họa tiết hoa tay lỡ', 'Chân váy bút chì xanh ngọc', 'Túi xách kem']),
    '07': ('Đầm voan hoa trắng nền xanh đen', 'dam-du-tiec', 'Xanh đen, hoa trắng', ['Đầm voan tay dài', 'Xẻ tà', 'Túi hạt ngọc trai']),
    '08': ('Áo voan tay bồng, chân váy be', 'set-chan-vay', 'Be', ['Áo voan tay bồng', 'Chân váy bút chì', 'Túi xách trắng']),
    '09': ('Đầm xanh dương xếp ly', 'dam-cong-so', 'Xanh dương nhạt', ['Cổ sơ mi', 'Thân váy xếp ly', 'Túi xách trắng']),
    '10': ('Áo họa tiết, chân váy cam đất', 'set-chan-vay', 'Cam đất', ['Áo họa tiết', 'Khăn quàng cổ', 'Chân váy đuôi cá', 'Túi hồng']),
    '11': ('Đầm kem tay phồng, cận cảnh', 'dam-du-tiec', 'Kem ánh nhũ', ['Tay phồng', 'Eo chiết ly']),
    '12': ('Đầm đỏ đuôi cá, góc lưng', 'dam-du-tiec', 'Đỏ son', ['Đầm tay bồng', 'Thắt lưng đen', 'Túi đen']),
    '13': ('Áo hoa tím, chân váy tím', 'set-chan-vay', 'Tím', ['Áo họa tiết hoa nhỏ', 'Chân váy bút chì tím', 'Túi xách kem']),
    '14': ('Áo be, chân váy bút chì', 'set-chan-vay', 'Be', ['Áo tay bồng', 'Chân váy bút chì', 'Túi trắng']),
    '15': ('Áo dài hoa, quần đỏ', 'ao-dai', 'Trắng, hoa đỏ, quần đỏ', ['Áo dài cổ trụ', 'Hoa vẽ', 'Quần ống rộng đỏ']),
    '16': ('Áo dài hoa, tay lỡ', 'ao-dai', 'Trắng, hoa hồng', ['Áo dài cổ trụ', 'Tay lỡ', 'Hoa vẽ']),
    '17': ('Áo trắng, chân váy kẻ', 'set-chan-vay', 'Trắng, đen kẻ', ['Áo voan trắng', 'Chân váy họa tiết kẻ', 'Túi dây xích']),
}
coll_of = {l: c['id'] for c in COLLECTIONS for l in c['looks']}
out = []
for i in range(18):
    n = f'{i:02d}'
    name, niche, color, pieces = LOOKS[n]
    m = meta[n]
    d = dict(id=n, no=n, name=name, niche=niche, collection=coll_of[n], color=color, pieces=pieces)
    d['cut'] = f"assets/img/cut/look-{n}"
    d['cutRatio'] = m['cut']['ratio']
    if 'photo' in m:
        d['photo'] = f"assets/img/photo/look-{n}"
        d['photoRatio'] = m['photo']['ratio']
    out.append(d)

js = """/* Dữ liệu bộ sưu tập / look / ngách. Sinh bởi tools/build_data.py. Sửa tên ở đây.
   Mọi tên bộ sưu tập là tên tạm: [[CẦN XÁC NHẬN]]. Không có giá, chất liệu, số liệu. */
window.HARMAY_DATA = %s;
""" % json.dumps(dict(niches=NICHES, collections=COLLECTIONS, looks=out), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, 'assets', 'js', 'data.js'), 'w', encoding='utf8').write(js)
print('ok', len(out))
