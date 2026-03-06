import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnershipsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  Search,
  Filter,
  Handshake,
  MoreVertical,
  Eye,
  Check,
  X,
  Calendar,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Partnership, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function PartnershipsPage() {
  const { companyMember } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Partnership>>({
    queryKey: ['partnerships', page, search, statusFilter, companyMember?.company_id],
    queryFn: () => partnershipsApi.getAll({
      page,
      size: 20,
      search: search || undefined,
      status: statusFilter || undefined,
      company_id: companyMember?.company_id,
    }),
  });

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-danger',
      cancelled: 'badge-gray',
    };
    return statusMap[status] || 'badge-gray';
  };

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) =>
      partnershipsApi.respond(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerships'] });
      toast.success('Ответ отправлен');
    },
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это партнерство?')) return;
    
    try {
      await partnershipsApi.delete(id);
      toast.success('Партнерство удалено');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
    setMenuOpenId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Партнерства</h1>
          <p className="text-gray-600">Управление партнерскими отношениями</p>
        </div>
        <button
          onClick={() => {/* TODO: Implement create partnership */}}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Новое партнерство
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию компании..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilters({ search: e.target.value });
                }}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {statusFilter && (
                <span className="ml-2 bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs">
                  1
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Статус</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => updateFilters({ status: e.target.value })}
                    className="input"
                  >
                    <option value="">Все статусы</option>
                    <option value="pending">Ожидает</option>
                    <option value="accepted">Принято</option>
                    <option value="rejected">Отклонено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-12">
            <Handshake className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет партнерств</h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter ? 'Попробуйте изменить фильтры' : 'Создайте первое партнерство'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Инициатор
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Партнер
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата создания
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.items.map((partnership) => (
                    <tr key={partnership.id} className="table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {partnership.requester_company?.name || 'Неизвестно'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {partnership.target_company?.name || 'Неизвестно'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {partnership.partnership_type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${getStatusBadge(partnership.status)}`}>
                          {partnership.status === 'pending' ? 'Ожидает' :
                           partnership.status === 'accepted' ? 'Принято' :
                           partnership.status === 'rejected' ? 'Отклонено' :
                           'Отменено'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(partnership.created_at), 'dd MMM yyyy', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === partnership.id ? null : partnership.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpenId === partnership.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  respondMutation.mutate({ id: partnership.id, status: 'accepted' });
                                  setMenuOpenId(null);
                                }}
                                disabled={partnership.status !== 'pending' || respondMutation.isLoading}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Принять
                              </button>
                              <button
                                onClick={() => {
                                  respondMutation.mutate({ id: partnership.id, status: 'rejected' });
                                  setMenuOpenId(null);
                                }}
                                disabled={partnership.status !== 'pending' || respondMutation.isLoading}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Отклонить
                              </button>
                              <button
                                onClick={() => handleDelete(partnership.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                Удалить
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Показано {data.items.length} из {data.total}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="btn-outline text-sm disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === data.pages}
                    className="btn-outline text-sm disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}