import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  Search,
  Filter,
  Users,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Client, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const { companyMember } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Client>>({
    queryKey: ['clients', page, search, companyMember?.company_id],
    queryFn: () => clientsApi.getAll({
      page,
      size: 20,
      search: search || undefined,
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

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;
    
    try {
      await clientsApi.delete(id);
      toast.success('Клиент удален');
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
          <h1 className="text-2xl font-bold text-gray-900">Клиенты</h1>
          <p className="text-gray-600">Управление клиентами</p>
        </div>
        <Link to="/clients/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Новый клиент
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени, телефону, email..."
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
            </button>
          </div>
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
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет клиентов</h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Попробуйте изменить поисковый запрос' : 'Добавьте своего первого клиента'}
            </p>
            {!search && (
              <Link to="/clients/new" className="btn-primary">
                Добавить клиента
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имя
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ИНН
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Добавлен
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data?.items.map((client) => (
                    <tr key={client.id} className="table-row">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          to={`/clients/${client.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-900"
                        >
                          {client.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {client.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {client.email ? (
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {client.email}
                          </span>
                        ) : (
                          <span className="text-gray-400">Не указан</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {client.inn || <span className="text-gray-400">Не указан</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(client.created_at), 'dd MMM yyyy', { locale: ru })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === client.id ? null : client.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuOpenId === client.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <Link
                                to={`/clients/${client.id}`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Просмотреть
                              </Link>
                              <Link
                                to={`/clients/${client.id}/edit`}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setMenuOpenId(null)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                              </Link>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
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