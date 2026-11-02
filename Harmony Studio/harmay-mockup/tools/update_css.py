import os
import re

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
css_path = os.path.join(root, 'assets', 'css', 'main.css')

with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Update .svc-tabs
css = re.sub(
    r'\.svc-tabs\s*\{[^}]*\}',
    '''.svc-tabs {
  position: sticky;
  top: var(--header-h);
  z-index: 95;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px var(--m);
  background: rgba(241, 239, 234, .95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(17, 17, 18, .12);
  box-shadow: 0 4px 18px rgba(17, 17, 18, .04);
}''',
    css
)

# 2. Update .chapter, .chapter__giant, .chapter__model--b, .chapter__info
css = re.sub(
    r'\.chapter\s*\{[^}]*\}',
    '''.chapter {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  background: var(--tint);
  color: #161413;
  isolation: isolate;
}''',
    css
)

css = re.sub(
    r'\.chapter__giant \.mega\s*\{[^}]*\}',
    '''.chapter__giant .mega {
  font-size: clamp(110px, 25vw, 500px);
  color: var(--cink);
  opacity: .08;
  will-change: transform;
}''',
    css
)

css = re.sub(
    r'\.chapter__model--b\s*\{[^}]*\}',
    '''.chapter__model--b {
  height: min(60svh, 640px);
  filter: saturate(.96);
  opacity: .92;
  left: auto !important;
  right: clamp(24px, 8vw, 110px) !important;
}''',
    css
)

# 3. Update .cl-item__giant, .cl-item__info, .cl-item__more
css = re.sub(
    r'\.cl-item__giant \.mega\s*\{[^}]*\}',
    '''.cl-item__giant .mega {
  font-size: clamp(110px, 23vw, 440px);
  color: var(--cink);
  opacity: .08;
}''',
    css
)

css = re.sub(
    r'\.cl-item__info\s*\{[^}]*\}',
    '''.cl-item__info {
  position: relative;
  z-index: 3;
  grid-column: 1 / span 5;
  align-self: end;
  margin: 0 0 clamp(24px, 4vw, 48px) var(--m);
  padding: clamp(18px, 2.2vw, 28px);
  background: rgba(244, 241, 236, .94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(17, 17, 18, .08), 0 0 0 1px rgba(17, 17, 18, .08);
}''',
    css
)

# 4. Update .cd-hero
css = re.sub(
    r'\.cd-hero\s*\{[^}]*\}',
    '''.cd-hero {
  position: relative;
  min-height: auto;
  height: clamp(400px, 58svh, 540px);
  background: var(--tint);
  color: #161413;
  overflow: hidden;
  display: grid;
  grid-template-rows: 1fr auto;
  padding: calc(var(--header-h) + 16px) var(--m) clamp(20px, 3vh, 32px);
  isolation: isolate;
}''',
    css
)

css = re.sub(
    r'\.cd-hero__giant \.mega\s*\{[^}]*\}',
    '''.cd-hero__giant .mega {
  font-size: clamp(110px, 25vw, 500px);
  color: var(--cink);
  opacity: .08;
}''',
    css
)

css = re.sub(
    r'\.cd-hero__model\s*\{[^}]*\}',
    '''.cd-hero__model {
  position: absolute;
  z-index: 1;
  left: 50%;
  bottom: 0;
  translate: -50% 0;
  height: 92%;
}''',
    css
)

# 5. Update .lb-item and children to fit within 1 screen frame
css = re.sub(
    r'\.lb-item\s*\{[^}]*\}',
    '''.lb-item {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0 var(--gap);
  min-height: calc(100svh - var(--header-h));
  height: auto;
  padding: clamp(16px, 2.5vh, 28px) var(--m);
  align-items: center;
  border-bottom: 1px solid rgba(17, 17, 18, .08);
  scroll-margin-top: var(--header-h);
  box-sizing: border-box;
}''',
    css
)

css = re.sub(
    r'\.lb-item__fig\s*\{[^}]*\}',
    '''.lb-item__fig {
  grid-column: 2 / span 5;
  position: relative;
  height: min(58svh, 460px);
  max-height: calc(100svh - var(--header-h) - 64px);
  aspect-ratio: 3 / 4;
  width: auto;
  max-width: 100%;
  justify-self: center;
  background: var(--tint);
  overflow: hidden;
  cursor: pointer;
  isolation: isolate;
}''',
    css
)

css = re.sub(
    r'\.lb-item__giant\s*\{[^}]*\}',
    '''.lb-item__giant {
  position: absolute;
  left: 50%;
  top: 14%;
  translate: -50% 0;
  z-index: 0;
  font-size: clamp(80px, 10vw, 150px);
  color: var(--cink);
  opacity: .09;
  pointer-events: none;
}''',
    css
)

css = re.sub(
    r'\.lb-item__no \.mega\s*\{[^}]*\}',
    '''.lb-item__no .mega { font-size: clamp(28px, 3.2vw, 42px); }''',
    css
)

css = re.sub(
    r'\.lb-item h3\s*\{[^}]*\}',
    '''.lb-item h3 { font-size: clamp(20px, 1.8vw, 26px); margin-bottom: 6px; }''',
    css
)

css = re.sub(
    r'\.lb-item \.meta\s*\{[^}]*\}',
    '''.lb-item .meta { color: var(--ink-soft); font-size: 13.5px; margin-bottom: 12px; }''',
    css
)

css = re.sub(
    r'\.lb-item ul\s*\{[^}]*\}',
    '''.lb-item ul { margin-bottom: 14px; }''',
    css
)

css = re.sub(
    r'\.lb-item li\s*\{[^}]*\}',
    '''.lb-item li { padding: 5px 0; box-shadow: inset 0 1px 0 rgba(17, 17, 18, .16); font-size: 13.5px; }''',
    css
)

css = re.sub(
    r'\.lb-item__btns \.btn\s*\{[^}]*\}',
    '''.lb-item__btns .btn { height: 38px; padding: 0 16px; font-size: 11px; letter-spacing: .11em; }''',
    css
)

# 6. Update .footer and children
css = re.sub(
    r'\.footer\s*\{[^}]*\}',
    '''.footer {
  position: relative;
  z-index: 2;
  min-height: auto;
  background: var(--stage);
  color: var(--stage-ink);
  display: flex;
  flex-direction: column;
  gap: clamp(18px, 2.4vw, 32px);
  padding: clamp(36px, 4.5vw, 52px) var(--m) 24px;
}''',
    css
)

css = re.sub(
    r'\.footer__cols\s*\{[^}]*\}',
    '''.footer__cols {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px var(--gap);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}''',
    css
)

css = re.sub(
    r'\.footer__big\s*\{[^}]*\}',
    '''.footer__big {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  padding-top: clamp(14px, 2vw, 24px);
  border-top: 1px solid rgba(255, 255, 255, .12);
}''',
    css
)

css = re.sub(
    r'\.footer__big svg\s*\{[^}]*\}',
    '''.footer__big svg {
  width: 100%;
  height: auto;
  max-height: 105px;
}''',
    css
)

css = re.sub(
    r'\.footer__legal\s*\{[^}]*\}',
    '''.footer__legal {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding-top: 4px;
  font-size: 13px;
  color: var(--stage-soft);
}''',
    css
)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print('Updated assets/css/main.css successfully')
