import { MediaImage, MediaVideo } from "../../components/Media";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ScanLine,
  Package,
  MessageCircle,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { repository, isMock } from "../../services";
import { request } from "../../services/apiRepository";
import { Loading, ErrorState } from "../../components/common";
type Analytics = {
  totalScans: number;
  series: { label: string; value: number }[];
  regions: { label: string; percent: number }[];
};
const sample: Analytics = {
  totalScans: 1284,
  series: [
    { label: "T2", value: 36 },
    { label: "T3", value: 52 },
    { label: "T4", value: 43 },
    { label: "T5", value: 68 },
    { label: "T6", value: 57 },
    { label: "T7", value: 91 },
    { label: "CN", value: 74 },
  ],
  regions: [
    { label: "Hưng Yên", percent: 52 },
    { label: "Hà Nội", percent: 31 },
    { label: "Địa phương khác", percent: 17 },
  ],
};
export default function DashboardPage() {
  const { data, error, loading, reload } = useResource(async () => ({
    products: await repository.products.list(true),
    inquiries: await repository.inquiries.list(),
    messages: await repository.messages.list(),
  }));
  const { data: analytics, error: analyticsError } = useResource(() =>
    isMock ? Promise.resolve(sample) : request<Analytics>("/admin/analytics"),
  );
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">HYTales workspace</p>
          <h1>Chào người kể chuyện.</h1>
          <p>Chăm chút những thức quà, tiếp nối những kết nối.</p>
        </div>
        <Link className="button" to="/admin/products">
          Quản lý sản phẩm
          <ArrowUpRight size={17} />
        </Link>
      </div>
      {isMock && (
        <div className="demo-note">
          Số lượt quét và biểu đồ bên dưới là dữ liệu minh họa; chưa theo dõi
          người dùng thật. Sản phẩm, yêu cầu và hộp thư phản ánh dữ liệu demo
          trong trình duyệt này.
        </div>
      )}
      <div className="stats-grid">
        {[
          {
            icon: Package,
            label: "Câu chuyện công khai",
            value:
              data?.products.filter((p) => p.status === "published").length ??
              0,
            note: `${data?.products.length ?? 0} sản phẩm trong bộ sưu tập`,
          },
          {
            icon: ScanLine,
            label: "Lượt quét QR",
            value: analytics?.totalScans.toLocaleString("vi-VN") ?? "—",
            note: isMock ? "Số liệu minh họa" : "Tổng theo backend",
          },
          {
            icon: HeartHandshake,
            label: "Yêu cầu kết nối",
            value: data?.inquiries.length ?? 0,
            note: "Quà tặng & đối tác",
          },
          {
            icon: MessageCircle,
            label: "Câu hỏi chưa trả lời",
            value: data?.messages.filter((m) => !m.reply).length ?? 0,
            note: "Từ khách ghé thăm",
          },
        ].map(({ icon: Icon, label, value, note }) => (
          <div className="stat-card" key={label}>
            <span>
              <Icon size={20} />
            </span>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-charts">
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Lượt quét theo ngày</h2>
            <span className="status-badge">
              {isMock ? "Minh họa" : "Backend"}
            </span>
          </div>
          {analyticsError ? (
            <p className="form-error">{analyticsError}</p>
          ) : (
            <div className="bar-chart" aria-label="Biểu đồ lượt quét">
              {analytics?.series.map((x) => (
                <div key={x.label}>
                  <span>{x.value}</span>
                  <div
                    style={{
                      height: `${Math.max(8, (x.value / Math.max(...analytics.series.map((x) => x.value), 1)) * 155)}px`,
                    }}
                  />
                  <small>{x.label}</small>
                </div>
              ))}
            </div>
          )}
          <p className="quiet-note">
            {isMock
              ? "Chưa có bộ thu thập lượt quét, thời gian hoặc vị trí thực."
              : "Dữ liệu do API /admin/analytics cung cấp."}
          </p>
        </section>
        <section className="admin-panel">
          <div className="panel-heading">
            <h2>Nơi câu chuyện được mở</h2>
            <span className="status-badge">
              {isMock ? "Minh họa" : "Backend"}
            </span>
          </div>
          <div className="region-list">
            {analytics?.regions.map((r) => (
              <div key={r.label}>
                <div>
                  <span>{r.label}</span>
                  <strong>{r.percent}%</strong>
                </div>
                <span className="progress-track">
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(0, r.percent))}%`,
                    }}
                  />
                </span>
              </div>
            ))}
          </div>
          <div className="analytics-note">
            <ScanLine size={30} />
            <p>
              Cập nhật câu chuyện trên cùng một đường dẫn. Mã QR vẫn theo thức
              quà qua từng mùa vụ.
            </p>
          </div>
        </section>
      </div>
      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Bộ sưu tập của bạn</h2>
          <Link to="/admin/products" className="underlined-link">
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="dashboard-products">
          {data?.products.map((p) => (
            <Link to="/admin/products" key={p.id}>
              <MediaImage src={p.image} display={p.imageDisplay} alt="" />
              <div>
                <strong>{p.name}</strong>
                <small>{p.region.vi}</small>
              </div>
              <span
                className={`status-badge ${p.status === "published" ? "published" : ""}`}
              >
                {p.status === "published" ? "Công khai" : "Bản nháp"}
              </span>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
