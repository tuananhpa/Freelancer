import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Play,
  ScanLine,
  Leaf,
  BookOpen,
  HeartHandshake,
  ShieldCheck,
  Smartphone,
  Quote,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../app/providers";
import { useResource } from "../hooks/useResource";
import { repository } from "../services";
import { ProductCarousel } from "../components/ProductCarousel";
import { Loading, ErrorState } from "../components/common";
import { HeroVideoCarousel } from "../components/HeroVideoCarousel";
import { InquiryModal } from "../components/InquiryModal";
import { MediaImage } from "../components/Media";
import { useSiteSettings } from "../app/appearance";
export default function HomePage() {
  const { lang, t } = useLanguage();
  const appearance = useSiteSettings();
  const {
    data: products,
    loading,
    error,
    reload,
  } = useResource(() => repository.products.list());
  const [playRequest, setPlayRequest] = useState(0);
  const [inquiry, setInquiry] = useState(false);
  useEffect(() => {
    document.title = t(
      "HYTales | Chạm mã QR – Mở câu chuyện quê",
      "HYTales | Scan a QR, discover a story",
    );
  }, [lang]);
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <h1>
            {t("Chạm mã QR.", "Scan a QR.")}
            <br />
            {t("Mở câu chuyện quê.", "Discover a story.")}
          </h1>
          <p>
            {t(
              "Đằng sau mỗi thức quà là một miền đất, một đôi bàn tay, một câu chuyện đáng được kể. HYTales đưa bạn chạm gần hơn với di sản nông sản Hưng Yên.",
              "Behind every local treasure is a place, a pair of caring hands and a story worth telling. HYTales brings you closer to the agricultural heritage of Hung Yen.",
            )}
          </p>
          <div className="hero-actions">
            <a href="#dac-san" className="button">
              {t("Khám phá thức quà quê", "Explore local treasures")}
              <ArrowUpRight size={19} />
            </a>
            <button
              className="text-button"
              onClick={() => setPlayRequest((value) => value + 1)}
            >
              <span className="play-outline">
                <Play size={15} fill="currentColor" />
              </span>
              {t("Xem phim câu chuyện", "Watch the story")}
            </button>
          </div>
          <div className="hero-caption">
            <span className="tiny-leaf">
              <Leaf size={22} />
            </span>
            <span>
              {t(
                "Từ phù sa sông Hồng, gửi đến bạn",
                "From the Red River, with care",
              )}
              <small>
                {t(
                  "Gìn giữ di sản · Kết nối người trồng",
                  "Preserving heritage · Connecting growers",
                )}
              </small>
            </span>
          </div>
        </div>
        <HeroVideoCarousel
          products={products ?? []}
          playRequest={playRequest}
        />
      </section>
      <div className="values-strip">
        <div className="container">
          <span>
            <BookOpen />
            {t("Câu chuyện có chiều sâu", "Stories with roots")}
          </span>
          <span>
            <ShieldCheck />
            {t("Nguồn gốc được mở ra", "Origins made visible")}
          </span>
          <span>
            <HeartHandshake />
            {t("Người trồng được kết nối", "Growers brought closer")}
          </span>
          <span>
            <Leaf />
            {t("Di sản được tiếp nối", "Heritage carried forward")}
          </span>
        </div>
      </div>
      <section className="section container story-intro" id="cau-chuyen">
        <div className="intro-heading">
          <p className="eyebrow">
            {t("Chuyện của HYTales", "The HYTales story")}
          </p>
          <h2>
            {t(
              "Nông sản không chỉ có vị ngon.",
              "More than a beautiful taste.",
            )}
            <br />
            {t("Nông sản còn có một câu chuyện.", "A story worth remembering.")}
          </h2>
          <div className="story-mosaic">
            <figure className="story-grower">
              <MediaImage
                src={
                  appearance.storyImages[0]?.src || "/media/cam-duong-canh.webp"
                }
                display={appearance.storyImages[0]?.display}
                alt={t(
                  "Người trồng chăm sóc mùa cam trong vườn Hưng Yên",
                  "A grower tending citrus in a Hung Yen orchard",
                )}
                loading="lazy"
                width="1024"
                height="768"
              />
              <figcaption>{t("Người trồng", "The grower")}</figcaption>
            </figure>
            <figure>
              <MediaImage
                src={
                  appearance.storyImages[1]?.src ||
                  "/media/nhan-long-scene-1.webp"
                }
                display={appearance.storyImages[1]?.display}
                alt={t(
                  "Kiến trúc quê hương trong phim nhãn lồng Phố Hiến",
                  "Local heritage architecture from the Pho Hien longan film",
                )}
                loading="lazy"
                width="506"
                height="900"
              />
              <figcaption>{t("Miền đất", "The place")}</figcaption>
            </figure>
            <figure>
              <MediaImage
                src={appearance.storyImages[2]?.src || "/media/nhan-long.webp"}
                display={appearance.storyImages[2]?.display}
                alt={t(
                  "Chùm nhãn trong mùa quả ngọt",
                  "Longan clusters during the harvest season",
                )}
                loading="lazy"
                width="800"
                height="600"
              />
              <figcaption>{t("Mùa quả", "The harvest")}</figcaption>
            </figure>
          </div>
        </div>
        <div className="intro-body">
          <p>
            {t(
              "Một chùm nhãn lưu dấu Phố Hiến. Một trái vải gìn giữ ký ức của người trồng. Một mùa cam mang sắc Tết về nhà. Những điều ấy xứng đáng được biết đến, cùng với nguồn gốc của mỗi thức quà.",
              "A longan cluster holds the memory of Pho Hien. A lychee preserves a grower’s story. A citrus harvest brings Tet colours home. These deserve to be known, alongside the origins of every gift.",
            )}
          </p>
          <p>
            {t(
              "HYTales biến tem QR trên bao bì thành “hộ chiếu di sản số”: nơi phim ảnh, câu chuyện và nhật ký canh tác cùng mở ra một hành trình từ vườn quê đến tay bạn.",
              "HYTales turns a packaging QR into a digital heritage passport: films, stories and growing records reveal a journey from the orchard to you.",
            )}
          </p>
          <div className="story-connection">
            <Leaf size={21} />
            <span>{t("Từ vườn quê", "From the orchard")}</span>
            <span className="story-connection-line" />
            <ScanLine size={21} />
            <span>{t("Đến một lần chạm", "To a single scan")}</span>
          </div>
          <a className="underlined-link" href="#ho-chieu">
            {t("Tìm hiểu hộ chiếu di sản", "Discover the heritage passport")}
            <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
      <section className="treasures-section" id="dac-san">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {t("Hương vị một miền quê", "A taste of home")}
              </p>
              <h2>
                {t(
                  "Những thức quà biết kể chuyện",
                  "Local treasures, living stories",
                )}
              </h2>
            </div>
            <p>
              {t(
                "Ghé một miền vườn. Gặp một câu chuyện.\nMang về một chút Hưng Yên.",
                "Visit an orchard. Discover its story.\nTake a little Hung Yen home.",
              )}
            </p>
          </div>
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : products?.length ? (
            <ProductCarousel products={products} />
          ) : (
            <p>
              {t(
                "Những câu chuyện đang được chuẩn bị. Hẹn gặp bạn sớm.",
                "New stories are being prepared. Come back soon.",
              )}
            </p>
          )}
          <div className="collection-note">
            <Leaf size={17} />
            {t(
              "Bộ sưu tập khởi đầu. Hành trình gìn giữ di sản vẫn đang tiếp nối.",
              "Our first collection. The journey of preserving heritage continues.",
            )}
          </div>
        </div>
      </section>
      <section className="section container passport-section" id="ho-chieu">
        <div className="passport-art">
          <div className="passport-art-top">
            <ScanLine size={25} />
            <span>
              HYTales
              <br />
              <small>
                {t("Hộ chiếu di sản số", "Digital heritage passport")}
              </small>
            </span>
            <Leaf size={24} />
          </div>
          <div className="passport-cover">
            <MediaImage
              src="/media/vai-trung.webp"
              loading="lazy"
              alt={t("Vải trứng trên cành", "Lychee on the tree")}
            />
            <div>
              <span>Hưng Yên</span>
              <h3>
                {t(
                  "Từ đất lành,\nđến tay bạn.",
                  "From fertile soil,\nto your hands.",
                )}
              </h3>
            </div>
          </div>
          <div className="passport-art-bottom">
            <ScanLine size={45} />
            <div>
              <strong>
                {t(
                  "Một lần chạm, nhiều điều được mở",
                  "One scan, so much to discover",
                )}
              </strong>
              <small>hytales.vn</small>
            </div>
          </div>
        </div>
        <div className="passport-copy">
          <p className="eyebrow">
            {t("Công nghệ chạm vào di sản", "Technology meets heritage")}
          </p>
          <h2>
            {t(
              "Một chiếc tem nhỏ.\nCả miền quê mở ra.",
              "A tiny label.\nA whole world opens.",
            )}
          </h2>
          <p>
            {t(
              "Quét QR trên bao bì để đi từ thông tin đến cảm xúc, từ một sản phẩm đến những người làm nên nó.",
              "Scan the packaging QR to discover more than information: a connection to the people behind the produce.",
            )}
          </p>
          <div className="passport-features">
            {[
              {
                icon: Smartphone,
                title: t("Xem phim, nghe chuyện", "Watch and listen"),
                text: t(
                  "Thước phim nông sản và giọng kể đưa bạn về miền vườn.",
                  "Produce films and voices take you into the orchard.",
                ),
              },
              {
                icon: ShieldCheck,
                title: t("Hiểu hành trình từ nguồn gốc", "Follow the journey"),
                text: t(
                  "Nhật ký mùa vụ và hồ sơ lô hàng được nhà vườn cập nhật.",
                  "Growers update seasonal records and batch information.",
                ),
              },
              {
                icon: HeartHandshake,
                title: t("Kết nối với người trồng", "Meet the growers"),
                text: t(
                  "Hỏi trực tiếp, gửi cảm nhận hoặc ngỏ lời tặng một thức quà.",
                  "Ask a question, share a thought or request a gift.",
                ),
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <span>
                  <Icon size={22} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <small className="quiet-note">
            {t(
              "Thông tin nguồn gốc do chủ thể cung cấp; xem hồ sơ lô cụ thể trên từng trang sản phẩm.",
              "Origin information is supplied by the producer. See each product page for its batch records.",
            )}
          </small>
        </div>
      </section>
      <section className="heritage-quote">
        <div className="container">
          <Quote size={33} />
          <blockquote>
            {t(
              "“Thứ nhất Kinh kỳ,\nthứ nhì Phố Hiến.”",
              "“First comes the capital,\nsecond comes Pho Hien.”",
            )}
          </blockquote>
          <p>
            {t(
              "Từ một miền đất giàu ký ức, chúng mình kể tiếp câu chuyện hôm nay.",
              "From a place rich in memories, we tell the stories of today.",
            )}
          </p>
          <span className="quote-leaf">
            <Leaf size={100} />
          </span>
        </div>
      </section>
      <section className="section container partner-section" id="ket-noi">
        <div>
          <p className="eyebrow">
            {t("Dành cho nhà vườn & hợp tác xã", "For growers & cooperatives")}
          </p>
          <h2>
            {t(
              "Bạn làm nên thức quà.\nCùng chúng mình kể chuyện.",
              "You grow the treasure.\nLet’s tell its story.",
            )}
          </h2>
          <p>
            {t(
              "Từ khung kịch bản, phim nông sản đến nền tảng QR động, HYTales đồng hành để câu chuyện của người trồng được nhìn thấy và tiếp nối.",
              "From story scripts and produce films to a dynamic QR platform, HYTales helps growers bring their stories to life.",
            )}
          </p>
          <button className="button" onClick={() => setInquiry(true)}>
            {t("Kết nối cùng HYTales", "Connect with HYTales")}
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="partner-details">
          <div>
            <span>
              <BookOpen size={22} />
            </span>
            <h3>{t("Cùng làm nội dung", "Create together")}</h3>
            <p>
              {t(
                "Khung kịch bản và phim mẫu giúp người trồng tự kể chuyện bằng smartphone.",
                "Scripts and films help growers tell their stories with a smartphone.",
              )}
            </p>
          </div>
          <div>
            <span>
              <ScanLine size={22} />
            </span>
            <h3>{t("Một QR, nhiều mùa vụ", "One QR, many seasons")}</h3>
            <p>
              {t(
                "Cập nhật nội dung và nhật ký mà không cần in lại mã trên bao bì.",
                "Update stories and records without reprinting the packaging QR.",
              )}
            </p>
          </div>
          <details>
            <summary>
              {t(
                "HYTales có phải sàn mua bán không?",
                "Is HYTales an online marketplace?",
              )}
              <ChevronDown size={18} />
            </summary>
            <p>
              {t(
                "HYTales tập trung vào kể chuyện, nguồn gốc và kết nối. Yêu cầu mua lại hoặc quà tặng được gửi đến chủ thể sản phẩm, không có giỏ hàng hay thanh toán trên trang này.",
                "HYTales focuses on stories, origins and connections. Purchase inquiries go to producers; this experience has no cart or checkout.",
              )}
            </p>
          </details>
        </div>
      </section>
      {inquiry && (
        <InquiryModal type="partner" onClose={() => setInquiry(false)} />
      )}
    </>
  );
}
