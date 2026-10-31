import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createStompClient } from '../../services/socket';
import api from '../../services/api';
import { resolveNotificationLink } from '../../utils/notificationLink';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export type NotificationType =
  | 'CLASSROOM'
  | 'ASSIGNMENT'
  | 'SUBMISSION'
  | 'EXAM'
  | 'GRADE'
  | 'COMMENT'
  | 'COURSE'
  | 'FLASHCARD'
  | 'RESOURCE'
  | 'GAMIFICATION'
  | 'CERTIFICATE'
  | 'SUPPORT'
  | 'SYSTEM'
  | 'REMINDER';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead?: boolean;
  read?: boolean;
  type?: NotificationType;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export const isNotificationRead = (n: NotificationItem): boolean => {
  return Boolean(n.isRead ?? n.read ?? false);
};

export const getNotificationIcon = (type?: NotificationType) => {
  switch (type) {
    case 'CLASSROOM':
      return <GraduationCap className="w-4 h-4 text-blue-500" />;
    case 'ASSIGNMENT':
    case 'SUBMISSION':
      return <FileText className="w-4 h-4 text-amber-500" />;
    case 'EXAM':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'GRADE':
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 'COMMENT':
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'COURSE':
      return <BookOpen className="w-4 h-4 text-indigo-500" />;
    case 'FLASHCARD':
      return <Layers className="w-4 h-4 text-pink-500" />;
    case 'RESOURCE':
      return <BookOpen className="w-4 h-4 text-teal-500" />;
    case 'GAMIFICATION':
      return <Trophy className="w-4 h-4 text-orange-500" />;
    case 'CERTIFICATE':
      return <Award className="w-4 h-4 text-amber-600" />;
    case 'SUPPORT':
    case 'SYSTEM':
    default:
      return <Info className="w-4 h-4 text-gray-500" />;
  }
};

export const NotificationBadge = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = () => {
    if (!user?.id) return;
    api
      .get('/notifications/unread-count')
      .then((res) => setUnreadCount(res.data))
      .catch(console.error);
  };

  const fetchNotifications = () => {
    if (!user?.id) return;
    api
      .get('/notifications?size=10')
      .then((res) => setNotifications(res.data.content || []))
      .catch(console.error);
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadCount();
    fetchNotifications();

    const client = createStompClient({ token }, [
      {
        destination: '/user/queue/notifications',
        handler: (message) => {
          try {
            const notif = JSON.parse(message.body) as NotificationItem;
            setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          } catch (e) {
            console.error('Failed to parse incoming WS notification:', e);
          }
        },
      },
    ]);

    // Safety net: Poll unread count every 60s
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => {
      client?.deactivate();
      clearInterval(pollInterval);
    };
  }, [user?.id, token]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      if (!isNotificationRead(notif)) {
        await api.put(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setIsOpen(false);
      const target = resolveNotificationLink(notif.link, notif.message);
      if (target) {
        if (target.startsWith('http')) {
          window.location.href = target;
        } else {
          navigate(target);
        }
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative focus:outline-none"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-night-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-cam text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border-2 border-white dark:border-night-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white dark:bg-night-surface rounded-2xl shadow-xl border border-gray-100 dark:border-night-border overflow-hidden z-50 animate-fade-in">
          <div className="p-3.5 border-b border-gray-100 dark:border-night-border bg-gray-50 dark:bg-night-elevated flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 dark:text-night-text text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-orange-100 dark:bg-cam/20 text-orange-600 dark:text-cam font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-cam hover:text-camDam dark:hover:text-camNhat font-semibold transition-colors"
              >
                Đọc hết
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50 dark:divide-night-border">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-night-muted/40 mb-2" />
                <p className="text-gray-400 dark:text-night-muted text-xs">Bạn chưa có thông báo nào.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const read = isNotificationRead(notif);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-night-elevated flex items-start gap-3 ${
                      !read ? 'bg-orange-50/40 dark:bg-cam/10' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-night-elevated flex items-center justify-center shrink-0 mt-0.5 border border-gray-200/50 dark:border-night-border">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p
                          className={`text-xs leading-snug line-clamp-1 ${
                            !read
                              ? 'font-bold text-gray-900 dark:text-night-text'
                              : 'font-medium text-gray-700 dark:text-night-text/80'
                          }`}
                        >
                          {notif.title}
                        </p>
                        {!read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cam shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-night-muted mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-night-muted/60 mt-1 font-medium">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block text-center text-xs text-cam font-bold py-2.5 border-t border-gray-100 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
};
