import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css_path = os.path.join(ROOT, 'assets', 'css', 'main.css')
js_path = os.path.join(ROOT, 'assets', 'js', 'main.js')

# 1. Update CSS for .process
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

old_process = re.compile(r'\.process__stage\s*\{[^}]*\}[\s\S]*?\.process__step\s*\.no\s*\{[^}]*\}', re.DOTALL)
new_process = """.process__stage { position: relative; height: 100svh; min-height: 640px; overflow: hidden; display: grid; grid-template-rows: auto 1fr auto; padding: calc(var(--header-h) + 20px) var(--m) clamp(28px, 5vh, 56px); }
.process__top { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(36px, 5vh, 64px); padding-bottom: 20px; border-bottom: 1px solid rgba(17, 17, 18, .1); }
.process__tabs { display: inline-flex; box-shadow: inset 0 0 0 1px var(--ink); }
.process__tabs button { height: 44px; padding: 0 20px; font: 500 12px/1 var(--f-text); letter-spacing: .14em; text-transform: uppercase; transition: background var(--d-fast), color var(--d-fast); }
.process__tabs button[aria-selected="true"] { background: var(--ink); color: var(--chalk); }
.process__body { position: relative; display: grid; min-height: 280px; }
.process__word { position: absolute; right: -.02em; top: 50%; translate: 0 -50%; font-size: clamp(120px, 26vw, 460px); color: var(--paper); z-index: 0; pointer-events: none; }
.process__step { position: absolute; left: 0; top: clamp(24px, 4vh, 48px); max-width: min(52ch, 90%); z-index: 1; opacity: 0; will-change: transform, opacity; }
.process__step h3 { font-size: clamp(32px, 4.4vw, 56px); line-height: 1.15; margin-bottom: 16px; }
.process__step .no { display: block; margin-bottom: 16px; color: var(--vermilion); font-size: 13px; letter-spacing: .16em; }
.process__step .lead { font-size: 17px; line-height: 1.6; max-width: 52ch; }"""

css = old_process.sub(new_process, css)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)
print('Updated main.css for process spacing')

# 2. Update main.js for hero pin & scrub smoothness
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace scrub: .5 with scrub: true, anticipatePin: 1 in hero timeline
js = js.replace(
    "scrollTrigger: { trigger: hero, start: 'top top', end: '+=95%', pin: true, scrub: .5 }",
    "scrollTrigger: { trigger: hero, start: 'top top', end: '+=95%', pin: true, scrub: true, anticipatePin: 1 }"
)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated main.js for hero scroll smoothness')
