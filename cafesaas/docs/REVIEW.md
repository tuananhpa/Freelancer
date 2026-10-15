# Frontend final review —15/10/2026

Review read-only bởi reviewer độc lập theo executing-plans/requesting-code-review. Không sửa file hoặc Git refs. Không có Critical findings.

## Findings và xử lý

6 Important đều tái hiện rồi sửa:
1. Stale tab overwrite: snapshot/version guard, reject stale mutation thay vì xóa order/payment của tab khác.
2. Merge served+accepted: giữ item states, derive trạng thái aggregate để món mới còn xuất hiện KDS.
3. Split đổi line IDs: remap itemStates cho line IDs mới.
4. Zero-price split: ratio theo số lượng khi subtotal0, validate finite integer totals.
5. Archived branch history: dashboard và selector report vẫn chứa archived branch, có nhãn.
6. Duplicate split bill numbers: cấp số bill mới theo order sequence, giữ lineage trong events.

Minor đã xử lý: owner-only bank control khớp permission matrix; customer own-order tracking qua reload; connection label đổi khi offline.

Bằng chứng RED:8 regression mới thất bại/34 pass trước sửa.
GREEN:42/42 unit tests,16 nhóm browser checks sau sửa. Xem FRONTEND_VERIFICATION.md.
Không dispatch thêm reviewer lặp lại; dùng regression và full suite để chứng minh sửa.

## Các phần review không đánh giá

Auth/tenant isolation production, đồng bộ giữa thiết bị, bank settlement/app-bank acceptance, hóa đơn provider, in thật và production scalability nằm ngoài frontend fixtures phase. Không coi thiếu những phần này là “đã có” hoặc production-ready.
UI/browser QA do root kiểm tra desktop/mobile và screenshot, có giới hạn ghi rõ.
