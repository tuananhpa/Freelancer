import type { Product, Localized } from "../types/domain";
const l = (vi: string, en: string): Localized => ({ vi, en });
const shared = {
  blocks: ["hero", "story", "journey", "videos", "cta"] as Product["blocks"],
  status: "published" as const,
  demo: true,
  harvestedAt: "",
  expiresAt: "",
  certifications: [],
};
export const seedProducts: Product[] = [
  {
    ...shared,
    id: "nhan-long",
    slug: "nhan-long-pho-hien",
    name: "Nhãn lồng Phố Hiến",
    nameEn: "Pho Hien longan",
    subtitle: l("Vị ngọt từ đất Phố Hiến", "The sweet heritage of Pho Hien"),
    region: l("Phố Hiến, Hưng Yên", "Pho Hien, Hung Yen"),
    season: l("Tháng 7 – tháng 8", "July – August"),
    image: "/media/nhan-long.webp",
    video: "/media/nhan-long.mp4",
    gallery: [1, 2, 3].map((n) => `/media/nhan-long-scene-${n}.webp`),
    batchCode: "HY-NL-DEMO-01",
    story: l(
      "Trên mảnh đất từng vang danh với câu ca “Thứ nhất Kinh kỳ, thứ nhì Phố Hiến”, nhãn lồng là thức quà gắn bó qua bao thế hệ. Cây nhãn Tổ tại chùa Hiến vẫn được gìn giữ như một chứng nhân của vùng đất. Tên gọi “nhãn lồng” bắt nguồn từ những chiếc lồng tre người dân dùng để bảo vệ chùm quả quý. Cùi dày, giòn mọng, vị ngọt thanh và hương thơm tinh tế là kết tinh của phù sa sông Hồng và kinh nghiệm canh tác được trao truyền. Từ sản vật tiến vua đến món quà quê hôm nay, mỗi trái nhãn mang theo câu chuyện về đất, về người và niềm tự hào Phố Hiến.",
      "On the banks of the Red River, Pho Hien longan has been a cherished gift for generations. The ancestral longan tree at Hien Pagoda bears witness to this heritage. Its Vietnamese name recalls the bamboo cages once used to protect precious fruit. Thick, crisp flesh and a delicate sweetness reflect the river’s fertile soil and farming knowledge passed down through families. Once offered to the royal court, today each fruit carries a story of the land, its people and the pride of Pho Hien.",
    ),
    transcript:
      "Trên mảnh đất từng vang danh với câu ca “Thứ nhất Kinh kỳ, thứ nhì Phố Hiến”, bên dòng sông Hồng màu mỡ, nhãn lồng là một thức quà đã gắn bó với nơi đây qua hàng trăm năm. Từ thuở xưa, những chùm nhãn thơm ngon nơi đây đã được tuyển chọn làm sản vật tiến vua. Tên gọi “nhãn lồng” bắt nguồn từ những chiếc lồng tre bảo vệ quả quý. Mỗi trái nhãn mang trong mình vị ngọt của quê hương và tinh hoa của một vùng đất bên dòng sông Hồng.",
    facts: [
      {
        value: "300+",
        label: l("năm tuổi cây nhãn Tổ", "years of the ancestral tree"),
      },
      {
        value: "Phố Hiến",
        label: l("miền di sản ven sông Hồng", "heritage by the Red River"),
      },
    ],
    timeline: [
      {
        date: "01",
        title: l("Chăm chút từ đất lành", "Nurtured by fertile soil"),
        detail: l(
          "Người trồng chăm sóc vườn và theo dõi sự phát triển của trái. Nhật ký cụ thể sẽ được cập nhật theo lô.",
          "Growers tend their orchards. Batch-specific records will be added by the producer.",
        ),
      },
      {
        date: "02",
        title: l("Đón mùa quả ngọt", "Harvesting the sweetness"),
        detail: l(
          "Lựa chọn chùm nhãn chín, thu hái cẩn thận để giữ chất lượng trái.",
          "Ripe clusters are carefully selected and harvested.",
        ),
      },
      {
        date: "03",
        title: l("Chọn lọc & đóng gói", "Selected and packed"),
        detail: l(
          "Phân loại và chuẩn bị đóng gói. Quy trình của nhà vườn sẽ được ghi trong hồ sơ lô hàng.",
          "Fruit is sorted and prepared for packing; actual records are supplied by the grower.",
        ),
      },
      {
        date: "04",
        title: l("Chạm QR, gặp người trồng", "Scan QR, meet the grower"),
        detail: l(
          "Gắn câu chuyện và thông tin lô với mã QR để kết nối người trồng và người thưởng thức.",
          "A QR connects the story and batch information to the people enjoying the fruit.",
        ),
      },
    ],
    faq: [
      {
        question: l(
          "Nhãn lồng có gì đặc biệt?",
          "What makes this longan special?",
        ),
        answer: l(
          "Nhãn lồng được mô tả trong kịch bản với cùi dày, giòn mọng, vị ngọt thanh và hương thơm tinh tế.",
          "Its thick, crisp flesh, delicate sweetness and fragrance are described in the supplied story.",
        ),
      },
      {
        question: l("Bảo quản nhãn thế nào?", "How should I store it?"),
        answer: l(
          "Để nơi mát, tránh nắng trực tiếp. Hãy hỏi nhà vườn về nhiệt độ và thời gian bảo quản phù hợp với lô hàng của bạn.",
          "Keep it cool and away from direct sunlight. Ask the grower for instructions for your batch.",
        ),
      },
    ],
  },
  {
    ...shared,
    id: "vai-trung",
    slug: "vai-trung-phu-cu",
    name: "Vải trứng Phù Cừ",
    nameEn: "Phu Cu egg lychee",
    subtitle: l(
      "Từ cây vải cổ đến thức quà quê",
      "From an ancestral tree to a local treasure",
    ),
    region: l("Phù Cừ, Hưng Yên", "Phu Cu, Hung Yen"),
    season: l("Tháng 5 – tháng 6", "May – June"),
    image: "/media/vai-trung.webp",
    video: "/media/vai-trung.mp4",
    gallery: [1, 2, 3].map((n) => `/media/vai-trung-scene-${n}.webp`),
    batchCode: "HY-VT-DEMO-01",
    story: l(
      "Có một thức quà Hưng Yên khi chín khoác lên sắc đỏ, dáng tròn đầy như quả trứng, cùi dày và vị ngọt thanh. Tương truyền, cụ Nguyễn Văn Diệm mang giống vải quý về trồng, để người dân gọi bằng cái tên thân thuộc “vải ông Diệm”. Tại thôn Ba Đông, cây vải cổ vẫn được hậu duệ gìn giữ qua nhiều thế hệ. Qua thời gian, cây thích nghi với thổ nhưỡng ven sông Hồng và tạo nên hương vị đặc trưng. Từ một gốc vải nơi Phù Cừ, thức quả ấy đã đi đến những thị trường mới, mang theo sự chăm chút của người trồng và tinh hoa ẩm thực quê hương.",
      "Round as an egg, with a red skin and delicately sweet flesh, this lychee is a treasure of Hung Yen. Local tradition credits Nguyen Van Diem with bringing the variety home. In Ba Dong village, his descendants have preserved the ancestral tree across generations. The variety gradually adapted to the soils near the Red River, developing its distinctive taste. From a single tree in Phu Cu, this fruit has reached new markets, carrying the care of its growers and a piece of Vietnamese culinary heritage.",
    ),
    transcript:
      "Có một thức quà của vùng đất Hưng Yên, khi chín khoác lên mình sắc đỏ quyến rũ, dáng hình tròn đầy như quả trứng, lớp cùi dày, hạt nhỏ, vị ngọt thanh và hương thơm khó quên. Tương truyền, cụ Nguyễn Văn Diệm là người đã mang vải trứng về trồng tại Hưng Yên. Từ một cây vải cổ ở Phù Cừ, hôm nay, vải trứng đã bước ra những thị trường mới, mang theo hương vị và tinh hoa ẩm thực Việt.",
    facts: [
      {
        value: "150+",
        label: l("năm tuổi cây vải cổ", "years of the ancestral tree"),
      },
      {
        value: "Ba Đông",
        label: l("nơi lưu giữ câu chuyện", "home of the origin story"),
      },
    ],
    timeline: [
      {
        date: "01",
        title: l("Gìn giữ giống quý", "Preserving a local variety"),
        detail: l(
          "Những người trồng gìn giữ giống vải đặc trưng của Phù Cừ.",
          "Growers preserve the distinctive Phu Cu variety.",
        ),
      },
      {
        date: "02",
        title: l("Chăm sóc mùa vụ", "Tending the season"),
        detail: l(
          "Theo dõi ra hoa, đậu quả và phát triển của trái.",
          "Monitoring flowering and fruit development.",
        ),
      },
      {
        date: "03",
        title: l("Thu hái đúng độ chín", "Harvesting at ripeness"),
        detail: l(
          "Chọn trái đạt chất lượng, phân loại và đóng gói.",
          "Selecting ripe fruit, sorting and packing.",
        ),
      },
      {
        date: "04",
        title: l("Gửi vị ngọt đi xa", "Sharing the sweetness"),
        detail: l(
          "Kết nối thông tin và câu chuyện của người trồng bằng QR.",
          "Connecting the grower’s story and information through QR.",
        ),
      },
    ],
    faq: [
      {
        question: l("Vì sao gọi là vải trứng?", "Why “egg lychee”?"),
        answer: l(
          "Tên gọi gợi dáng trái tròn đầy như quả trứng; câu chuyện cũng nhắc đến tên “vải ông Diệm”.",
          "The name recalls its egg-like shape; the story also calls it “Mr Diem’s lychee”.",
        ),
      },
      {
        question: l("Sản phẩm có OCOP không?", "Is this batch OCOP certified?"),
        answer: l(
          "Kịch bản có nhắc đến OCOP 4 sao của vải trứng Hưng Yên. Trang mẫu chưa có hồ sơ chứng nhận của một lô cụ thể; hãy yêu cầu nhà vườn cung cấp trước khi mua.",
          "The supplied story mentions the regional product’s four-star OCOP recognition. This demo has no certificate for a specific batch; request it from the grower.",
        ),
      },
    ],
  },
  {
    ...shared,
    id: "cam-duong-canh",
    slug: "cam-duong-canh-hung-yen",
    name: "Cam Đường Canh",
    nameEn: "Duong Canh citrus",
    subtitle: l(
      "Sắc vàng của mùa đoàn viên",
      "Golden fruit for a season of reunion",
    ),
    region: l("Văn Giang, Hưng Yên", "Van Giang, Hung Yen"),
    season: l("Mùa cuối năm", "End-of-year season"),
    image: "/media/cam-duong-canh.webp",
    video: "/media/cam-duong-canh.mp4",
    gallery: [1, 2, 3].map((n) => `/media/cam-duong-canh-scene-${n}.webp`),
    batchCode: "HY-CC-DEMO-01",
    story: l(
      "Mỗi độ cuối năm, Hưng Yên lại khoác lên sắc vàng của những vườn cam Đường Canh vào mùa thu hoạch. Giữa vòm lá xanh, từng chùm quả trĩu cành mang theo không khí rộn ràng của ngày Tết. Trong văn hóa Việt, sắc vàng gửi gắm ước nguyện về phú quý, bình an và đủ đầy. Thức quả hiện diện trên mâm ngũ quả, trong lễ vật dâng gia tiên và trong những món quà đoàn viên. Đất và khí hậu thuận hòa cùng đôi bàn tay người trồng tạo nên trái tròn đầy, vỏ mỏng và vị ngọt đậm. Mỗi mùa quả không chỉ mang niềm vui thu hoạch mà còn gìn giữ một sắc màu của Tết quê hương.",
      "At the end of the year, Hung Yen’s Duong Canh orchards turn golden. Heavy branches carry the joyful feeling of Tet and family reunions. In Vietnamese culture, this golden colour expresses wishes for prosperity, peace and abundance. The fruit appears on traditional offering trays and is shared as a gift. Favourable soil and climate, together with the growers’ care, give it a thin skin and rich sweetness. Each harvest brings both joy to its farmers and a familiar colour of the Vietnamese New Year.",
    ),
    transcript:
      "Mỗi độ cuối năm, Hưng Yên lại khoác lên mình sắc vàng óng ả của những vườn cam Đường Canh vào mùa thu hoạch. Trong văn hóa Việt, sắc vàng là biểu tượng của phú quý, sung túc và những điều tốt lành. Mỗi trái mang dáng tròn đầy, lớp vỏ mỏng, căng mịn; vị ngọt đậm đà cùng hương thơm thanh nhã. Một thức quả giản dị nhưng mang trong mình những giá trị tinh thần sâu sắc của Tết cổ truyền Việt Nam.",
    facts: [
      {
        value: "Đường Canh",
        label: l("thức quả mùa đoàn viên", "a gift for family reunions"),
      },
      {
        value: "Hưng Yên",
        label: l("sắc vàng từ vườn quê", "golden orchards"),
      },
    ],
    timeline: [
      {
        date: "01",
        title: l("Ươm một mùa đoàn viên", "Growing a season of reunion"),
        detail: l(
          "Chăm sóc vườn và theo dõi từng giai đoạn của cây.",
          "Caring for the orchard throughout the growing cycle.",
        ),
      },
      {
        date: "02",
        title: l("Trái chín trong vòm lá", "Ripening among green leaves"),
        detail: l(
          "Theo dõi độ chín và chọn thời điểm thu hoạch.",
          "Monitoring ripeness to choose the harvest time.",
        ),
      },
      {
        date: "03",
        title: l("Nâng niu từng trái", "Handling every fruit with care"),
        detail: l(
          "Thu hái, chọn lọc và đóng gói cẩn thận.",
          "Careful harvesting, selection and packing.",
        ),
      },
      {
        date: "04",
        title: l("Mang sắc Tết đến nhà", "Bringing Tet colours home"),
        detail: l(
          "Mã QR lưu giữ câu chuyện và kết nối người thưởng thức.",
          "QR preserves the story and connects the people enjoying it.",
        ),
      },
    ],
    faq: [
      {
        question: l(
          "Cam Đường Canh có ý nghĩa gì ngày Tết?",
          "What does this fruit mean at Tet?",
        ),
        answer: l(
          "Sắc vàng gắn với phú quý, đủ đầy và đoàn viên trong văn hóa Việt, theo kịch bản của dự án.",
          "Its golden colour symbolizes prosperity and reunion in the supplied project story.",
        ),
      },
      {
        question: l(
          "Có thể đặt làm quà tặng không?",
          "Can I request it as a gift?",
        ),
        answer: l(
          "Bạn có thể gửi yêu cầu quà tặng bằng form. Đây là bản demo; chưa có giao dịch mua hàng hoặc thanh toán thật.",
          "You can send a gift inquiry using the form. This demo does not process real orders or payments.",
        ),
      },
    ],
  },
];
