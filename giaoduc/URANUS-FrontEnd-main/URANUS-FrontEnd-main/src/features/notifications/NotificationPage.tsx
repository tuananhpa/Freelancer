import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import EmptyState from '../../components/common/EmptyState';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  GraduationCap,
  FileText,
  Trophy,
  Award,
  MessageSquare,
  Layers,
  BookOpen,
  Settings,
  CheckCircle2,
  Info,
  ChevronRight,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import { NotificationItem, NotificationType, getNotificationIcon, isNotificationRead } from '../../components/layout/NotificationBadge';
import { resolveNotificationLink } from '../../utils/notificationLink';
import { useAuth } from '../../context/AuthContext';
import { createStompClient } from '../../services/socket';

import PageHeader from '../../components/ui/PageHeader';
type CategoryFilter = 'ALL' | 'UNREAD' | 'CLASSROOM' | 'EXAM' | 'INTERACTION' | 'SYSTEM';

const NotificationPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CategoryFilter>('ALL');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = async (pageNum: number = 0, isAppend: boolean = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/notifications?page=${pageNum}&size=20`);
      const content = res.data.content || [];
      const totalPages = res.data.totalPages || 1;

      if (isAppend) {
        setNotifications((prev) => [...prev, ...content]);
      } else {
        setNotifications(content);
      }
      setPage(pageNum);
      setHasMore(pageNum + 1 < totalPages);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0, false);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const client = createStompClient({ token }, [
      {
        destination: '/user/queue/notifications',
        handler: (message) => {
          try {
            const notif = JSON.parse(message.body) as NotificationItem;
            setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
          } catch (e) {
            console.error('Failed to parse incoming WS notification in page:', e);
          }
        },
      },
    ]);
    return () => {
      client?.deactivate();
    };
  }, [user?.id, token]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const clearReadNotifications = async () => {
    try {
      await api.delete('/notifications/clear-read');
      setNotifications((prev) => prev.filter((n) => !isNotificationRead(n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markReadAndNavigate = async (notif: NotificationItem) => {
    try {
      if (!isNotificationRead(notif)) {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true, read: true } : n))
        );
      }
      const target = resolveNotificationLink(notif.link, notif.message);
      if (target) {
        if (target.startsWith('http')) {
          window.location.href = target;
        } else {
          navigate(target);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const read = isNotificationRead(n);
      if (activeTab === 'ALL') return true;
      if (activeTab === 'UNREAD') return !read;
      if (activeTab === 'CLASSROOM') {
        return (
          n.type === 'CLASSROOM' ||
          n.type === 'ASSIGNMENT' ||
          n.type === 'SUBMISSION' ||
          n.type === 'GRADE'
        );
      }
      if (activeTab === 'EXAM') {
        return n.type === 'EXAM';
      }
      if (activeTab === 'INTERACTION') {
        return (
          n.type === 'COMMENT' ||
          n.type === 'COURSE' ||
          n.type === 'FLASHCARD' ||
          n.type === 'RESOURCE'
        );
      }
      if (activeTab === 'SYSTEM') {
        return (
          n.type === 'SYSTEM' ||
          n.type === 'GAMIFICATION' ||
          n.type === 'CERTIFICATE' ||
          n.type === 'SUPPORT' ||
          n.type === 'REMINDER'
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter((n) => !isNotificationRead(n)).length;

  if (loading) return <LoadingOverlay text="Đang tải thông báo..." />;

  const tabs: { key: CategoryFilter; label: string; count?: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: notifications.length },
    { key: 'UNREAD', label: 'Chưa đọc', count: unreadCount },
    { key: 'CLASSROOM', label: 'Lớp học & Bài tập' },
    { key: 'EXAM', label: 'Đề thi' },
    { key: 'INTERACTION', label: 'Tương tác & Thảo luận' },
    { key: 'SYSTEM', label: 'Hệ thống' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/dashboard" />
          <PageHeader
            icon={Bell}
            title="Thông báo"
            subtitle="Cập nhật hoạt động học tập, kết quả thi và thông báo từ giáo viên"
            badge={unreadCount > 0 && (
              <span className="text-xs bg-cam text-white px-2.5 py-0.5 rounded-full font-bold">
                {unreadCount} mới
              </span>
            )}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-bold border-gray-200 dark:border-night-border"
            >
              <CheckCheck size={14} className="text-cam" /> Đọc hết
            </Button>
          )}
          {notifications.some((n) => isNotificationRead(n)) && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearReadNotifications}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-600 dark:text-night-muted dark:hover:text-red-400 border-gray-200 dark:border-night-border"
            >
              <Trash2 size={14} /> Xóa đã đọc
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-cam text-white shadow-sm shadow-cam/20'
                  : 'bg-white dark:bg-night-surface text-gray-600 dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated border border-gray-200/60 dark:border-night-border'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            activeTab === 'UNREAD'
              ? 'Không có thông báo chưa đọc'
              : 'Không tìm thấy thông báo nào'
          }
          description={
            activeTab === 'UNREAD'
              ? 'Tuyệt vời! Bạn đã cập nhật và đọc tất cả các thông báo.'
              : 'Khi có hoạt động hoặc cập nhật mới trong danh mục này, chúng sẽ hiển thị ở đây.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-200/80 dark:border-night-border shadow-sm divide-y divide-gray-100 dark:divide-night-border overflow-hidden">
          {filteredNotifications.map((notif) => {
            const read = isNotificationRead(notif);
            return (
              <div
                key={notif.id}
                onClick={() => markReadAndNavigate(notif)}
                className={`group w-full text-left p-4 sm:p-5 hover:bg-gray-50/80 dark:hover:bg-night-elevated transition-colors cursor-pointer flex items-start gap-3.5 relative ${
                  !read
                    ? 'bg-orange-50/30 dark:bg-cam/5 border-l-4 border-l-cam'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                {/* Avatar or Type Icon */}
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-night-elevated flex items-center justify-center shrink-0 mt-0.5 border border-gray-200/60 dark:border-night-border">
                  {notif.actorAvatar ? (
                    <img
                      src={notif.actorAvatar}
                      alt={notif.actorName || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getNotificationIcon(notif.type)
                  )}
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm ${
                        !read
                          ? 'font-bold text-gray-900 dark:text-night-text'
                          : 'font-semibold text-gray-700 dark:text-night-text/90'
                      }`}
                    >
                      {notif.title}
                    </h3>
                    {notif.type && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-gray-100 dark:bg-night-elevated text-gray-500 dark:text-night-muted">
                        {notif.type}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-night-muted mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-gray-400 dark:text-night-muted font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                    {notif.link && (
                      <span className="text-[11px] text-cam font-semibold flex items-center gap-0.5 group-hover:underline">
                        Xem chi tiết <ChevronRight size={12} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1">
                  {!read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cam shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => deleteSingle(e, notif.id)}
                    title="Xóa thông báo này"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 dark:hover:bg-red-950/30 transition-all ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="p-4 text-center bg-gray-50/50 dark:bg-night-elevated/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications(page + 1, true)}
                disabled={loadingMore}
                className="text-xs font-bold"
              >
                {loadingMore ? 'Đang tải thêm...' : 'Tải thêm thông báo'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
