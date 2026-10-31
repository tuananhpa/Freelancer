/* Dữ liệu bộ sưu tập / look / ngách. Sinh bởi tools/build_data.py. Sửa tên ở đây.
   Mọi tên bộ sưu tập là tên tạm: [[CẦN XÁC NHẬN]]. Không có giá, chất liệu, số liệu. */
window.HARMONY_DATA = {
 "niches": [
  {
   "id": "dam-cong-so",
   "name": "Đầm công sở",
   "short": "Công sở",
   "note": "Dáng ôm, đường cắt gọn, đi làm cả ngày.",
   "photo": "00",
   "cut": "09"
  },
  {
   "id": "dam-du-tiec",
   "name": "Đầm dự tiệc",
   "short": "Dự tiệc",
   "note": "Tay bồng, đuôi cá, ánh nhũ cho buổi tối.",
   "photo": "04",
   "cut": "12"
  },
  {
   "id": "set-chan-vay",
   "name": "Set & chân váy",
   "short": "Set & chân váy",
   "note": "Áo và chân váy phối theo màu, mặc rời hoặc đi cặp.",
   "photo": "14",
   "cut": "06"
  },
  {
   "id": "ao-dai",
   "name": "Áo dài",
   "short": "Áo dài",
   "note": "Áo dài cách tân, hoa vẽ trên nền sáng.",
   "photo": "15",
   "cut": "16"
  }
 ],
 "collections": [
  {
   "id": "rouge",
   "code": "ROUGE",
   "name": "Đỏ son",
   "tint": "#E7B2A8",
   "ink": "#9E1B17",
   "accent": "#C9241F",
   "dark": false,
   "tag": "Đỏ son, cam đất",
   "blurb": "Đỏ son và cam đất, tay bồng và đuôi cá. Màu đi trước, dáng đi sau.",
   "hero": "04",
   "looks": [
    "04",
    "12",
    "10"
   ]
  },
  {
   "id": "creme",
   "code": "CREME",
   "name": "Kem nắng",
   "tint": "#E6D6BD",
   "ink": "#4A3A26",
   "accent": "#B58A4B",
   "dark": false,
   "tag": "Kem, be, vàng nhạt",
   "blurb": "Kem, be và vàng nhạt. Dáng mềm, tay phồng, ánh nhũ rất nhẹ.",
   "hero": "03",
   "looks": [
    "03",
    "02",
    "05",
    "08",
    "11",
    "14"
   ]
  },
  {
   "id": "noir",
   "code": "NOIR",
   "name": "Mực & tuyết",
   "tint": "#17171A",
   "ink": "#F1EFEA",
   "accent": "#C9241F",
   "dark": true,
   "tag": "Đen, trắng, xanh dương",
   "blurb": "Đen, trắng và một mảng xanh dương. Đường cắt gọn cho ngày dài ở văn phòng.",
   "hero": "00",
   "looks": [
    "00",
    "01",
    "17",
    "09"
   ]
  },
  {
   "id": "flora",
   "code": "FLORA",
   "name": "Vườn hoa",
   "tint": "#BCD6D1",
   "ink": "#175C5F",
   "accent": "#1F7A7C",
   "dark": false,
   "tag": "Họa tiết hoa, xanh ngọc, áo dài",
   "blurb": "Hoa in và hoa vẽ trên nền xanh ngọc, tím và trắng. Có cả áo dài.",
   "hero": "07",
   "looks": [
    "07",
    "06",
    "13",
    "15",
    "16"
   ]
  }
 ],
 "looks": [
  {
   "id": "00",
   "no": "00",
   "name": "Đầm đen cổ sơ mi tay trắng",
   "niche": "dam-cong-so",
   "collection": "noir",
   "color": "Đen, trắng",
   "pieces": [
    "Đầm bút chì thân đen",
    "Tay xếp ly màu trắng",
    "Nơ ruy băng đen",
    "Túi xách trắng"
   ],
   "cut": "assets/img/cut/look-00",
   "cutRatio": 0.289,
   "photo": "assets/img/photo/look-00",
   "photoRatio": 0.7822
  },
  {
   "id": "01",
   "no": "01",
   "name": "Đầm đen cổ sơ mi, góc nghiêng",
   "niche": "dam-cong-so",
   "collection": "noir",
   "color": "Đen, trắng",
   "pieces": [
    "Đầm bút chì thân đen",
    "Cổ sơ mi trắng",
    "Nơ ruy băng đen",
    "Túi xách trắng"
   ],
   "cut": "assets/img/cut/look-01",
   "cutRatio": 0.4334
  },
  {
   "id": "02",
   "no": "02",
   "name": "Đầm be cổ xếp ly",
   "niche": "dam-du-tiec",
   "collection": "creme",
   "color": "Be",
   "pieces": [
    "Cổ xếp ly bản lớn",
    "Tay bồng",
    "Chân váy xếp tầng",
    "Túi hạt ngọc trai"
   ],
   "cut": "assets/img/cut/look-02",
   "cutRatio": 0.4457
  },
  {
   "id": "03",
   "no": "03",
   "name": "Đầm kem cổ V ôm dáng",
   "niche": "dam-cong-so",
   "collection": "creme",
   "color": "Kem vàng",
   "pieces": [
    "Đầm ôm cổ V",
    "Hoa cài áo",
    "Túi xách vân da"
   ],
   "cut": "assets/img/cut/look-03",
   "cutRatio": 0.3977
  },
  {
   "id": "04",
   "no": "04",
   "name": "Đầm đỏ tay bồng đuôi cá",
   "niche": "dam-du-tiec",
   "collection": "rouge",
   "color": "Đỏ son",
   "pieces": [
    "Đầm tay bồng",
    "Chân váy đuôi cá",
    "Thắt lưng đen",
    "Túi đen"
   ],
   "cut": "assets/img/cut/look-04",
   "cutRatio": 0.4395,
   "photo": "assets/img/photo/look-04",
   "photoRatio": 0.7858
  },
  {
   "id": "05",
   "no": "05",
   "name": "Đầm kem ánh nhũ dáng chữ A",
   "niche": "dam-du-tiec",
   "collection": "creme",
   "color": "Kem ánh nhũ",
   "pieces": [
    "Đầm tay bồng ngắn",
    "Eo chiết",
    "Túi đen",
    "Giày nude"
   ],
   "cut": "assets/img/cut/look-05",
   "cutRatio": 0.3732,
   "photo": "assets/img/photo/look-05",
   "photoRatio": 0.7858
  },
  {
   "id": "06",
   "no": "06",
   "name": "Áo họa tiết hoa, chân váy xanh ngọc",
   "niche": "set-chan-vay",
   "collection": "flora",
   "color": "Xanh ngọc",
   "pieces": [
    "Áo họa tiết hoa tay lỡ",
    "Chân váy bút chì xanh ngọc",
    "Túi xách kem"
   ],
   "cut": "assets/img/cut/look-06",
   "cutRatio": 0.4599
  },
  {
   "id": "07",
   "no": "07",
   "name": "Đầm voan hoa trắng nền xanh đen",
   "niche": "dam-du-tiec",
   "collection": "flora",
   "color": "Xanh đen, hoa trắng",
   "pieces": [
    "Đầm voan tay dài",
    "Xẻ tà",
    "Túi hạt ngọc trai"
   ],
   "cut": "assets/img/cut/look-07",
   "cutRatio": 0.4835
  },
  {
   "id": "08",
   "no": "08",
   "name": "Áo voan tay bồng, chân váy be",
   "niche": "set-chan-vay",
   "collection": "creme",
   "color": "Be",
   "pieces": [
    "Áo voan tay bồng",
    "Chân váy bút chì",
    "Túi xách trắng"
   ],
   "cut": "assets/img/cut/look-08",
   "cutRatio": 0.5051
  },
  {
   "id": "09",
   "no": "09",
   "name": "Đầm xanh dương xếp ly",
   "niche": "dam-cong-so",
   "collection": "noir",
   "color": "Xanh dương nhạt",
   "pieces": [
    "Cổ sơ mi",
    "Thân váy xếp ly",
    "Túi xách trắng"
   ],
   "cut": "assets/img/cut/look-09",
   "cutRatio": 0.3986
  },
  {
   "id": "10",
   "no": "10",
   "name": "Áo họa tiết, chân váy cam đất",
   "niche": "set-chan-vay",
   "collection": "rouge",
   "color": "Cam đất",
   "pieces": [
    "Áo họa tiết",
    "Khăn quàng cổ",
    "Chân váy đuôi cá",
    "Túi hồng"
   ],
   "cut": "assets/img/cut/look-10",
   "cutRatio": 0.401
  },
  {
   "id": "11",
   "no": "11",
   "name": "Đầm kem tay phồng, cận cảnh",
   "niche": "dam-du-tiec",
   "collection": "creme",
   "color": "Kem ánh nhũ",
   "pieces": [
    "Tay phồng",
    "Eo chiết ly"
   ],
   "cut": "assets/img/cut/look-11",
   "cutRatio": 0.6839
  },
  {
   "id": "12",
   "no": "12",
   "name": "Đầm đỏ đuôi cá, góc lưng",
   "niche": "dam-du-tiec",
   "collection": "rouge",
   "color": "Đỏ son",
   "pieces": [
    "Đầm tay bồng",
    "Thắt lưng đen",
    "Túi đen"
   ],
   "cut": "assets/img/cut/look-12",
   "cutRatio": 0.4234
  },
  {
   "id": "13",
   "no": "13",
   "name": "Áo hoa tím, chân váy tím",
   "niche": "set-chan-vay",
   "collection": "flora",
   "color": "Tím",
   "pieces": [
    "Áo họa tiết hoa nhỏ",
    "Chân váy bút chì tím",
    "Túi xách kem"
   ],
   "cut": "assets/img/cut/look-13",
   "cutRatio": 0.4075
  },
  {
   "id": "14",
   "no": "14",
   "name": "Áo be, chân váy bút chì",
   "niche": "set-chan-vay",
   "collection": "creme",
   "color": "Be",
   "pieces": [
    "Áo tay bồng",
    "Chân váy bút chì",
    "Túi trắng"
   ],
   "cut": "assets/img/cut/look-14",
   "cutRatio": 0.3167,
   "photo": "assets/img/photo/look-14",
   "photoRatio": 0.7913
  },
  {
   "id": "15",
   "no": "15",
   "name": "Áo dài hoa, quần đỏ",
   "niche": "ao-dai",
   "collection": "flora",
   "color": "Trắng, hoa đỏ, quần đỏ",
   "pieces": [
    "Áo dài cổ trụ",
    "Hoa vẽ",
    "Quần ống rộng đỏ"
   ],
   "cut": "assets/img/cut/look-15",
   "cutRatio": 0.3026,
   "photo": "assets/img/photo/look-15",
   "photoRatio": 0.6489
  },
  {
   "id": "16",
   "no": "16",
   "name": "Áo dài hoa, tay lỡ",
   "niche": "ao-dai",
   "collection": "flora",
   "color": "Trắng, hoa hồng",
   "pieces": [
    "Áo dài cổ trụ",
    "Tay lỡ",
    "Hoa vẽ"
   ],
   "cut": "assets/img/cut/look-16",
   "cutRatio": 0.4526,
   "photo": "assets/img/photo/look-16",
   "photoRatio": 0.7038
  },
  {
   "id": "17",
   "no": "17",
   "name": "Áo trắng, chân váy kẻ",
   "niche": "set-chan-vay",
   "collection": "noir",
   "color": "Trắng, đen kẻ",
   "pieces": [
    "Áo voan trắng",
    "Chân váy họa tiết kẻ",
    "Túi dây xích"
   ],
   "cut": "assets/img/cut/look-17",
   "cutRatio": 0.606,
   "photo": "assets/img/photo/look-17",
   "photoRatio": 0.6182
  }
 ]
};
