"""Sinh assets/js/data.js từ _raw/img_meta.json (kích thước ảnh) + thông tin album bên dưới."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
meta = json.loads((root / "_raw/img_meta.json").read_text())
# total = số ảnh thật trong thư mục Drive khách gửi (đếm 23/11/2026)
INFO = {
 "1": dict(title="Đạt Phước & Lan Phương", type="Lễ tân hôn", date="27.09.2025", cover=6, total=1340),
 "2": dict(title="Thanh Hoà & Sĩ Học", type="Lễ vu quy", date="", cover=5, total=1181),
 "3": dict(title="Huy Hoàng & Lâm Phương", type="Lễ báo hỷ", date="18.10.2025", cover=7, total=1386),
 "4": dict(title="Lễ đính hôn", type="Lễ đính hôn", date="", cover=6, total=733),
 "5": dict(title="Bách Hợp & Thành Trí", type="Lễ vu quy · Tân hôn", date="29.11.2025", cover=7, total=548),
 "6": dict(title="Vu quy & Thánh lễ", type="Lễ vu quy · Nhà thờ", date="27.12.2025", cover=8, total=1151),
 "7": dict(title="Thanh Thảo & Thanh Nhã", type="Lễ vu quy", date="02.08.2026", cover=13, total=1020),
}
albums = []
for k, info in INFO.items():
    albums.append(dict(id="a" + k, **info, photos=[[n, w, h] for n, w, h in meta["albums"][k]]))
out = "// Sinh bởi tools/build_data.py, đừng sửa tay.\nwindow.ALBUMS = " + json.dumps(albums, ensure_ascii=False) + ";\nwindow.LAYOUTS = " + json.dumps(meta["layouts"]) + ";\n"
(root / "assets/js/data.js").write_text(out, encoding="utf-8")
assert sum(len(a["photos"]) for a in albums) == 112, "thiếu ảnh"
print("ok", len(albums), "albums")
