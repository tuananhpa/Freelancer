# Prompt chỉnh A2

Công cụ image_gen built-in; ảnh A người dùng đính kèm là tham chiếu. Bản cuối: A2-truong-hoc-xanh-luong-qr.png. Bản sửa chưa được người dùng duyệt.

## Prompt chính

Use case: ui-mockup edit. Edit the attached reference mockup A into a polished revised version A2, preserving green school aesthetic, header, pale green hero, leaf accents, consistent clean outline icons, brand placeholder names/logo and school image placeholder. Output ONE raster image same landscape 1536x1024 canvas with large desktop web screenshot left and corresponding mobile viewport right. This is a layout redesign based on corrected user journey, NOT code. Vietnamese text with accurate diacritics, Be Vietnam Pro visual typography, readable mobile text, large touch targets. Outside UI title 'A2 — Trường học xanh' and small caption 'Số liệu minh họa • Bản chỉnh luồng QR'.
NEW USER FLOW: user scans PHYSICAL QR on bin first, opens website, logs in/registers if needed, then this screen awaits actual confirmed transaction. The visible student is already logged in and approved, class 11T1; retain existing approved badge as illustration, not a policy for pending registrations. Do not render separate sign-in form on this signed-in home page.
CRITICAL redesign: remove all 'Quét QR trên thùng' buttons from desktop and mobile. Put a PROMINENT current-session panel in upper hero left replacing giant marketing headline/scan action. School-photo placeholder stays hero right on desktop. Hero introduction smaller 'Cùng lớp phân loại rác'. Current session exact text:
'Phiên bỏ rác'
'Thùng R01' (illustrative bin ID)
'Học sinh • Lớp 11T1'
Use compact small completed check indicators 'Đã quét QR' and 'Đã đăng nhập'.
Main status with amber clock/loading visual: 'Đang chờ kết quả bỏ rác'.
Supporting text 'Hãy bỏ nhựa hoặc kim loại vào thùng.'
'Điểm chỉ được cộng khi xác nhận rác đã vào thùng.'
Small link 'Xem hướng dẫn'.
Do NOT show detection completed, identified plastic, sensor success, additional points, or a fake automatically advancing stepper. No buttons to confirm waste manually, no button to pretend successful deposit. No Firebase/database/ESP32/Edge Impulse technical words anywhere in student UI. No fake school image/name/logo.
Retain lower horizontal personal and class points strip 'Điểm cá nhân' 120; 'Điểm lớp 11T1' 1.250, clearly existing balance, no change shown.
Retain accepted waste type section 'Rác được nhận' with consistent plastic bottle/can icons and labels 'Nhựa', 'Kim loại'.
Retain history 'Lịch sử của bạn': completed PAST rows 'Nhựa', 'Hôm nay 08:15', '+10 điểm', 'Thành công'; 'Kim loại', 'Hôm qua 16:40', '+20 điểm', 'Thành công'. Distinguish these past successes from waiting CURRENT session.
Retain weekly ranking 'Thi đua tuần này', '12–18/10', columns 'Lớp', 'Điểm', 'Lượt bỏ rác', rows 11T2 1.480 74; 11T1 1.250 63; 11T3 980 49.
Remove old bottom duplicate current-session waiting strip and avoid repeating current session. Instead small helpful footer text 'Lần sau, quét QR trên thùng để bắt đầu phiên mới.' This is guidance, not scan action.
MOBILE: Current session and waiting status FIRST just below header; tiny photo placeholder can follow later. Then personal/class points, waste types, history/ranking naturally below scroll; keep viewport uncluttered rather than squeezing all rows. Mobile no scan CTA. Preserve green airy school feel rather than switch to teal dashboard C. No admin content. Front-facing flat screenshots without perspective, sharp text, cohesive high fidelity.


## Sửa vùng giữ chỗ

Edit only two photo placeholder rectangles in this A2 UI mockup: the large rectangle on desktop hero right and the smaller rectangle in mobile just below current session. REMOVE ALL school/building/sky/tree photographic imagery inside both rectangles completely. Replace the entirety of each rectangle with a uniform pale cool gray fill #E5E7EB, a simple gray outline image placeholder icon centered, and existing Vietnamese text 'Ảnh trường sẽ bổ sung'. There must be zero buildings, zero trees, zero photographic detail inside placeholders, just flat gray empty areas. Do not invent any real school image. Preserve absolutely all other UI, text, scores, layout, green leaf decorations OUTSIDE placeholder rectangles, desktop/mobile frames and exact canvas size 1536x1024 unchanged. Keep image fully opaque.

