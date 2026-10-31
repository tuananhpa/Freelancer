#!/usr/bin/env python3
"""
Sinh assets/js/data.js cho TOÀN BỘ catalog từ cây thư mục products/.

  python3 scripts/build_data.py --src products --meta assets/img/products/meta.json --out assets/js/data.js

Chỉ dùng thông tin có trong đường dẫn và tên file:
  danh mục / loại / thương hiệu  <- thư mục
  tên, dung tích, nồng độ (abvNN), quy cách thùng (NNpk), "không hộp" <- tên file
Không bịa năm, hương vị, mô tả. Xuất xứ chỉ là quốc gia của thương hiệu (kiến thức phổ thông),
được đánh dấu [[CẦN XÁC NHẬN]] trong content-map.md; thương hiệu không chắc chắn -> để trống.
"""
import argparse, glob, json, os, re

CATEGORIES = [
    ("whisky", "Whisky", [("single-malt", "Single Malt"), ("blended", "Blended"),
                          ("american", "Bourbon & Rye"), ("irish", "Irish Whiskey")]),
    ("cognac-brandy", "Cognac & Brandy", []),
    ("spirits", "Gin, Rum, Vodka & Tequila", [("gin", "Gin"), ("rum", "Rum"), ("vodka", "Vodka"),
                                              ("tequila-mezcal", "Tequila & Mezcal")]),
    ("liqueurs-aperitifs", "Liqueur & Aperitif", []),
    ("japanese-spirits", "Sake & Umeshu", [("sake", "Sake"), ("umeshu", "Umeshu")]),
    ("vietnamese-spirits", "Rượu Việt", []),
]

BRAND_NAMES = {
    "1800-tequila": "1800 Tequila", "amber-black": "Amber Black", "ballantines": "Ballantine's",
    "bombay-sapphire": "Bombay Sapphire", "caol-ila": "Caol Ila", "canadian-club": "Canadian Club",
    "captain-morgan": "Captain Morgan", "ciroc": "Cîroc", "codigo-1530": "Código 1530",
    "cutty-sark": "Cutty Sark", "dewars": "Dewar's", "don-julio": "Don Julio",
    "evan-williams": "Evan Williams", "famous-grouse": "The Famous Grouse", "flor-de-cana": "Flor de Caña",
    "founders-choice": "Founder's Choice", "four-pillars": "Four Pillars", "glen-grant": "Glen Grant",
    "glen-turner": "Glen Turner", "glenallachie": "GlenAllachie", "glendronach": "GlenDronach",
    "good-gin": "Good Gin", "gordons": "Gordon's", "grand-marnier": "Grand Marnier",
    "grande-absente": "Grande Absente", "grants": "Grant's", "grey-goose": "Grey Goose",
    "haig-club": "Haig Club", "halong": "Halong", "hangar-1": "Hangar 1", "havana-club": "Havana Club",
    "hendricks": "Hendrick's", "high-commissioner": "High Commissioner", "highland-park": "Highland Park",
    "j-and-b": "J&B", "jack-daniels": "Jack Daniel's", "jagermeister": "Jägermeister",
    "japanese-cherry-blossom": "Japanese Cherry Blossom", "jim-beam": "Jim Beam", "john-barr": "John Barr",
    "johnnie-walker": "Johnnie Walker", "jose-cuervo": "José Cuervo", "ketel-one": "Ketel One",
    "kingston-62": "Kingston 62", "knob-creek": "Knob Creek", "lady-trieu": "Lady Triệu",
    "louis-xiii": "Louis XIII", "makers-mark": "Maker's Mark", "monkey-47": "Monkey 47",
    "monkey-shoulder": "Monkey Shoulder", "mount-gay": "Mount Gay", "nhau": "Nhậu", "no-3": "No.3",
    "patron": "Patrón", "pho-cocktail": "Phở Cocktail", "port-charlotte": "Port Charlotte",
    "porto-cruz": "Porto Cruz", "remy-martin": "Rémy Martin", "royal-brackla": "Royal Brackla",
    "royal-salute": "Royal Salute", "russells-reserve": "Russell's Reserve", "sailor-jerry": "Sailor Jerry",
    "st-germain": "St-Germain", "st-remy": "St-Rémy", "teachers": "Teacher's", "the-balvenie": "The Balvenie",
    "the-botanist": "The Botanist", "the-glenlivet": "The Glenlivet", "the-hakuto": "The Hakuto",
    "the-naked-malt": "The Naked Malt", "the-san-in": "The San-in", "the-sexton": "The Sexton",
    "titos": "Tito's", "two-fingers": "Two Fingers", "wall-street": "Wall Street", "wild-turkey": "Wild Turkey",
    "czars": "Czar's", "skyy": "SKYY", "other": "Khác",
}

# quốc gia của thương hiệu — chỉ những thương hiệu nổi tiếng, không chắc thì bỏ trống
ORIGIN = {}
def _o(country, names):
    for n in names.split():
        ORIGIN[n] = country
_o("Scotland", "aberfeldy aberlour auchentoshan aultmore ballantines bowmore bruichladdich caol-ila chivas "
   "cragganmore cutty-sark dalmore dalwhinnie dewars famous-grouse glen-grant glenallachie glendronach "
   "glenfarclas glenfiddich glenkinchie glenmorangie glenrothes grants haig-club highland-park j-and-b "
   "johnnie-walker lagavulin laphroaig macallan monkey-shoulder mortlach octomore port-charlotte royal-brackla "
   "royal-salute singleton talisker tamdhu tamnavulin teachers the-balvenie the-glenlivet the-naked-malt "
   "the-botanist hendricks drambuie")
_o("Nhật Bản", "hibiki hakushu yamazaki matsui dassai daishichi nishinoseki horin choya kishu nakano nakata "
   "kikkoman roku the-hakuto kinobi haku midori")
_o("Ireland", "bushmills jameson the-sexton gunpowder baileys")
_o("Hoa Kỳ", "bulleit evan-williams jack-daniels jim-beam knob-creek makers-mark rittenhouse russells-reserve "
   "wild-turkey titos skyy hangar-1")
_o("Pháp", "hennessy martell remy-martin louis-xiii st-remy cointreau grand-marnier giffard chambord "
   "st-germain benedictine grey-goose ciroc grande-absente")
_o("Anh", "beefeater bombay-sapphire gordons tanqueray bulldog greenalls opihr no-3")
_o("Mexico", "1800-tequila don-julio jose-cuervo patron olmeca avion codigo-1530 lunazul creyente kahlua")
_o("Ý", "campari aperol martini cinzano averna braulio cynar frangelico galliano vaccari")
_o("Đức", "jagermeister monkey-47")
_o("Hà Lan", "bols ketel-one")
_o("Ba Lan", "belvedere wyborowa")
_o("Thuỵ Điển", "absolut")
_o("Đan Mạch", "danzka")
_o("Nga", "beluga")
_o("Úc", "four-pillars lark")
_o("Canada", "canadian-club")
_o("Cuba", "havana-club")
_o("Jamaica", "appleton kingston-62")
_o("Barbados", "mount-gay")
_o("Guatemala", "zacapa")
_o("Nicaragua", "flor-de-cana")
_o("Cộng hoà Dominica", "brugal")
_o("Trinidad & Tobago", "angostura")
_o("Tây Ban Nha", "nordes")
_o("Bồ Đào Nha", "porto-cruz")
_o("Việt Nam", "lady-trieu halong founders-choice good-gin pho-cocktail nhau alligator")

WORD = {
    "xo": "XO", "vsop": "VSOP", "vs": "VS", "xr": "XR", "xv": "XV", "xx": "XX", "xxv": "XXV", "ii": "II",
    "iii": "III", "xiii": "XIII", "v": "V", "anejo": "Añejo", "anos": "Años", "remy": "Rémy", "patron": "Patrón",
    "jagermeister": "Jägermeister", "cana": "Caña", "trieu": "Triệu", "hendricks": "Hendrick's",
    "gordons": "Gordon's", "ballantines": "Ballantine's", "dewars": "Dewar's", "grants": "Grant's",
    "teachers": "Teacher's", "titos": "Tito's", "buddhas": "Buddha's", "ciroc": "Cîroc", "russells": "Russell's",
    "makers": "Maker's", "daniels": "Daniel's", "de": "de", "du": "du", "of": "of", "the": "The", "and": "&",
    "glenallachie": "GlenAllachie", "glendronach": "GlenDronach", "doragon": "Doragon", "dor": "d'Or",
    "nhau": "Nhậu", "com": "Cốm", "cam": "Cam", "sanh": "Sành", "pho": "Phở", "mini": "Mini", "jose": "José",
    "codigo": "Código", "lautentico": "L'Autentico", "noblige": "Noblige", "proof": "Proof", "skyy": "SKYY",
    "yo": "Year Old", "j": "J", "b": "B", "d": "D", "o": "O", "m": "M", "san": "San", "in": "in",
    "elyx": "Elyx", "mizunara": "Mizunara", "creme": "Crème", "peche": "Pêche", "banane": "Banane",
    "bresil": "Brésil", "framboise": "Framboise", "menthe": "Menthe", "maraschino": "Maraschino",
    "curacao": "Curaçao", "lasanta": "Lasanta", "orange": "Orange",
}
DROP = {"uk", "eu", "vn", "gb", "f24", "f25", "f26", "1pk"}
TYPE_PREFIX = {"vodka": "Vodka", "tequila": "Tequila", "sake": "Sake", "gin": "Gin"}

OVERRIDE = {
    "bruichladdich-classic-ladies-tube-box": "Bruichladdich The Classic Laddie",
    "benedictine-d-o-m-liqueur": "Bénédictine D.O.M Liqueur",
    "j-and-b-blended-scotch-whisky": "J&B Blended Scotch Whisky",
    "galliano-lautentico": "Galliano L'Autentico",
    "glenmorangie-nectar-dor": "Glenmorangie Nectar d'Or",
    "tanqueray-no-10-gin": "Tanqueray No. Ten Gin",
    "no-3-gin": "No.3 London Dry Gin",
    "jack-daniels-old-no-7": "Jack Daniel's Old No. 7",
    "bowmore-no-1": "Bowmore No. 1",
    "macallan-m-black-limited": "The Macallan M Black",
    "macallan-m-decanter": "The Macallan M Decanter",
    "the-san-in": "The San-in",
    "royal-salute-62-gun": "Royal Salute 62 Gun Salute",
}

# ảnh đã kiểm trên contact sheet (docs/contact-sheet.jpg): còn vụn nền / mất mảng kính
# -> giữ trong catalog nhưng KHÔNG đưa vào vị trí nổi bật, xếp cuối khi sắp "Nổi bật"
REVIEW = {"0029", "0109", "0141", "0154", "0444", "0447", "0450", "0472", "0548"}

VOL_RE = re.compile(r"^(\d{2,4})ml$")
ABV_RE = re.compile(r"^abv(\d{2})$")
PK_RE = re.compile(r"^(\d{1,2})pk$")


def nice_word(w, i):
    if w in WORD:
        return WORD[w]
    if re.fullmatch(r"\d+", w):
        return w
    return w[:1].upper() + w[1:]


def parse(slug):
    tokens = slug.split("-")
    vol = abv = pack = None
    nobox = False
    out = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        if VOL_RE.match(t):
            vol = int(VOL_RE.match(t).group(1)); i += 1; continue
        if ABV_RE.match(t):
            abv = float(ABV_RE.match(t).group(1))
            # abv58-6 -> 58.6 ; abv38-6pk -> 38 (6pk là quy cách)
            if i + 1 < len(tokens) and re.fullmatch(r"\d", tokens[i + 1]):
                abv += int(tokens[i + 1]) / 10; i += 1
            i += 1; continue
        if PK_RE.match(t):
            n = int(PK_RE.match(t).group(1))
            if n > 1:
                pack = n
            i += 1; continue
        if t == "no" and i + 1 < len(tokens) and tokens[i + 1] in ("box", "case"):
            nobox = True; i += 2; continue
        if t in DROP:
            i += 1; continue
        out.append(t)
        i += 1
    return out, vol, abv, pack, nobox


def pretty_name(slug, words):
    key = "-".join(words)
    for k, v in OVERRIDE.items():
        if key == k or key.startswith(k + "-") and k in ("royal-salute-62-gun",):
            if key == k:
                return v
            rest = key[len(k) + 1:].split("-")
            return v + " " + " ".join(nice_word(w, j) for j, w in enumerate(rest))
    if key in OVERRIDE:
        return OVERRIDE[key]
    words = list(words)
    suffix = None
    if words and words[0] in TYPE_PREFIX and len(words) > 1:
        suffix = TYPE_PREFIX[words.pop(0)]
    # bỏ mô tả màu chai ở cuối (…-pink-bottle, …-dark-blue-bottle)
    if words and words[-1] == "bottle":
        words.pop()
        while words and words[-1] in ("pink", "green", "dark", "blue", "purple", "red"):
            words.pop()
    # chivas 13 extra …-cask-<màu>
    if "cask" in words and words[-1] in ("blue", "purple", "green", "brown") and "13" in words:
        words = words[: len(words) - 1 - (1 if words[-2] == "reddish" else 0)]
    # "and son(s)" -> "& Sons"
    # gộp từ lặp liền nhau (gold-gold) và "st-xxx" -> "St-Xxx"
    words = [w for k, w in enumerate(words) if k == 0 or w != words[k - 1]]
    s = " ".join(nice_word(w, j) for j, w in enumerate(words))
    s = re.sub(r"\bSt (\w)", r"St-\1", s)
    s = re.sub(r"\b(\d+) (\d)\b", lambda m: f"{m.group(1)}.{m.group(2)}", s) if "Octomore" in s or "Version" in s else s
    s = s.replace("& Son ", "& Sons ").replace("& Sons", "& Sons")
    s = s.replace("Year Old Year Old", "Year Old")
    s = re.sub(r"^Macallan\b", "The Macallan", s)
    s = re.sub(r"^Glenlivet\b", "The Glenlivet", s)
    s = s.replace("Louis Xiii", "Louis XIII").replace("D O M", "D.O.M")
    if suffix and suffix.lower() not in s.lower():
        s = f"{s} {suffix}"
    return re.sub(r"\s+", " ", s).strip()


def vol_label(ml):
    if ml is None:
        return None
    if ml >= 1000:
        l = ml / 1000
        return (f"{l:g}".replace(".", ",")) + " L"
    return f"{ml} ml"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="products")
    ap.add_argument("--meta", default="assets/img/products/meta.json")
    ap.add_argument("--out", default="assets/js/data.js")
    a = ap.parse_args()
    meta = json.load(open(a.meta)) if os.path.exists(a.meta) else {}
    cat_ids = {c[0] for c in CATEGORIES}
    products, brands = [], {}
    for f in sorted(glob.glob(os.path.join(a.src, "**", "*.*"), recursive=True)):
        rel = os.path.relpath(f, a.src).split(os.sep)
        if len(rel) < 3 or rel[0] not in cat_ids:
            continue
        cat = rel[0]
        typ = rel[1] if len(rel) == 4 else None
        brand = rel[-2]
        base = os.path.splitext(rel[-1])[0]
        pid, slug = base.split("_", 1)
        words, vol, abv, pack, nobox = parse(slug)
        name = pretty_name(slug, words)
        m = meta.get(pid, {})
        if "error" in m:
            continue
        bkey = brand if brand != "other" else f"other-{cat}"
        if bkey not in brands:
            bname = BRAND_NAMES.get(brand) or " ".join(w[:1].upper() + w[1:] for w in brand.split("-"))
            if brand == "other":
                bname = "Khác"
            brands[bkey] = {"name": bname, "origin": ORIGIN.get(brand)}
        p = {"id": pid, "name": name, "cat": cat, "brand": bkey}
        if typ:
            p["type"] = typ
        if vol:
            p["ml"] = vol
            p["vol"] = vol_label(vol)
        if abv:
            p["abv"] = round(abv, 1)
        if pack:
            p["pack"] = pack
        if nobox:
            p["nobox"] = True
        if m:
            p["rgb"] = m.get("colour")
            fl = list(m.get("flags") or [])
            if pid in REVIEW:
                fl.append("review")
            if fl:
                p["flags"] = fl
            p["ratio"] = m.get("ratio")
        p["file"] = "/".join(rel)
        products.append(p)
    data = {
        "generated": "scripts/build_data.py",
        "categories": [{"id": c, "name": n, "types": [{"id": t, "name": tn} for t, tn in ts]} for c, n, ts in CATEGORIES],
        "brands": brands,
        "products": products,
    }
    js = "/* Tự sinh bởi scripts/build_data.py — không sửa tay. */\nwindow.BM_DATA = " + \
         json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    open(a.out, "w", encoding="utf-8").write(js)
    print(len(products), "products,", len(brands), "brands ->", a.out)


if __name__ == "__main__":
    main()
