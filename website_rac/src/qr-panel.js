import {icon} from './icons.js';
import {escapeHTML as e} from './repository.js';
export function qrOutput(qr) {
  if(!qr.result)return '<p class="qr-empty">Nhập thông tin rồi tạo QR để xem và tải ảnh.</p>';
  const {image,url,binId}=qr.result,hostname=new URL(url).hostname;
  const local=['localhost','127.0.0.1','[::1]'].includes(hostname);
  return `<div class="qr-result"><figure><img src="${e(image)}" alt="Mã QR mở phiên bỏ rác tại thùng ${e(binId)}" width="240" height="240"><figcaption>Thùng ${e(binId)}</figcaption></figure><div class="qr-details"><strong>Mã QR đã sẵn sàng</strong><p>Quét mã để mở website và xác định thùng ${e(binId)}.</p><label for="qr-result-url">Link trong mã QR</label><input id="qr-result-url" value="${e(url)}" readonly><div class="qr-actions"><a class="button primary" href="${e(image)}" download="qr-thung-${e(binId)}.png">Tải ảnh PNG</a><button class="button secondary" type="button" data-action="copy-qr">Sao chép link</button></div>${local?'<p class="small-note qr-local-note">Link localhost chỉ dùng trên máy này. Nhập link Tunnel hoặc domain để điện thoại khác truy cập.</p>':''}<p class="small-note">Ảnh PNG 1.024 × 1.024 px, có khoảng trắng quanh mã để in và quét rõ.</p></div></div>`;
}
export function qrPanel(ctx) {
  const qr=ctx.qr;
  return `<section class="panel spacious settings-panel qr-panel" aria-labelledby="qr-title"><h2 id="qr-title">${icon('qr')} Tạo mã QR cho thùng rác</h2><p class="muted">Tạo mã để học sinh quét và mở đúng phiên bỏ rác.</p><form id="qr-form"><div class="two-fields qr-fields"><label for="qr-base-url">Địa chỉ website<input id="qr-base-url" name="qrBaseUrl" type="url" value="${e(qr.base)}" required maxlength="1000" placeholder="https://link-cua-ban.trycloudflare.com"></label><label for="qr-bin-id">Mã thùng<input id="qr-bin-id" name="qrBinId" value="${e(qr.binId)}" required maxlength="3" placeholder="R01" autocomplete="off"></label></div><p class="small-note">Dùng địa chỉ web đang hoạt động. Nếu link Quick Tunnel đổi, tạo lại QR bằng link mới.</p><p class="form-error" role="alert" tabindex="-1"></p><button class="button primary" type="submit">${icon('qr')} Tạo mã QR</button></form><div class="qr-output" aria-live="polite">${qrOutput(qr)}</div></section>`;
}
