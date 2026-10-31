#!/usr/bin/env python3
"""
BM Global Spirits – xử lý toàn bộ ảnh sản phẩm.

  python3 scripts/process_images.py --src products --out assets/img/products [--workers 2]

Mỗi ảnh gốc (nền trắng, jfif/jpg/webp/png/avif) được:
  1. tách nền thành alpha bằng rembg (model isnet-general-use) — KHÔNG chạm vào nhãn chai;
  2. khử viền trắng ở mép (un-premultiply theo nền trắng);
  3. cắt sát vùng có chai;
  4. đặt vào khung cố định 3:4, chai đứng chung một "mặt kệ" (đáy cách mép dưới 4%),
     chiều cao chai = 90% khung (nếu chai quá bè thì giới hạn theo chiều ngang 86%);
  5. xuất WebP trong suốt ở 3 cỡ: 1200x1600, 600x800, 300x400.
Kèm assets/img/products/meta.json: tỉ lệ bbox, độ phủ, màu chủ đạo (dùng để tô ánh sáng nền),
và các cờ cảnh báo để loại ảnh lỗi khỏi vị trí nổi bật.
"""
import argparse, json, os, sys, glob
from multiprocessing import Pool
import numpy as np
from PIL import Image

SIZES = {1200: (1200, 1600), 600: (600, 800), 300: (300, 400)}
H_FILL, W_FILL, BASE = 0.90, 0.86, 0.04

_session = None


def session():
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session("isnet-general-use")
    return _session


def dominant_colour(rgba):
    a = rgba[..., 3] > 200
    px = rgba[..., :3][a].reshape(-1, 3).astype(np.float32)
    if len(px) < 50:
        return [180, 140, 90]
    mx, mn = px.max(1), px.min(1)
    sat = (mx - mn) / (mx + 1)
    lum = px.mean(1)
    w = sat * ((lum > 40) & (lum < 235))
    if w.sum() < 1:
        return [int(v) for v in px.mean(0)]
    return [int(v) for v in (px * w[:, None]).sum(0) / w.sum()]


def drop_specks(alpha, keep=0.02):
    """Bỏ các mảnh rời nhỏ (vụn nền, chữ lạc) — giữ mọi mảnh >= 2% diện tích mảnh lớn nhất."""
    from scipy import ndimage
    lab, n = ndimage.label(alpha > 24)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(np.ones_like(lab), lab, index=range(1, n + 1))
    big = sizes.max()
    good = np.zeros(n + 1, bool)
    good[1:] = sizes >= big * keep
    mask = good[lab]
    # giữ cả viền mờ quanh các mảnh tốt
    mask = ndimage.binary_dilation(mask, iterations=3)
    out = alpha.copy()
    out[~mask] = 0
    return out


def place(crop, outdir, pid):
    cw, ch = crop.size
    for key, (W, H) in SIZES.items():
        scale = min(H * H_FILL / ch, W * W_FILL / cw)
        nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
        r = crop.resize((nw, nh), Image.LANCZOS)
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.paste(r, ((W - nw) // 2, H - round(H * BASE) - nh), r)
        d = os.path.join(outdir, str(key))
        os.makedirs(d, exist_ok=True)
        canvas.save(os.path.join(d, pid + ".webp"), "WEBP",
                    quality=86 if key == 1200 else 82, method=6, alpha_quality=90)


def clean_existing(outdir, pid):
    """Dọn vụn trên ảnh đã xuất (không chạy lại tách nền)."""
    f = os.path.join(outdir, "1200", pid + ".webp")
    im = np.array(Image.open(f).convert("RGBA"))
    a = im[..., 3]
    a2 = drop_specks(a)
    if (a2 != a).sum() < 50:
        return False
    im[..., 3] = a2
    ys, xs = np.where(a2 > 24)
    crop = Image.fromarray(im[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
    place(crop, outdir, pid)
    return True


def process(job):
    src, pid, outdir = job
    try:
        from rembg import remove
        im = Image.open(src)
        im.load()
        if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            bg.alpha_composite(im.convert("RGBA"))
            im = bg
        im = im.convert("RGB")
        im.thumbnail((2000, 2000), Image.LANCZOS)
        cut = remove(im, session=session(), post_process_mask=True)
        arr = np.array(cut).astype(np.float32)
        a = arr[..., 3:4] / 255.0
        # khử quầng trắng: I = a*C + (1-a)*255  ->  C = (I - (1-a)*255)/a
        rgb = np.array(im).astype(np.float32)
        safe = np.clip(a, 0.05, 1)
        dec = (rgb - (1 - a) * 255.0) / safe
        edge = (a > 0.02) & (a < 0.98)
        rgb = np.where(edge, np.clip(dec, 0, 255), rgb)
        alpha = arr[..., 3]
        alpha[alpha < 8] = 0
        alpha = drop_specks(alpha)
        rgba = np.dstack([rgb, alpha]).astype(np.uint8)
        ys, xs = np.where(alpha > 24)
        if len(ys) == 0:
            return pid, {"error": "empty mask"}
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")
        cw, ch = crop.size
        coverage = float((alpha > 24).sum()) / (cw * ch)
        flags = []
        if cw / ch > 0.85:
            flags.append("wide")          # hộp quà, nhiều chai, chai bè
        if coverage < 0.35:
            flags.append("sparse")
        if min(cw, ch) < 260:
            flags.append("lowres")
        # vật thể chạm mép ảnh gốc -> có thể bị cắt
        H0, W0 = alpha.shape
        if y0 <= 1 or x0 <= 1 or y1 >= H0 - 1 or x1 >= W0 - 1:
            flags.append("touches-edge")
        meta = {
            "w": cw, "h": ch, "ratio": round(cw / ch, 3), "coverage": round(coverage, 3),
            "colour": dominant_colour(rgba[y0:y1, x0:x1]), "flags": flags,
        }
        place(crop, outdir, pid)
        return pid, meta
    except Exception as e:  # pragma: no cover
        return pid, {"error": repr(e)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="products")
    ap.add_argument("--out", default="assets/img/products")
    ap.add_argument("--workers", type=int, default=2)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--force", action="store_true", help="xử lý lại cả ảnh đã có")
    ap.add_argument("--first", nargs="*", default=[], help="ưu tiên các thư mục này trước")
    ap.add_argument("--clean-only", action="store_true", help="chỉ dọn vụn trên ảnh đã xuất")
    args = ap.parse_args()
    files = sorted(f for f in glob.glob(os.path.join(args.src, "**", "*.*"), recursive=True)
                   if f.rsplit(".", 1)[-1].lower() in {"jfif", "jpg", "jpeg", "png", "webp", "avif"})
    jobs = []
    for f in files:
        pid = os.path.basename(f).split("_", 1)[0]
        if args.only and pid not in args.only:
            continue
        jobs.append((f, pid, args.out))
    os.makedirs(args.out, exist_ok=True)
    if args.clean_only:
        done = [os.path.basename(f)[:-5] for f in glob.glob(os.path.join(args.out, "1200", "*.webp"))]
        changed = [pid for pid in sorted(done) if clean_existing(args.out, pid)]
        print("cleaned", len(changed), changed)
        return
    mpath = os.path.join(args.out, "meta.json")
    meta = json.load(open(mpath)) if os.path.exists(mpath) else {}
    if not args.force:
        jobs = [j for j in jobs if not (j[1] in meta and "error" not in meta[j[1]]
                and os.path.exists(os.path.join(args.out, "300", j[1] + ".webp")))]
    jobs.sort(key=lambda j: next((i for i, k in enumerate(args.first) if f"/{k}/" in j[0]), len(args.first)))
    print("jobs:", len(jobs), flush=True)
    with Pool(args.workers) as pool:
        for i, (pid, m) in enumerate(pool.imap_unordered(process, jobs), 1):
            meta[pid] = m
            if i % 20 == 0 or "error" in m:
                print(f"{i}/{len(jobs)} {pid} {m.get('error', '')}", flush=True)
                json.dump(meta, open(mpath, "w"), indent=0, sort_keys=True)
    json.dump(meta, open(mpath, "w"), indent=0, sort_keys=True)
    print("done", len(meta))


if __name__ == "__main__":
    main()
