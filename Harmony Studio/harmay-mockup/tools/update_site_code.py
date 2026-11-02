import re
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(root)

# 1. Update main.js
main_js_path = os.path.join(root, 'assets', 'js', 'main.js')
with open(main_js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Clear tbc placeholders in SITE
js = js.replace("brandConfirm: '[[CẦN XÁC NHẬN]]'", "brandConfirm: ''")
js = js.replace("phoneNote: '[[CẦN XÁC NHẬN]]'", "phoneNote: ''")
js = js.replace("emailNote: '[[CẦN XÁC NHẬN]]'", "emailNote: ''")
js = js.replace("addressNote: '[[CẦN XÁC NHẬN]]'", "addressNote: ''")

# Remove tbc in chapter header, collection list, and collection detail
js = re.sub(r'<h3>\$\{c\.name\}\s*<b class="tbc">\[\[CẦN XÁC NHẬN\]\]</b></h3>', '<h3>${c.name}</h3>', js)
js = re.sub(r'<h2>\$\{c\.name\}\s*<b class="tbc">\[\[CẦN XÁC NHẬN\]\]</b></h2>', '<h2>${c.name}</h2>', js)
js = re.sub(r'<h1>\$\{c\.name\}\s*<b class="tbc">\[\[CẦN XÁC NHẬN\]\]</b></h1>', '<h1>${c.name}</h1>', js)

# Remove is-hidden header toggle that caused jerking on dich-vu.html
old_scroll_tabs = """    if (svcTabs) {
      const rect = svcTabs.getBoundingClientRect();
      const passedSubMenu = rect.top <= 4 && y > 120;
      header.classList.toggle('is-hidden', !open && passedSubMenu);
      const mayDo = document.getElementById('may-do');
      if (mayDo) {
        const isMayDo = mayDo.getBoundingClientRect().top <= 160;
        const chips = svcTabs.querySelectorAll('.chip');
        if (chips[0]) chips[0].setAttribute('aria-pressed', String(!isMayDo));
        if (chips[1]) chips[1].setAttribute('aria-pressed', String(isMayDo));
      }
    } else {
      header.classList.remove('is-hidden');
    }"""

new_scroll_tabs = """    header.classList.remove('is-hidden');
    if (svcTabs) {
      const mayDo = document.getElementById('may-do');
      if (mayDo) {
        const isMayDo = mayDo.getBoundingClientRect().top <= 160;
        const chips = svcTabs.querySelectorAll('.chip');
        if (chips[0]) chips[0].setAttribute('aria-pressed', String(!isMayDo));
        if (chips[1]) chips[1].setAttribute('aria-pressed', String(isMayDo));
      }
    }"""

if old_scroll_tabs in js:
    js = js.replace(old_scroll_tabs, new_scroll_tabs)
    print('Replaced scroll tabs logic in main.js')

# Update footer HTML in main.js
footer_pattern = re.compile(r'footer\.innerHTML\s*=\s*`[\s\S]*?`\s*;', re.DOTALL)
footer_replacement = """footer.innerHTML = `
      <div class="footer__cols">
        <ul>
          <li><h4>Thương hiệu</h4></li>
          <li style="font-weight:600">${SITE.brand}</li>
          <li>${SITE.tagline}</li>
          <li>${SITE.address}</li>
          <li>${SITE.hours}</li>
        </ul>
        <ul>
          <li><h4>Điều hướng</h4></li>
          <li><a href="index.html">Trang chủ</a></li>
          <li><a href="bo-suu-tap.html">Bộ sưu tập</a></li>
          <li><a href="dich-vu.html#xuong">Thiết kế cho xưởng</a></li>
          <li><a href="dich-vu.html#may-do">May đo riêng</a></li>
          <li><a href="gioi-thieu.html">Câu chuyện</a></li>
          <li><a href="lien-he.html">Liên hệ</a></li>
        </ul>
        <ul>
          <li><h4>Ngách thời trang</h4></li>
          ${DATA.niches.map(n => `<li><a href="bo-suu-tap.html?ngach=${n.id}">${n.name}</a></li>`).join('')}
        </ul>
        <ul>
          <li><h4>Liên hệ trực tiếp</h4></li>
          <li><a href="${SITE.phoneHref}">Hotline: ${SITE.phone}</a></li>
          <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li><a href="${SITE.zalo}">Nhắn Zalo</a> · <a href="${SITE.messenger}">Messenger</a></li>
          <li><a href="${SITE.facebook}">Facebook</a> · <a href="${SITE.instagram}">Instagram</a> · <a href="${SITE.tiktok}">TikTok</a></li>
        </ul>
      </div>
      <div class="footer__big" aria-hidden="true">
        <svg viewBox="0 0 1700 205"><text x="0" y="178" font-size="196" textLength="1700" lengthAdjust="spacing">HARMONY.STUDIO</text></svg>
      </div>
      <div class="footer__legal">
        <span>© ${SITE.brand} — Thiết kế thời trang cho xưởng & may đo riêng.</span>
        <span><a href="admin.html" style="color:inherit;opacity:.7;text-decoration:underline">Quản trị Atelier</a></span>
      </div>`;"""

js = footer_pattern.sub(footer_replacement, js)

with open(main_js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated assets/js/main.js successfully')

# 2. Clean HTML files
for hname in ['index.html', 'dich-vu.html', 'gioi-thieu.html', 'lien-he.html']:
    hp = os.path.join(root, hname)
    if os.path.exists(hp):
        with open(hp, 'r', encoding='utf-8') as f:
            c = f.read()
        c = re.sub(r'\s*<b class="tbc">\[\[CẦN XÁC NHẬN\]\]</b>', '', c)
        c = c.replace('[[CẦN XÁC NHẬN]]', '')
        with open(hp, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f'Cleaned {hname}')
