import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { useNotificationStore } from '@/lib/store';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  MessageSquare,
  Award,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Notification, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { notifications: storeNotifications, setNotifications, markAsRead, markAllAsRead, unreadCount, setUnreadCount } = useNotificationStore();

  const { data, isPending } = useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', page],
    queryFn: () => notificationsApi.getAll({ page, size: 20 }).then(response => response.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
      toast.success('Все уведомления прочитаны');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Уведомление удалено');
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'declaration':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'certificate':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'task':
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case 'client':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (!notification.related_entity_type || !notification.related_entity_id) return null;
    
    switch (notification.related_entity_type) {
      case 'declaration':
        return `/declarations/${notification.related_entity_id}`;
      case 'certificate':
        return `/certificates/${notification.related_entity_id}`;
      case 'task':
        return `/tasks/${notification.related_entity_id}`;
      case 'client':
        return `/clients/${notification.related_entity_id}`;
      default:
        return null;
    }
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
    markAllAsRead();
  };

  const handleDelete = (id: number) => {
    if (!confirm('Удалить это уведомление?')) return;
    deleteNotificationMutation.mutate(id);
    setMenuOpenId(null);
  };

  const displayNotifications = data?.items || storeNotifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-gray-600">
            {unreadCount > 0 
              ? `У вас ${unreadCount} непрочитанных уведомлений`
              : 'Все уведомления прочитаны'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="btn-outline"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Отметить все как прочитанные
          </button>
        )}
      </div>

      <div className="card">
        {isPending ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уведомлений</h3>
            <p className="text-gray-500">
              Вы будете получать уведомления о важных событиях
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayNotifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2 ml-2">
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === notification.id ? null : notification.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {menuOpenId === notification.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  {!notification.is_read && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      Отметить как прочитанное
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(notification.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Удалить
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );

              if (link) {
                return (
                  <Link key={notification.id} to={link} onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}>
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
