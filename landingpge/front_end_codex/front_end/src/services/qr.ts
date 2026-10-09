import QRCode from "qrcode";
import type { ImageDisplay } from "../types/domain";
import { normalizeImageDisplay } from "./imageDisplay";
export function readableQrColor(hex: string) {
  if (!/^#[\da-f]{6}$/i.test(hex)) return false;
  const values = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const luminance =
    0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
  return 1.05 / (luminance + 0.05) >= 4.5;
}
export async function renderQr(
  url: string,
  color: string,
  logo?: string,
  logoDisplay?: ImageDisplay,
) {
  if (!readableQrColor(color))
    throw new Error("Chọn màu QR đủ tối để giữ khả năng quét trên nền trắng.");
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    width: 1200,
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: color, light: "#ffffff" },
  });
  let svg = await QRCode.toString(url, {
    type: "svg",
    margin: 4,
    errorCorrectionLevel: "H",
    color: { dark: color, light: "#ffffff" },
  });
  if (
    logo &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z\d+/=]+$/.test(logo)
  ) {
    const img = new Image();
    img.src = logo;
    await img.decode();
    const ctx = canvas.getContext("2d")!;
    const size = 156;
    const frame = document.createElement("canvas");
    frame.width = frame.height = size;
    const frameContext = frame.getContext("2d")!;
    const display = normalizeImageDisplay(logoDisplay, "contain");
    const scale = (display.fit === "cover" ? Math.max : Math.min)(
      size / img.naturalWidth,
      size / img.naturalHeight,
    );
    const width = img.naturalWidth * scale,
      height = img.naturalHeight * scale;
    frameContext.drawImage(
      img,
      ((size - width) * display.x) / 100,
      ((size - height) * display.y) / 100,
      width,
      height,
    );
    const framedLogo = frame.toDataURL("image/png");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(510, 510, 180, 180);
    ctx.drawImage(frame, 522, 522, size, size);
    const match = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (match) {
      const v = Number(match[1]);
      svg = svg.replace(
        "</svg>",
        `<rect x="${v * 0.425}" y="${v * 0.425}" width="${v * 0.15}" height="${v * 0.15}" fill="white"/><image href="${framedLogo}" x="${v * 0.435}" y="${v * 0.435}" width="${v * 0.13}" height="${v * 0.13}"/></svg>`,
      );
    }
  }
  return { png: canvas.toDataURL("image/png"), svg };
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function exportQr(
  format: "png" | "svg" | "pdf",
  result: { png: string; svg: string },
  filename: string,
) {
  if (format === "png") {
    const blob = await fetch(result.png).then((r) => r.blob());
    downloadBlob(blob, `${filename}.png`);
  } else if (format === "svg")
    downloadBlob(
      new Blob([result.svg], { type: "image/svg+xml" }),
      `${filename}.svg`,
    );
  else {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: [100, 100] });
    doc.addImage(result.png, "PNG", 0, 0, 100, 100);
    doc.save(`${filename}.pdf`);
  }
}
