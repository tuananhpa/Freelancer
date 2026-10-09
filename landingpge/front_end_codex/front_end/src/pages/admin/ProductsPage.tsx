import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  ExternalLink,
  ScanLine,
  Trash2,
} from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { repository } from "../../services";
import { createProductDraft } from "../../services/productDraft";
import type { Product } from "../../types/domain";
import { Loading, ErrorState, Modal } from "../../components/common";
import { MediaImage } from "../../components/Media";
import { useNotice } from "../../app/providers";
import { ProductEditor } from "./ProductEditor";
export default function ProductsPage() {
  const { data, loading, error, reload } = useResource(() =>
    repository.products.list(true),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Product>();
  const [deleting, setDeleting] = useState<Product>();
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const notify = useNotice();
  function create() {
    setEditing(createProductDraft(data));
  }
  async function remove() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await repository.products.remove(deleting.id);
      setDeleting(undefined);
      reload();
      notify("Đã xóa sản phẩm.");
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleteBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const filtered = data?.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      `${p.name} ${p.batchCode}`
        .toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Bộ sưu tập HYTales</p>
          <h1>Sản phẩm & câu chuyện</h1>
          <p>Mỗi sản phẩm một đường dẫn, mỗi mùa vụ một câu chuyện.</p>
        </div>
        <button className="button" onClick={create}>
          <Plus size={17} />
          Tạo sản phẩm
        </button>
      </div>
      <div className="admin-panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm, mã lô…"
              aria-label="Tìm sản phẩm"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Lọc trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Công khai</option>
            <option value="draft">Bản nháp</option>
          </select>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Mã lô hàng</th>
                <th>Trạng thái</th>
                <th>Khối nội dung</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <MediaImage
                        src={p.image}
                        display={p.imageDisplay}
                        alt=""
                      />
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.region.vi}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{p.batchCode || "Chưa có mã"}</strong>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${p.status === "published" ? "published" : ""}`}
                    >
                      {p.status === "published" ? "Công khai" : "Bản nháp"}
                    </span>
                  </td>
                  <td>{p.blocks.length}/5 khối</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        aria-label={`Sửa ${p.name}`}
                        onClick={() => setEditing(p)}
                      >
                        <Pencil size={17} />
                      </button>
                      {p.status === "published" && (
                        <Link
                          className="icon-button"
                          aria-label={`Xem ${p.name}`}
                          to={`/p/${p.slug}`}
                          target="_blank"
                        >
                          <ExternalLink size={17} />
                        </Link>
                      )}
                      <Link
                        className="icon-button"
                        aria-label={`QR ${p.name}`}
                        to={`/admin/qr?product=${p.id}`}
                      >
                        <ScanLine size={17} />
                      </Link>
                      <button
                        className="icon-button danger-icon"
                        aria-label={`Xóa ${p.name}`}
                        onClick={() => {
                          setDeleting(p);
                          setDeleteError("");
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered?.length && (
            <p className="empty-message">
              Chưa có sản phẩm phù hợp. Thử đổi từ khóa hoặc tạo câu chuyện mới.
            </p>
          )}
        </div>
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            reload();
          }}
        />
      )}
      {deleting && (
        <Modal
          title="Xóa sản phẩm"
          onClose={() => {
            if (!deleteBusy) setDeleting(undefined);
          }}
        >
          <div className="form-stack">
            <p>
              Bạn muốn xóa “{deleting.name}”? Sản phẩm sẽ ngừng hiển thị trong
              bộ sưu tập và khi mở mã QR của sản phẩm này.
            </p>
            {deleteError && (
              <p role="alert" className="form-error">
                {deleteError}
              </p>
            )}
            <div className="confirm-actions">
              <button
                className="button button-outline"
                disabled={deleteBusy}
                onClick={() => setDeleting(undefined)}
              >
                Hủy
              </button>
              <button
                className="button button-danger"
                disabled={deleteBusy}
                onClick={() => void remove()}
              >
                <Trash2 size={17} />
                {deleteBusy ? "Đang xóa…" : "Xóa sản phẩm"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
