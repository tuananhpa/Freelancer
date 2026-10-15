# Verification — preparation phase

Ngày14/10/2026, Asia/Ho_Chi_Minh. Scope: tài liệu và raster mockups; chưa có implementation.

## Checks đã chạy

PowerShell validation exit0:
-13 tài liệu bắt buộc tồn tại và không rỗng, gồm8 deliverables chính, README, brief, design selection, MASTER PROMPT và prompt set.
-Markdown local links đều trỏ file hiện hữu; code fences cân bằng.
-4PNG A-menu, B-tables, C-queue, Admin-dashboard đều1536×1024, đúng signature PNG.
-SHA256 mỗi file copy bằng file gốc imagegen.
-17files lúc kiểm tra, chỉ .md/.png;0product files. File verification này tạo sau check.
-Git scoped status cafesaas: untracked folder; không stage/commit changes sibling projects.

## Visual review

Ảnh được quan sát inline sau generation. A/B/C cùng giỏ115.000đ và trạng thái chưa thu; hướng layout khác nhau. Admin branch rows tổng2.300.000+1.150.000 =3.450.000;cash1.150.000+transfer2.300.000 cùng total; số bill20+10=30. Bill unpaid115.000 tách tiền thu.
C có ngày tham khảo tự sinh, một số punctuation/font/nhãn khác brief. Đã ghi giới hạn trong DESIGN_SELECTION.md; code sau sẽ theo contract/day thật, không theo text từng pixel. Chưa được chủ dự án chọn/mix.

## Document self-review

Tenant/branch context, composite FK, CAS/zero-row transaction guard, idempotency, snapshots, frozen bill QR, overpayment credit, report local-date windows, original receipt vs copies/e-invoice, print uncertainty và provider-disabled gates đều có mô tả và test case tương ứng.
Yêu cầu bổ sung Admin CRUD và dashboard ngày/cơ sở đã ghi vào brief, PLAN, API, SECURITY, TEST_PLAN và design scope.
Thông tin Cloudflare/VietQR được đối chiếu official docs, URL nằm DEPLOYMENT.md; chưa xác nhận account subscription/terms/provider contract.

## Chưa kiểm thử

Không có package.json/source/migrations, nên chưa chạy build/lint/unit/API/E2E hay migration tests.
Chưa có live VietQR generation/transfer confirmation, ngân hàng, invoice provider, printer hardware, auth hoặc server/database chạy.
Không dùng check tài liệu làm bằng chứng production-ready. Các test trong TEST_PLAN.md và commands PLAN.md là kế hoạch chưa thực thi.
