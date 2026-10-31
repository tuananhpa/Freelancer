import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Eye,
  Image as ImageIcon,
  Newspaper,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {
  activityApi,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type Activity,
  type ActivityCategory,
  type ActivityPayload,
  type ActivityStatus,
} from '../../services/activityApi';
import { mediaApi } from '../../services/mediaApi';
import { getApiErrorMessage } from '../../services/api';
import { formatShortDate } from '../../utils/dateUtils';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge, { type BadgeVariant } from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { TableContainer } from '../../components/ui/TableContainer';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import { TableActions, TableAction } from '../../components/ui/TableActions';
import { TablePagination } from '../../components/ui/TablePagination';

import PageHeader from '../../components/ui/PageHeader';
const STATUS_VARIANTS: Record<ActivityStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'danger',
};

const EMPTY_FORM: ActivityPayload = {
  title: '',
  summary: '',
  content: '',
  coverImageUrl: '',
  images: [],
  category: 'NEWS',
  pinned: false,
};

const ActivityManagement = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] = useState<ActivityStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ActivityPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await activityApi.list({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        size: pageSize,
      });
      setActivities(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
      setTotalElements(res.data.totalElements ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách hoạt động'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setEditorOpen(true);
  };

  const openEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      summary: activity.summary ?? '',
      content: activity.content,
      coverImageUrl: activity.coverImageUrl ?? '',
      images: activity.images ?? [],
      category: activity.category,
      pinned: activity.pinned,
    });
    setFormError('');
    setEditorOpen(true);
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setFormError('');
    try {
      const result = await mediaApi.uploadFile(file, 'uranus_activities');
      setForm((prev) => ({ ...prev, coverImageUrl: result.url }));
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Tải ảnh bìa thất bại'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAlbumUpload = async (files: FileList | File[]) => {
    setUploadingAlbum(true);
    setFormError('');
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) => mediaApi.uploadFile(file, 'uranus_activities')),
      );
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images ?? []), ...uploaded.map((r: { url: string }) => r.url)],
      }));
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Tải ảnh thất bại'));
    } finally {
      setUploadingAlbum(false);
    }
  };

  /**
   * Lay danh sach anh dan tu clipboard. Nguoi dung thuong copy anh thang tu
   * bai Facebook (chuot phai -> Copy Image) roi dan vao day, nhanh hon han
   * phai tai anh ve may roi moi chon file.
   */
  const extractImagesFromClipboard = (e: React.ClipboardEvent): File[] => {
    const items = Array.from(e.clipboardData?.items ?? []);
    return items
      .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
  };

  const handleCoverPaste = (e: React.ClipboardEvent) => {
    const files = extractImagesFromClipboard(e);
    if (files.length === 0) return; // khong co anh trong clipboard - de trinh duyet xu ly binh thuong (vd dan chu)
    e.preventDefault();
    handleCoverUpload(files[0]);
  };

  const handleAlbumPaste = (e: React.ClipboardEvent) => {
    const files = extractImagesFromClipboard(e);
    if (files.length === 0) return;
    e.preventDefault();
    handleAlbumUpload(files);
  };

  const removeAlbumImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: (prev.images ?? []).filter((i) => i !== url) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Vui lòng nhập tiêu đề');
      return;
    }
    if (!form.content.trim()) {
      setFormError('Vui lòng nhập nội dung');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload: ActivityPayload = {
        ...form,
        title: form.title.trim(),
        coverImageUrl: form.coverImageUrl || null,
      };

      if (editingId) {
        await activityApi.update(editingId, payload);
        setSuccess('Đã lưu thay đổi.');
      } else {
        await activityApi.create(payload);
        setSuccess('Đã tạo bản nháp. Bấm "Gửi duyệt" để đưa lên trang chủ.');
      }

      setEditorOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (fn: () => Promise<unknown>, message: string) => {
    setError('');
    try {
      await fn();
      setSuccess(message);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await activityApi.remove(deleteTarget.id);
      setSuccess('Đã xoá hoạt động.');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Xoá thất bại'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      <PageHeader
        className="mb-6"
        icon={Newspaper}
        title="Hoạt động & Poster"
        subtitle="Bài đã duyệt sẽ hiển thị công khai trên trang chủ cho khách ghé thăm."
        actions={
          <Button onClick={openCreate} iconLeft={<Plus className="w-4 h-4" />}>
            Tạo hoạt động
          </Button>
        }
      />

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as ActivityStatus | '');
            setPage(0);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            ...(Object.keys(STATUS_LABELS) as ActivityStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
          ]}
        />

        <Select
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v as ActivityCategory | '');
            setPage(0);
          }}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          options={[
            { value: '', label: 'Tất cả danh mục' },
            ...(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
          ]}
        />
      </div>

      {loading ? (
        <LoadingOverlay inline />
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Chưa có hoạt động nào"
          description="Tạo bài đầu tiên để hiển thị trên trang chủ."
          actionLabel="Tạo hoạt động"
          onAction={openCreate}
        />
      ) : (
        <>
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>Tiêu đề</Th>
                  <Th>Danh mục</Th>
                  <Th>Trạng thái</Th>
                  <Th>Ngày đăng</Th>
                  <Th>Lượt xem</Th>
                  <Th>Thao tác</Th>
                </Tr>
              </Thead>
              <Tbody>
                {activities.map((activity) => (
                  <Tr key={activity.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {activity.coverImageUrl ? (
                          <img
                            src={activity.coverImageUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {activity.pinned && <Pin className="w-3.5 h-3.5 text-cam flex-shrink-0" />}
                            <span className="truncate">{activity.title}</span>
                          </div>
                          {activity.reviewNote && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                              Ghi chú: {activity.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td>{CATEGORY_LABELS[activity.category]}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANTS[activity.status]}>
                        {STATUS_LABELS[activity.status]}
                      </Badge>
                    </Td>
                    <Td>{activity.publishedAt ? formatShortDate(activity.publishedAt) : '—'}</Td>
                    <Td>{activity.viewCount}</Td>
                    <Td>
                      <TableActions>
                        <TableAction
                          icon={Pencil}
                          label="Sửa"
                          onClick={() => openEdit(activity)}
                        />

                        {activity.status === 'DRAFT' && (
                          <TableAction
                            icon={Send}
                            label="Gửi duyệt"
                            onClick={() =>
                              runAction(() => activityApi.submit(activity.id), 'Đã gửi chờ duyệt.')
                            }
                          />
                        )}

                        {activity.status === 'PENDING' && (
                          <>
                            <TableAction
                              icon={CheckCircle2}
                              label="Duyệt & đăng"
                              onClick={() =>
                                runAction(
                                  () => activityApi.approve(activity.id),
                                  'Đã đăng công khai trên trang chủ.',
                                )
                              }
                            />
                            <TableAction
                              icon={Undo2}
                              label="Trả lại nháp"
                              onClick={() =>
                                runAction(
                                  () => activityApi.reject(activity.id),
                                  'Đã trả bài về bản nháp.',
                                )
                              }
                            />
                          </>
                        )}

                        {activity.status === 'PUBLISHED' && (
                          <>
                            <TableAction
                              icon={Eye}
                              label="Xem trang công khai"
                              onClick={() => window.open(`/hoat-dong/${activity.slug}`, '_blank')}
                            />
                            <TableAction
                              icon={activity.pinned ? PinOff : Pin}
                              label={activity.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                              onClick={() =>
                                runAction(
                                  () => activityApi.setPinned(activity.id, !activity.pinned),
                                  activity.pinned ? 'Đã bỏ ghim.' : 'Đã ghim lên đầu.',
                                )
                              }
                            />
                            <TableAction
                              icon={Undo2}
                              label="Gỡ khỏi trang chủ"
                              onClick={() =>
                                runAction(
                                  () => activityApi.archive(activity.id),
                                  'Đã gỡ khỏi trang chủ.',
                                )
                              }
                            />
                          </>
                        )}

                        <TableAction
                          icon={Trash2}
                          label="Xoá"
                          variant="danger"
                          onClick={() => setDeleteTarget(activity)}
                        />
                      </TableActions>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        </>
      )}

      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Sửa hoạt động' : 'Tạo hoạt động'}
        maxWidth="2xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
              Huỷ
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {editingId ? 'Lưu thay đổi' : 'Tạo bản nháp'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Tiêu đề"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="VD: Lễ khai giảng năm học 2026"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              value={form.summary ?? ''}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="Hiển thị trên thẻ tóm tắt ở trang chủ"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Nội dung
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              placeholder="Nội dung chi tiết. Để trống một dòng để xuống đoạn mới."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Danh mục
              </label>
              <Select
                value={form.category || 'NEWS'}
                onChange={(v) => setForm({ ...form, category: v as ActivityCategory })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                options={(Object.keys(CATEGORY_LABELS) as ActivityCategory[]).map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 pb-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.pinned)}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Ghim lên đầu trang chủ
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Ảnh bìa / Poster
            </label>
            {form.coverImageUrl ? (
              <div className="relative inline-block">
                <img
                  src={form.coverImageUrl}
                  alt=""
                  className="w-full max-w-sm rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, coverImageUrl: '' })}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Xoá ảnh bìa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                tabIndex={0}
                onPaste={handleCoverPaste}
                className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/30"
              >
                <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <Clipboard className="w-3.5 h-3.5" />
                  Bấm vào đây rồi dán ảnh (Ctrl+V) — ví dụ copy ảnh từ bài Facebook — hoặc chọn tệp bên dưới
                </p>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                  }}
                  className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cam file:text-white file:font-semibold file:cursor-pointer"
                />
              </div>
            )}
            {uploadingCover && (
              <p className="text-xs text-gray-500 mt-1.5">Đang tải ảnh lên…</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Album ảnh ({(form.images ?? []).length})
            </label>
            <div
              tabIndex={0}
              onPaste={handleAlbumPaste}
              className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/30"
            >
              <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Clipboard className="w-3.5 h-3.5" />
                Bấm vào đây rồi dán ảnh (Ctrl+V) hoặc chọn nhiều tệp bên dưới
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingAlbum}
                onChange={(e) => {
                  if (e.target.files?.length) handleAlbumUpload(e.target.files);
                  e.target.value = '';
                }}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-200 dark:file:bg-gray-700 file:text-gray-800 dark:file:text-gray-200 file:font-semibold file:cursor-pointer"
              />
            </div>
            {uploadingAlbum && <p className="text-xs text-gray-500 mt-1.5">Đang tải ảnh lên…</p>}

            {(form.images ?? []).length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                {(form.images ?? []).map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-full h-20 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAlbumImage(url)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Xoá ảnh"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xoá hoạt động"
        message={`Xoá vĩnh viễn "${deleteTarget?.title}"? Thao tác này không hoàn tác được.`}
        confirmText="Xoá"
        isDestructive
        isLoading={deleting}
      />
    </div>
  );
};

export default ActivityManagement;
