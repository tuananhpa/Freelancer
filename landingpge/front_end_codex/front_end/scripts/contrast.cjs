async function auditText(page) {
  return page.evaluate(() => {
    const rgba = (value) => (value.match(/[\d.]+/g) || []).map(Number);
    const blend = (front, back) =>
      front
        .slice(0, 3)
        .map((v, i) => v * (front[3] ?? 1) + back[i] * (1 - (front[3] ?? 1)));
    const luminance = (c) =>
      c
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    const failures = [];
    for (const el of document.querySelectorAll("body *")) {
      if (
        el.closest(
          "svg, script, style, .hero-film, .product-hero-media, .film-card, .story-mosaic, .passport-cover",
        ) ||
        !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) ||
        el.closest(":disabled")
      )
        continue;
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join("")
        .trim();
      const placeholder =
        el.matches("input, textarea") && el.getAttribute("placeholder");
      if (!text && !placeholder) continue;
      const ancestors = [];
      for (let node = el; node; node = node.parentElement)
        ancestors.unshift(node);
      let background = [255, 255, 255];
      for (const ancestor of ancestors)
        background = blend(
          rgba(getComputedStyle(ancestor).backgroundColor),
          background,
        );
      const style = getComputedStyle(el),
        foreground = blend(rgba(style.color), background);
      const contrast = ratio(foreground, background);
      if (text && contrast < 4.5)
        failures.push({
          text: text.slice(0, 70),
          tag: el.tagName,
          class: el.className,
          color: style.color,
          contrast: +contrast.toFixed(2),
        });
      if (placeholder) {
        const p = getComputedStyle(el, "::placeholder");
        const contrast = ratio(blend(rgba(p.color), background), background);
        if (contrast < 4.5)
          failures.push({
            text: placeholder,
            tag: "placeholder",
            color: p.color,
            contrast: +contrast.toFixed(2),
          });
      }
    }
    return failures;
  });
}
module.exports = { auditText };
