"""Build product data + images for the web app.

Run from repo root:  python web/scripts/build_data.py
Inputs : site/data/scan_products_vi.json, site/assets/img/scan/*.png, "ATi brochure Vietnamese.pdf"
Outputs: web/src/data/{scan,ati}.json, web/public/img/{scan,ati}/...
"""
import json, os, re, shutil, unicodedata
import fitz
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WEB = os.path.join(ROOT, 'web')
OUT_DATA = os.path.join(WEB, 'src', 'data')
OUT_IMG = os.path.join(WEB, 'public', 'img')


def slugify(s):
    s = unicodedata.normalize('NFD', s.lower().replace('đ', 'd'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


# ---------------------------------------------------------------- s::can
# Vietnamese translations of the official Badger Meter descriptions (description_en).
SCAN_VI = {
    '539': 'spectro::lyser V3 phân tích các chỉ tiêu chất lượng nước theo thời gian thực bằng công nghệ quang phổ tiên tiến. Kết nối với thiết bị di động để truy cập và quản lý dữ liệu thuận tiện. Thiết kế bền chắc, giao diện dễ dùng, cung cấp thông tin giá trị cho quản lý nguồn nước và quan trắc môi trường.',
    '480': 'Đầu dò đa chỉ tiêu đo amoni trực tuyến. Thiết bị tin cậy, vượt trội so với máy phân tích truyền thống về độ ổn định phép đo và tuổi thọ. Độ chính xác được đảm bảo nhờ bù giá trị amoni theo thời gian thực với nhiệt độ, kali và điện cực tham chiếu hiệu năng cao.',
    '527': 'spectro::lyser UV đo các bước sóng UV riêng biệt để xác định từng loại ô nhiễm cụ thể. Phù hợp cho nước thải, nước mặt và nước uống.',
    '525': 'spectro::lyser V3 Industrial ATEX được thiết kế cho độ chính xác và độ bền. Từ nhà máy lọc dầu, cống thoát đến nhà máy xử lý nước thải, thiết bị giám sát tin cậy cho những ứng dụng công nghiệp khắc nghiệt nhất.',
    '538': 'spectro::lyser V3 Titanium phù hợp cho các ứng dụng công nghiệp có tính ăn mòn cao và lắp đặt trong nước biển.',
    '531': 'carbo::lyser đo các chỉ tiêu carbon hữu cơ như UV254, TOC, DOC, COD, BOD, cùng độ đục và chất rắn (TSS/TS). Dùng được từ nước tinh khiết đến nước thải công nghiệp. Hiệu chuẩn sẵn cho từng loại nước và ứng dụng giúp sử dụng dễ dàng.',
    '521': 'chlodi::lyser là cảm biến ampe đo chlorine dioxide. Phù hợp mọi loại xử lý nước, cho kết quả ổn định kể cả khi pH, nhiệt độ và lưu lượng dao động mạnh.',
    '534': 'chlori::lyser là cảm biến đo clo tự do hoặc clo tổng không phụ thuộc pH và lưu lượng. Dung dịch điện phân đệm bên trong cho phép đo độc lập pH trong khoảng pH 4–9; hệ 3 điện cực cho kết quả cực kỳ ổn định. Độ chính xác cao kể cả khi pH, nhiệt độ và lưu lượng dao động mạnh.',
    '522': 'condu::lyser là đầu dò không cần bảo trì, ổn định lâu dài, đo độ dẫn điện trực tuyến có bù nhiệt tự động. Lắp trực tiếp trong môi trường đo hoặc trong buồng dòng chảy, đo theo nguyên lý tiếp xúc hoặc cảm ứng với độ chính xác cao.',
    '535': 'hyper::lyser là cảm biến ampe đo hydrogen peroxide (H2O2). Phù hợp mọi loại xử lý nước, cho kết quả ổn định kể cả khi pH, nhiệt độ và lưu lượng dao động mạnh. Chịu được chất hoạt động bề mặt mạnh.',
    '536': 'nitro::lyser đo nồng độ nitrat, độ đục và chất rắn. Giá trị nitrat hiển thị không bị ảnh hưởng chéo bởi các nhóm chất khác như carbon hữu cơ hay tổng chất rắn.',
    '528': 'oxi::lyser là đầu dò quang học đa chỉ tiêu đo oxy hoà tan (DO) và nhiệt độ trực tiếp trong nước. Không cần lưu lượng tối thiểu để đo chính xác, tích hợp đo nhiệt độ để hiệu chỉnh trực tuyến. Hầu như không cần hiệu chuẩn và bảo trì.',
    '532': 'ozo::lyser được tối ưu để đo nồng độ ozone hoà tan trong nước trực tuyến và tại chỗ (in situ). Là giải pháp thay thế cho cảm biến ozone điện hoá truyền thống.',
    '537': 'peroxy::lyser là cảm biến ampe đo axit peracetic. Phù hợp nhiều loại xử lý nước, cho kết quả ổn định kể cả khi pH, nhiệt độ và lưu lượng dao động mạnh.',
    '518': 'pH::lyser đo pH và nhiệt độ theo thời gian thực, trực tiếp trong môi trường hoặc trong buồng dòng chảy. Hoạt động trong điều kiện khắc nghiệt và trong nước có độ dẫn điện rất thấp.',
    '529': 'uv::lyser giám sát độ đục, tổng chất rắn lơ lửng và tối đa 4 bước sóng riêng trong khoảng 200–720 nm. Phù hợp cho nước mặt, nước ngầm, nước uống và nước thải.',
    '530': 'multi::lyser kết hợp carbo::lyser và nitro::lyser, đo carbon hữu cơ và nitrat (NO3-N/NO3) cho nước mặt, nước ngầm, nước uống và nước thải.',
    '479': 'Đầu dò đa chỉ tiêu đo amoni trực tuyến. Thiết bị tin cậy, vượt trội so với máy phân tích truyền thống về độ ổn định phép đo và tuổi thọ. Độ chính xác được đảm bảo nhờ bù giá trị amoni theo thời gian thực với nhiệt độ, pH, kali và điện cực tham chiếu hiệu năng cao.',
    '517': 'redo::lyser là cảm biến ổn định lâu dài, không cần bảo trì, đo thế oxy hoá–khử (ORP) trực tuyến, nhúng trong môi trường đo hoặc lắp trong buồng dòng chảy.',
    '523': 'soli::lyser là đầu dò quang học đo nồng độ chất rắn lơ lửng trực tiếp trong nước. Đo theo nguyên lý hấp thụ hồng ngoại nên kết quả không bị ảnh hưởng bởi màu nước.',
    '520': 'Từ ứng dụng cần tối ưu chi phí đến mạng lưới nước thông minh độ phân giải cao, đầu dò quang phổ đa chỉ tiêu i::scan kết hợp hiệu năng của máy quang phổ đa bước sóng với chi phí thấp của quang kế đơn giản.',
    '445': 'Cấp khí nén cho oxi::lyser, soli::lyser, ammo::lyser và các đầu dò quang phổ.\n- Làm sạch cặn bám bằng khí nén\n- Vỏ nhôm IP65, gắn tường\n- Tuỳ chọn phiên bản 12 VDC hoặc 110 VAC\n- Có bộ gá lắp lên lan can',
    '448': 'Điện cực chọn lọc ion đo nồng độ amoni dùng cho ammo::lyser.\n- Cấp bảo vệ: IP68 (khi lắp trong vỏ)\n- Ứng dụng: nước thải, nước mặt và nước uống',
    '465': 'ana::tool phát hiện điều kiện bất thường, giúp người vận hành phản ứng kịp thời với sự cố trong hệ thống giám sát; xác định trạng thái bình thường của dữ liệu và phát cảnh báo khi có sai lệch đáng kể.\n- Giao diện mở cho mọi loại cảm biến và thiết bị đo\n- Kiểm tra dữ liệu trực tuyến trước khi phát hiện sự kiện, giảm đáng kể cảnh báo giả\n- Giao diện đồ hoạ cho cái nhìn tổng quan toàn trạm\n- Giao diện web, truy cập mọi lúc mọi nơi\n- Tận dụng tối đa dữ liệu phổ\n- Có chỉ báo độ nhạy cảnh báo hiện tại\n- Tự học theo cửa sổ thời gian trượt, tự thích nghi với thay đổi chậm của nền nước\n- Tự giảm độ nhạy khi thành phần nước thay đổi liên tục',
    '470': 'auto::blade là phụ kiện làm sạch cơ học cho đầu dò quang phổ.\n- Lắp trên buồng dòng chảy nước thải F-48-V3\n- Lưỡi gạt thay thế được\n- Bộ làm sạch kèm cụm van\n- Quang trình: 5 mm',
    '469': 'Giá đỡ giúp lắp đặt chìm cảm biến Badger Meter đúng cách và dễ dàng.\n- Tương thích cáp cảm biến và ống khí nén\n- Lắp bằng ống: 50 mm\n- Vật liệu: PVC và thép không gỉ',
    '473': 'Dung dịch hỗ trợ làm sạch cửa sổ đo của các đầu dò quang phổ.\n- Tẩy cặn bám cứng đầu trên cửa sổ đo bằng hoá chất\n- Hiệu quả với dầu mỡ và cặn hữu cơ',
    '474': 'Hỗ trợ làm sạch tự động phần tử đo của oxi::lyser, soli::lyser, ammo::lyser và đầu dò quang phổ.\n- Loại bỏ cặn bám, trầm tích và tắc nghẽn bằng khí nén hoặc nước\n- Dùng cùng máy nén khí cho đầu dò quang phổ và cảm biến',
    '499': 'Biến máy tính thành trạm đầu cuối cho spectro::lyser. Hộp giao tiếp kết nối đầu dò với máy tính, nguồn khí nén và nguồn điện.\n- Cấp nguồn và kết nối cho đầu dò quang phổ và cảm biến\n- Cổng USB tới máy tính để truyền dữ liệu và cấu hình\n- Cổng RS485 tới SCADA, tích hợp Modbus RTU\n- Điều khiển van làm sạch cho bảo trì tự động\n- Nguồn 12/24 VDC và 110/230 VAC',
    '501': 'Kết nối spectro::lyser V3 qua WLAN, dùng giao diện web Io-Tool để cấu hình đầu dò và hiển thị dữ liệu.\n- Kết nối một đầu dò spectro::lyser V3 và một thiết bị làm sạch\n- Mở rộng mạng cảm biến con::cube và con::lyte cho khoảng cách xa hơn, nhiều cảm biến hơn\n- Cổng RJ45 cho mạng có dây',
    '475': 'Cáp nối dài cho cảm biến với đầu nối IP68, linh hoạt theo điều kiện lắp đặt.\n- Ba chiều dài: 10 m, 20 m hoặc 30 m',
    '477': 'Cáp nối dài cho đầu dò quang phổ với đầu nối IP67, linh hoạt theo điều kiện lắp đặt.\n- Ba chiều dài: 10 m, 20 m hoặc 30 m',
    '478': 'Vali hiện trường cấp nguồn và giám sát từ xa cho đầu dò quang phổ.\n- Hoạt động độc lập\n- Không cần nguồn điện ngoài\n- Dùng từ xa',
    '484': 'Buồng dòng chảy có chổi tự động cho spectro::lyser, quang trình 100 mm, giúp lắp đặt dạng dòng chảy qua dễ dàng.\n- Cho ứng dụng cần làm sạch tự động thường xuyên\n- Chổi xoay làm sạch cửa sổ quang mà không cần tháo đầu dò\n- Quang trình: 100 mm',
    '485': 'Buồng dòng chảy có chổi tự động cho spectro::lyser, quang trình 35 mm.\n- Cho ứng dụng cần làm sạch tự động thường xuyên\n- Chổi xoay làm sạch cửa sổ quang mà không cần tháo đầu dò\n- Vật liệu: POM-C\n- Quang trình: 35 mm',
    '486': 'Buồng dòng chảy để lắp condu::lyser, chlori::lyser, redo::lyser và pH::lyser dạng dòng chảy qua.\n- Cho ứng dụng nước uống không cần làm sạch tự động\n- Vật liệu: POM-C',
    '487': 'Buồng dòng chảy cho một i::scan và tối đa ba đầu dò vật lý.\n- Tuỳ chọn chổi tự động làm sạch cho i::scan\n- Vật liệu: POM-C',
    '488': 'Khớp dòng chảy bằng PVC để đo nước thải hoặc nước mặt ở nhánh rẽ (by-pass) với ammo::lyser.\n- Ứng dụng: nước thải và nước mặt\n- Vật liệu: PVC',
    '489': 'Buồng dòng chảy để lắp pH::lyser, redo::lyser và condu::lyser.\n- Ứng dụng: nước thải\n- Vật liệu: PVC\n- Cho ứng dụng không cần làm sạch tự động',
    '490': 'Buồng dòng chảy để lắp đầu dò quang phổ dạng dòng chảy qua.\n- Vật liệu: POM-C\n- Quang trình: 100 mm\n- Đầu nối ống: 1/2 inch (12 mm)\n- Cho ứng dụng không cần làm sạch tự động',
    '493': 'Buồng dòng chảy để lắp đầu dò quang phổ dạng dòng chảy qua.\n- Vật liệu: POM-C\n- Quang trình: 0,5–35 mm\n- Đầu nối ống: 1/2 inch (12 mm)',
    '492': 'Buồng dòng chảy để lắp một đầu dò quang phổ trong ứng dụng nước thải.\n- Ứng dụng: nước thải\n- Vật liệu: PVC',
    '491': 'Giá đỡ kết nối với đầu dò quang phổ i::scan.\n- Vật liệu: PVC, POM-C\n- Lắp đặt chìm\n- Ba hướng gá: ngang, dọc và nghiêng 45°',
    '483': 'Ống trượt đa năng giúp định tâm đầu dò quang phổ, quang trình 100 mm.\n- Dùng cho đầu dò quang phổ\n- Đo phổ trong phòng thí nghiệm\n- Quang trình: 100 mm',
    '482': 'Ống trượt đa năng giúp định tâm đầu dò quang phổ, quang trình tới 35 mm.\n- Dùng cho đầu dò quang phổ\n- Đo phổ trong phòng thí nghiệm\n- Quang trình: 0,5–35 mm',
    '452': 'Điện cực chọn lọc ion đo pH dùng cho ammo::lyser.\n- Ứng dụng: nước thải, nước mặt và nước uống\n- Dùng với: cảm biến ammo::lyser\n- Đo: pH',
    '463': 'Điện cực chọn lọc ion đo nồng độ kali dùng cho ammo::lyser.\n- Ứng dụng: nước thải, nước mặt và nước uống\n- Dùng với: cảm biến ammo::lyser\n- Đo: nồng độ kali',
    '481': 'Cho phép lắp và tháo đầu dò i::scan khi đường ống đang có áp, không cần ngắt dòng chảy.\n- Dùng với: đầu dò quang phổ i::scan\n- Khoan có áp cho ống PE, PVC, DCI, thép và AC\n- Vật liệu: thép\n- Kết nối: đai khởi thuỷ có van và gioăng (DN50–DN300, kích thước khác theo yêu cầu)',
    '464': 'Điện cực tham chiếu bền, ổn định cho ammo::lyser, đo nhiều chỉ tiêu trong nước thải, nước mặt hoặc nước uống.\n- Tuổi thọ dài (khoảng 3 năm)\n- Điện cực rắn, không xốp\n- Độ trôi nhỏ hơn điện cực thông thường\n- Cấp bảo vệ: IP68 (khi lắp trong vỏ)',
    '456': 'ruck::sack là phụ kiện gắn cho đầu dò quang phổ và i::scan, có chổi tự động chìm và chổi thay thế được.\n- Chổi tự động chìm cho đầu dò quang phổ và i::scan\n- Chổi thay thế được\n- Vỏ che chống tắc chổi\n- Nhiều quang trình: 5 mm, 15 mm và 35 mm',
    '468': 'Buồng dòng chảy để lắp i::scan trong nước thải.\n- Ứng dụng: nước thải\n- Vật liệu: PVC',
    '467': 'Khớp nhánh rẽ (bypass) cho một đầu dò i::scan.\n- Tuỳ chọn chổi tự động làm sạch cho i::scan\n- Vật liệu: POM-C\n- Có loại kèm hoặc không kèm chổi tự động',
    '462': 'Giá đỡ giúp lắp chìm đầu dò quang phổ dễ dàng.\n- Đi kèm được cả cáp đầu dò và ống khí nén\n- Vật liệu: PVC và POM-C\n- Hai hướng gá: ngang và dọc',
    '447': 'Chổi làm sạch cửa sổ đo quang của đầu dò quang phổ, loại bỏ cặn bám và giữ cửa sổ quang trong suốt.',
    '461': 'Đầu gá thép không gỉ giúp lắp và tháo nhanh đầu dò quang phổ và cảm biến lắp tại chỗ.\n- Vật liệu: thép không gỉ',
    '460': 'Miếng chèn giúp thay đổi quang trình của đầu dò quang phổ V2.\n- Vật liệu: thép không gỉ\n- Kèm gioăng, cửa sổ đo sapphire và dụng cụ bảo dưỡng\n- Năm quang trình: 0,5 mm, 1 mm, 2 mm, 5 mm và 15 mm',
    '459': 'Mái che bảo vệ trạm con::cube và con::lyte khỏi thời tiết khắc nghiệt.\n- Gá cho con::cube hoặc con::lyte\n- Lắp lên tường hoặc lan can\n- Kèm phụ kiện gá lắp\n- Vật liệu: thép không gỉ',
}

MARKETS_VI = {
    'Collection System Monitoring': 'Giám sát mạng lưới thu gom',
    'Data Centers': 'Trung tâm dữ liệu',
    'Drinking Water Treatment': 'Xử lý nước cấp',
    'Environmental Monitoring': 'Quan trắc môi trường',
    'Industrial Process': 'Quy trình công nghiệp',
    'Industrial Wastewater Treatment': 'Xử lý nước thải công nghiệp',
    'Wastewater Treatment': 'Xử lý nước thải',
}
CAT_VI = {'spectrometer': 'Đầu dò quang phổ', 'sensor': 'Cảm biến vật lý', 'accessory': 'Phụ kiện'}


def build_scan():
    src = json.load(open(os.path.join(ROOT, 'site/data/scan_products_vi.json'), encoding='utf-8'))
    raw = {p['id']: p for p in json.load(open(os.path.join(ROOT, 'scan_products_raw.json'), encoding='utf-8'))}
    os.makedirs(os.path.join(OUT_IMG, 'scan'), exist_ok=True)
    out = []
    for p in src:
        slug = slugify(p['name'])
        assert p['id'] in SCAN_VI, p['id']
        Image.open(os.path.join(ROOT, 'site/assets/img/scan', slug + '.png')).save(
            os.path.join(OUT_IMG, 'scan', slug + '.webp'), quality=85)
        out.append({
            'id': 'scan-' + slug,
            'brand': 's::can',
            'name': p['name'],
            'category': p['category_slug'],
            'categoryLabel': CAT_VI[p['category_slug']],
            'parameters': [x.strip() for x in p['parameters'].split(',') if x.strip()],
            'description': SCAN_VI[p['id']],
            'markets': [MARKETS_VI[m] for m in raw[p['id']].get('markets', [])],
            'image': f'/img/scan/{slug}.webp',
            'source': p['original_url'],
        })
    assert len(out) == 57
    return out


# ---------------------------------------------------------------- ATi
# Transcribed verbatim from "ATi brochure Vietnamese.pdf". page = printed page (= book page index, 1-based);
# row = product block on that page (0..2, top to bottom).
ATI = [
    # page 4
    (4, 0, 'nuoc', 'MetriNet', 'MetriNet – Giám sát hệ thống phân phối nước thông minh', 'MetriNet cấp nguồn từ pin, cung cấp giải pháp bền bỉ, lắp ráp dạng module có thể lắp 8 cảm biến khác nhau và 16 thông số cho việc giám sát chất lượng nước trên đường ống cấp nước.', ['Tiêu thụ điện thấp', 'Có tùy chọn truyền dữ liệu không dây', 'Truyền thông Modbus, Ethernet/IP, Profibus']),
    (4, 1, 'nuoc', 'Q46N', 'Q46N – Giám sát chỉ tiêu Amoni', 'Q46N đo amoni tự do, tổng amoni và mono cloramine trong nước cấp.', ['Phương pháp cảm biến điện hóa', 'Chất xúc tác chi phí thấp', 'Dễ dàng bảo trì']),
    (4, 2, 'nuoc', '', 'Giám sát chỉ tiêu Clo dư', 'Giải pháp giám sát clo dư không dùng hóa chất xúc tác của ATi có thể đo Clo tự do, Clo tổng, Clo liên kết sử dụng cảm biến đo trực tiếp.', ['Tín hiệu xuất ra bao gồm giá trị Clo, pH và Nhiệt độ', 'Không tốn phí chất xúc tác', 'Bền bỉ theo thời gian']),
    # page 5
    (5, 0, 'nuoc', 'NephNet', 'NephNet – Giám sát độ đục cầm tay', 'Bộ giám sát cầm tay NephNet được sử dụng trong quá trình xịt rửa và làm sạch có điều khiển.', ['Giám sát liên tục, từ xa độ đục', 'Có thể được sử dụng cùng với bộ datalogger hiện hữu', 'Độ chính xác tốt hơn ở dải đo thấp']),
    (5, 1, 'nuoc', '', 'Giám sát độ đục cố định', 'Giám sát nước thô, nước thải qua màng lọc, nước thải đầu ra và các ứng dụng trong khu vực công nghệ.', ['Phù hợp với tiêu chuẩn EPA 180.1/ ISO 7027', 'Phù hợp tiêu chuẩn kiểm định và cân chỉnh chất rắn', 'Phương pháp hiệu chuẩn dễ dàng']),
    (5, 2, 'nuoc', '', 'Giám sát chỉ tiêu UV254', 'Đo lường độ hấp thụ bước sóng UV254 cung cấp giá trị thời gian thực về hàm lượng các chất hữu cơ.', ['Đo UV254 và độ đục', 'Nhiều dải đo khác nhau', 'Tùy chọn làm sạch tự động Q-clean']),
    # page 6
    (6, 0, 'nuoc', '', 'Giám sát chỉ tiêu Flo', 'Giám sát liên tục nồng độ Flo để đảm bảo lượng Flo được châm vừa đủ.', ['Bộ đệm (buffer) chi phí thấp đảm bảo độ chính xác', 'Cân chỉnh 2 điểm tự động', 'Đo trực tiếp theo phương pháp ion điện hóa']),
    (6, 1, 'nuoc', 'Sitebox', 'Sitebox – Hệ thống đo chất lượng nước dạng xách tay', 'Có thể xách tay di chuyển được, Sitebox là hệ thống đo chất lượng nước có thể được di chuyển dễ dàng theo cơ chế "nhấc lên và di chuyển".', ['Có thể giám sát dữ liệu thực trong vòng 30 phút', 'Được cấu hình cho việc kiểm định gồm hai dòng, ba dòng và nhiều dòng chảy', '8 cảm biến và 16 thông số được giám sát']),
    (6, 2, 'nuoc', '', 'Panel đo chất lượng nước', 'Giám sát online đa chỉ tiêu trong hệ thống phân phối nước cấp và các hệ thống xử lý nước cấp.', ['Tùy chỉnh thông số đo theo yêu cầu', 'Các tính năng có thể được thiết kế phù hợp theo yêu cầu', 'Nhiều phương án truyền dữ liệu']),
    # page 7
    (7, 0, 'nuoc', '', 'Giám sát oxy tồn dư', 'Hệ thống đo điện hóa tin cậy cho các chất oxi hóa sử dụng trong hệ thống khử khuẩn hay xử lý.', ['Ô-zôn', 'Clo oxit', 'Ôxi già', 'Axit peracetic']),
    (7, 1, 'nuoc', '', 'Đo giám sát permanganate', 'Giám sát chất lượng nước liên tục qua chỉ tiêu permanganate trong giai đoạn tiền xử lý giúp ngăn ngừa các vấn đề đổi màu.', ['Chất xúc tác chi phí thấp', 'Dễ bảo trì']),
    (7, 2, 'nuoc', '', 'Giám sát đo o-Phosphate', 'Đảm bảo việc kiểm soát ăn mòn với việc giám sát liên tục online lượng hóa chất o-Phosphate được đưa vào xử lý.', ['Tự bù độ trôi điểm zero', 'Cảnh báo chất xúc tác mức thấp', 'Không cần các hiệu chuẩn bên ngoài']),
    # page 8
    (8, 0, 'nuoc', '', 'Giám sát ôxi hòa tan', 'Điều khiển luồng không khí để tối ưu quá trình sục khí, từ đó tiết kiệm năng lượng.', ['Cảm biến quang', 'Bộ Q-blast độc đáo tự làm sạch', 'Bảo trì thấp']),
    (8, 1, 'nuoc', '', 'Bộ "tách khí - air stripping" tổng Clo', 'Giám sát nước thải đầu ra sử dụng phương pháp định lượng I-ốt cho việc phát hiện tổng Clo.', ['Đạt chuẩn EPA', 'Cảm biến pha khí tránh cảnh báo giả', 'Độ nhạy đo đến mức ppm']),
    (8, 2, 'nuoc', '', 'Giám sát Sulfite', 'Cung cấp cho việc vận hành với công cụ tin cậy trong việc giảm chi phí châm hóa chất ở khu vực công nghệ khử clo.', ['Giảm chi phí châm hóa chất đắt đỏ', 'Cảm biến pha khí giúp ngăn ngừa cảnh báo giả', 'Tự động làm sạch đường trích mẫu']),
    # page 9
    (9, 0, 'nuoc', '', 'Giám sát chất rắn lơ lửng/ nồng độ bùn hoạt tính MLSS', 'Đo chất rắn lơ lửng/ nồng độ bùn hoạt tính MLSS trong bể sục khí hỗ trợ việc điều khiển quá trình xử lý và cung cấp các cảnh báo khi có điều kiện bất thường xảy ra.', ['Giám sát thời gian thực', 'Duy trì mức MLSS tối ưu', 'Tùy chọn bộ tự làm sạch Q-blast']),
    (9, 1, 'nuoc', '', 'Giám sát Sulfide', 'Công nghệ "Tách khí - air stripping" giúp loại bỏ được việc cảm biến tiếp xúc với quy trình công nghệ, loại bỏ được các vấn đề bám bẩn.', ['Chất xúc tác chi phí thấp', 'Cảm biến pha khí ngăn ngừa cảnh báo giả', 'Làm sạch tự động đường lấy mẫu']),
    (9, 2, 'nuoc', '', 'Đo nitrite', 'Thu thập thông tin chính xác với cảm biến nitrite cho việc cảnh báo sớm quá trình nitrat hóa trong hệ thống cung cấp nước trên mạng lưới.', ['Giới hạn phát hiện 10ppb', 'Không cần chất xúc tác', 'Chi phí bảo trì thấp']),
    # page 10
    (10, 0, 'nuoc', '', 'Giám sát độ dẫn điện', 'Giám sát độ dẫn, độ kháng, tổng chất rắn lơ lửng, nồng độ hóa chất với đa cấu hình.', ['Đo độ dẫn 2 điện cực', 'Đo các ứng dụng chung dùng 4 điện cực']),
    (10, 1, 'nuoc', '', 'Giám sát pH/ORP', 'Cảm biến đo pH, đo vi sai pH với nhiều cách lắp đặt khác nhau cho thời gian vận hành lâu dài.', ['Chi phí bảo trì thấp', 'Tùy chọn tự động làm sạch Q-blast']),
    (10, 2, 'nuoc', 'FilterSmart', 'FilterSmart – Giám sát quá trình rửa ngược (backwash), lớp bùn (sludge blanket)', 'FilterSmart cho phép giám sát quá trình rửa ngược backwash bằng cách đo mức của bùn lắng và độ đục, tích hợp trong 1 cảm biến.', ['Giảm thiểu nhất việc sử dụng nước', 'Tối ưu nhất thời gian sử dụng bộ lọc', 'Sử dụng để chạy bơm WAS và RAS']),
    # page 12
    (12, 0, 'khi', 'D16', 'D16 Bộ phát hiện khí rò rỉ cầm tay', 'PortaSens III là bộ phát hiện rò rỉ khí được tích hợp bộ ghi dữ liệu (datalogger) có dung lượng 6GB.', ['Các module khí dạng "Cảm biến thông minh"', 'Bơm lấy mẫu tích hợp', 'Màn hình giao diện cảm ứng dễ sử dụng']),
    (12, 1, 'khi', 'F12', 'F12 Bộ phát hiện khí độc', 'Các bộ chuyển đổi tín hiệu (transmitter) loại 2 dây có chống cháy nổ tiêu chuẩn Ex intrinsic safety, sử dụng nguồn một chiều DC hoặc xoay chiều AC, trang bị nhiều cảnh báo khí.', ['Các module khí dạng "Cảm biến thông minh"', 'Thao tác sử dụng qua 4 nút nhấn', 'Kiểm tra báo động (Bump test) tự động']),
    (12, 2, 'khi', 'D12', 'D12 Bộ phát hiện khí độc và khí cháy', 'Bộ phát hiện khí có thể đo được 30 loại khí độc khác nhau, hoặc cảm biến xúc tác cho việc đo theo LEL.', ['Các module khí dạng "Cảm biến thông minh"', 'Giao diện sử dụng chạm cảm ứng từ', 'Kiểm tra báo động (bump test) tự động']),
    # page 13
    (13, 0, 'khi', 'A14/A11', 'A14/ A11 Bộ phát hiện khí module', 'GasSens là hệ thống linh hoạt cung cấp một nền tảng cho nhiều đầu đo khí thông qua nhiều ngõ vào và nhiều cảnh báo khác nhau.', ['Lên đến 12 ngõ vào cho bộ phát hiện khí', 'Chuẩn kháng nước bụi NEMA 4x (tương đương IP66)', 'Kiểm tra báo động (bump test) tự động']),
    (13, 1, 'khi', 'D12Ex-IR', 'D12Ex-IR Bộ đo khí nguyên lý hồng ngoại', 'Bộ đo khí nguyên lý hồng ngoại thiết kế chắc chắn, chống cháy nổ, có thể đo được đơn vị LEL hoặc các loại khí độc.', ['Các cảm biến cần đo LEL, nồng độ hydrocarbon cao, CO2 và N2O', 'Kiểm tra báo động (bump-test) tự động']),
    (13, 2, 'khi', 'Q45S', 'Q45S Bộ phát hiện hơi H2S (wet H2S)', 'Hệ thống giám sát mùi hôi trong môi trường có hơi bão hòa.', ['Phù hợp với các bình lọc khí thải (Scrubber)', 'Chuẩn kháng nước bụi NEMA 4x (tương đương IP66)', 'Tự động loại bỏ các giọt nước (droplet removal)']),
    # page 14
    (14, 0, 'khi', 'B12', 'B12 Bộ đo khí 2-dây (2-wire)', 'Bộ chuyển đổi tín hiệu (transmitter) 2-dây cho các ứng dụng phát hiện khí độc, với nhiều phương án lắp đặt khác nhau.', ['Cấp nguồn bằng pin hay vòng kín (loop powered)', 'Chuẩn kháng nước bụi NEMA 4X (tương đương IP66)', 'Cảm biến tách rời hay tích hợp']),
    (14, 1, 'khi', 'B14', 'B14 Module cảnh báo khí', 'Module thu nhận tín hiệu dạng tích hợp cung cấp các cảnh báo, hiển thị và là bộ truyền tín hiệu trung gian cho hệ thống phát hiện khí.', ['Cảnh báo, báo động theo giá trị đặt', 'Hiển thị đèn LED các trạng thái cảnh báo', 'Chuẩn kháng nước bụi NEMA 4X (tương đương IP66)']),
    (14, 2, 'khi', 'B12-wet', 'B12 Bộ phát hiện khí ướt', 'Phù hợp với các ứng dụng phát iện khí ướt trong các bình lọc khí khải mà có thể bão hòa với hơi nước.', ['Bộ chuyển đổi cấp điện dạng vòng (loop power)', 'Sensor kháng ăn mòn', 'Màn hình hiện thị tại chỗ']),
    # page 15
    (15, 0, 'khi', 'C21', 'C21 Bộ lấy mẫu DRI-GAS', 'DRI-GAS loại bỏ hơi nước trong các đường khí và cung cấp mẫu khí khô.', ['Nhiều đầu ra ới lưu lượng khác nhau', 'Cảnh báo tắc nghẽn ống khí mẫu']),
    (15, 1, 'khi', 'E12-15', 'E12-15 Bộ phát hiện khí Ammonia mức cao dạng hồng ngoại', 'Bộ phát hiện khí bền bỉ, tin cậy và thông minh được sử dụng để giám sát nồng độ khí ammonia từ giá trị ppm đến giá trị cao có thể gây nổ.', ['Giá trị đo Ammonia ở giới hạn phát hiện trên là 15%', 'Có chức năng tự kiểm tra liên tục']),
    (15, 2, 'khi', 'C12-17', 'C12-17 Bộ chuyển đổi transmitter đo khí cháy nổ', 'Bộ chuyển đổi transmitter đo khí cháy nổ có thể phát hiện giới hạn cháy nổ dưới LEL.', ['Tín hiệu ngõ ra 4-20mA', 'Tùy chọn hiển thị và cảnh báo', 'Vỏ ngoài bằng thép không rỉ SS316']),
    # page 16
    (16, 0, 'khi', 'A21', 'A21 Bộ lấy mẫu khí', 'Hệ thống bơm mẫu khí có thể bơm các điểm lấy mẫu ở địa điểm khó tiếp cận, và đưa khí mẫu đến nơi thuận tiện hơn.', ['Có thể chỉnh các lưu lượng khác nhau', 'Chuẩn kháng nước bụi NEMA 4X (tương đương IP66)', 'Cảnh báo mất lưu lượng']),
    (16, 1, 'khi', 'A23-14', 'A23-14 Bộ tạo Ozone', 'Bộ tạo ozone xách tay được thiết kế để tạo ra một mẫu khí dưới 1ppm cho việc hiệu chỉnh các máy phát hiện khí.', ['Tế bào sinh ozone dạng UV', 'Bình chứa 103 lít khí (20.9% O2)', 'Trang bị bộ chỉnh lưu lượng cố định ở đầu ra']),
    (16, 2, 'khi', 'A12', 'A12 Bộ chuyển đổi transmitter khí độc/ cháy nổ', 'Bộ chuyển đổi khí có thể kết hợp với 30 loại sensor khí độc/ cháy nổ khác nhau, được trang bị vỏ chống cháy nổ.', ['Các cảm biến khí độc điện hóa', 'Cảm biến hạt xúc tác cho khí cháy nổ', 'Chức năng tự kiểm tra báo động (bump test) cho cả hai loại cảm biến']),
]
# Brochure typos kept out of the site text (source spelling errors, meaning unchanged).
TYPO_FIX = {'phát iện': 'phát hiện', 'khí khải': 'khí thải', 'ra ới': 'ra với', 'hiện thị': 'hiển thị'}

# Row bands as fractions of the trimmed page (measured on the brochure grid, identical on every product page).
ROWS = [(0.127, 0.352), (0.370, 0.594), (0.610, 0.836)]
PHOTO_X = (0.54, 0.96)
HOT_X = (0.07, 0.95)
BOOK_SIZE = (800, 1040)


def render_pages():
    """Return 20 single pages (high-res) in reading order: cover, 9 rotated spreads split in halves, back."""
    d = fitz.open(os.path.join(ROOT, 'ATi brochure Vietnamese.pdf'))

    def img(i):
        pm = d[i].get_pixmap(dpi=200)
        return Image.frombytes('RGB', (pm.width, pm.height), pm.samples)

    k = 200 / 150  # trim boxes were measured at 150 dpi
    box = lambda b: tuple(round(v * k) for v in b)
    pages = [img(0).crop(box((24, 36, 1251, 1614)))]
    for i in range(1, 10):
        sp = img(i).rotate(-90, expand=True).crop(box((15, 100, 1635, 1166)))
        w, h = sp.size
        pages += [sp.crop((0, 0, w // 2, h)), sp.crop((w // 2, 0, w, h))]
    pages.append(img(10).crop(box((24, 36, 1251, 1614))))
    assert len(pages) == 20
    return [p.resize((BOOK_SIZE[0] * 2, BOOK_SIZE[1] * 2), Image.LANCZOS) for p in pages]


def fix(s):
    for a, b in TYPO_FIX.items():
        s = s.replace(a, b)
    return s


def trim(im, pad=16):
    """Keep only the product photo: drop thin separator lines, then take the heaviest column block
    (text fragments sit left of the photo, separated by a white gap)."""
    m = np.asarray(im.convert('L')) < 238
    m = m & np.roll(m, 4, 0) & np.roll(m, -4, 0)  # erase lines thinner than ~8px
    cols = m.sum(0)
    runs, start, gap = [], None, 0
    for x, c in enumerate(list(cols) + [0] * 30):
        if c:
            start, gap = (x if start is None else start), 0
        elif start is not None:
            gap += 1
            if gap > 24:
                runs.append((start, x - gap + 1))
                start = None
    if not runs:
        return im
    mass = [cols[a:b].sum() for a, b in runs]
    big = [ab for ab, s in zip(runs, mass) if s >= 0.3 * max(mass)]  # some products show 2 photos side by side
    l, r = big[0][0], big[-1][1]
    rows = np.where(m[:, l:r].any(1))[0]
    t, b = rows[0], rows[-1] + 1
    return im.crop((max(l - pad, 0), max(t - pad, 0), min(r + pad, im.width), min(b + pad, im.height)))


def build_ati():
    pages = render_pages()
    bdir = os.path.join(OUT_IMG, 'ati', 'book')
    pdir = os.path.join(OUT_IMG, 'ati', 'products')
    os.makedirs(bdir, exist_ok=True)
    os.makedirs(pdir, exist_ok=True)
    for n, p in enumerate(pages, 1):
        p.resize(BOOK_SIZE, Image.LANCZOS).save(os.path.join(bdir, f'p{n:02d}.webp'), quality=82)

    out, seen = [], set()
    for page, row, group, code, name, desc, bullets in ATI:
        slug = slugify(code or name.split('–')[0])
        assert slug not in seen, slug
        seen.add(slug)
        y0, y1 = ROWS[row]
        im = pages[page - 1]
        W, H = im.size
        photo = trim(im.crop((int(PHOTO_X[0] * W), int(y0 * H), int(PHOTO_X[1] * W), int(y1 * H))))
        photo.save(os.path.join(pdir, slug + '.webp'), quality=85)
        out.append({
            'id': 'ati-' + slug,
            'brand': 'ATi',
            'name': name,
            'code': code,
            'category': group,
            'categoryLabel': 'Giám sát chất lượng nước' if group == 'nuoc' else 'Đo & phát hiện khí',
            'description': fix(desc),
            'bullets': [fix(b) for b in bullets],
            'image': f'/img/ati/products/{slug}.webp',
            'page': page,
            'hotspot': [HOT_X[0], y0, HOT_X[1], y1],  # x0,y0,x1,y1 as page fractions
        })
    assert len(out) == 36
    return out


def build_partner_logos():
    """Cut brand logos from the CPE Solutions cover and key out its tinted background."""
    d = fitz.open(os.path.join(ROOT, 'CPE Solutions VN.pdf'))
    pm = d[0].get_pixmap(dpi=330)
    im = Image.frombytes('RGB', (pm.width, pm.height), pm.samples)
    k = 330 / 110  # boxes measured on a 110 dpi render
    boxes = {'scan': (310, 955, 505, 1030), 'ati': (542, 955, 664, 1035), 'jsg': (703, 955, 852, 1030),
             'control-techniques': (312, 1072, 432, 1132), 'ldi': (466, 1072, 620, 1132), 'kitz': (657, 1080, 848, 1125),
             'tecnovideo': (310, 1180, 495, 1225), 'prime-tech': (514, 1172, 624, 1235), 'abc-solutions': (644, 1178, 854, 1232)}
    pdir = os.path.join(OUT_IMG, 'partner')
    os.makedirs(pdir, exist_ok=True)
    for name, b in boxes.items():
        c = np.asarray(im.crop(tuple(int(v * k) for v in b))).astype(float)
        bg = np.median(np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]]), 0)
        alpha = np.clip((np.sqrt(((c - bg) ** 2).sum(2)) - 18) * 6, 0, 255).astype(np.uint8)
        out = Image.fromarray(np.dstack([c.astype(np.uint8), alpha]), 'RGBA')
        out.crop(out.getbbox()).save(os.path.join(pdir, f'logo-{name}.png'))


if __name__ == '__main__':
    os.makedirs(OUT_DATA, exist_ok=True)
    for name, data in (('scan', build_scan()), ('ati', build_ati())):
        json.dump(data, open(os.path.join(OUT_DATA, name + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(name, len(data))
    os.makedirs(os.path.join(WEB, 'public', 'doc'), exist_ok=True)
    shutil.copy(os.path.join(ROOT, 'ATi brochure Vietnamese.pdf'), os.path.join(WEB, 'public', 'doc', 'ati-brochure.pdf'))
    for f in ('logo-cpes-ngang-transparent.png', 'logo-cpes-doc-transparent.png'):
        os.makedirs(os.path.join(OUT_IMG, 'brand'), exist_ok=True)
        shutil.copy(os.path.join(ROOT, 'site/assets/img/brand', f), os.path.join(OUT_IMG, 'brand', f))
    build_partner_logos()
    for f in ('section-river-monitoring.jpg', 'section-concube-station.jpg'):
        shutil.copy(os.path.join(ROOT, 'site/assets/img/scan', f), os.path.join(OUT_IMG, 'scan', f))
