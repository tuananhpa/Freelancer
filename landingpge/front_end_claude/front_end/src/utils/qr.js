import QRCode from 'qrcode';

const LIGHT = '#FFFFFF';
const LOGO_RATIO = 0.22;

const baseOptions = (color) => ({
  errorCorrectionLevel: 'H', // mức H chịu được logo che giữa mã
  margin: 2,
  color: { dark: color, light: LIGHT },
});

function drawLogo(ctx, size, color) {
  const box = size * LOGO_RATIO;
  const x = (size - box) / 2;
  const r = box * 0.22;
  ctx.fillStyle = LIGHT;
  ctx.beginPath();
  ctx.roundRect(x - box * 0.08, x - box * 0.08, box * 1.16, box * 1.16, r * 1.2);
  ctx.fill();
  ctx.fillStyle = color === '#B23A22' ? '#17110D' : '#B23A22';
  ctx.beginPath();
  ctx.roundRect(x, x, box, box, r);
  ctx.fill();
  ctx.fillStyle = '#F5EEE2';
  ctx.font = `700 ${box * 0.62}px "Playfair Display", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', size / 2, size / 2 + box * 0.04);
}

/** Vẽ QR (kèm logo HYTale nếu cần) lên canvas, trả về canvas. */
export async function renderQrCanvas(text, { color = '#17110D', withLogo = true, size = 1024 } = {}) {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, text, { ...baseOptions(color), width: size });
  if (withLogo) drawLogo(canvas.getContext('2d'), canvas.width, color);
  return canvas;
}

export async function qrToPngDataUrl(text, opts) {
  return (await renderQrCanvas(text, opts)).toDataURL('image/png');
}

/** SVG vector cho nhà in. */
export async function qrToSvg(text, { color = '#17110D', withLogo = true } = {}) {
  let svg = await QRCode.toString(text, { ...baseOptions(color), type: 'svg' });
  if (withLogo) {
    const vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const n = vb ? Number(vb[1]) : 33;
    const box = n * LOGO_RATIO;
    const x = (n - box) / 2;
    const fill = color === '#B23A22' ? '#17110D' : '#B23A22';
    const logo = `<rect x="${x - box * 0.08}" y="${x - box * 0.08}" width="${box * 1.16}" height="${box * 1.16}" rx="${box * 0.26}" fill="${LIGHT}"/>`
      + `<rect x="${x}" y="${x}" width="${box}" height="${box}" rx="${box * 0.22}" fill="${fill}"/>`
      + `<text x="${n / 2}" y="${n / 2 + box * 0.24}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${box * 0.62}" fill="#F5EEE2">H</text>`;
    svg = svg.replace('</svg>', `${logo}</svg>`);
  }
  return svg;
}

export function downloadFile(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadPng(text, filename, opts) {
  downloadFile(await qrToPngDataUrl(text, { ...opts, size: 2048 }), `${filename}.png`);
}

export async function downloadSvg(text, filename, opts) {
  const blob = new Blob([await qrToSvg(text, opts)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${filename}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * PDF: mở trang in với tem QR khổ 50mm, người dùng chọn "Lưu dưới dạng PDF".
 * Khi có backend có thể thay bằng endpoint GET /admin/products/:id/qr.pdf
 */
export async function printPdf(text, { title, subtitle, ...opts }) {
  const svg = await qrToSvg(text, opts);
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>@page{size:A6;margin:10mm}body{font-family:Georgia,serif;text-align:center;color:#17110D}
.qr{width:60mm;height:60mm;margin:8mm auto 4mm}.qr svg{width:100%;height:100%}
h1{font-size:16pt;margin:0}p{font-family:Arial,sans-serif;font-size:9pt;margin:2mm 0;color:#444}</style></head>
<body><h1>${title}</h1><div class="qr">${svg}</div><p>${subtitle}</p><p>${text}</p>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
  w.document.close();
  return true;
}
