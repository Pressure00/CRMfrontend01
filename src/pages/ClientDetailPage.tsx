import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, companyMember } = useAuthStore();

  const { data: clientResponse, isPending } = useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(parseInt(id!)),
    enabled: !!id,
  });
  const client = clientResponse?.data;

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(parseInt(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Клиент удален');
      navigate('/clients');
    },
  });

  const canEdit = companyMember?.role === 'director' || client?.created_by === user?.id;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Клиент не найден</h3>
        <button onClick={() => navigate('/clients')} className="btn-primary">
          Назад к списку
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/clients')} className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
            <p className="text-gray-600">
              Клиент с {format(new Date(client.created_at), 'dd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <Link to={`/clients/${id}/edit`} className="btn-outline">
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Link>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-danger"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Контактная информация</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Телефон
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.phone}</dd>
                </div>
                {client.email && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.email}</dd>
                  </div>
                )}
                {client.address && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Адрес
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.address}</dd>
                  </div>
                )}
                {client.inn && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ИНН</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.inn}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Passport Info */}
          {(client.passport_series || client.passport_number || client.passport_issued_by || client.passport_issued_date) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Паспортные данные</h2>
              </div>
              <div className="card-body">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(client.passport_series || client.passport_number) && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Серия и номер</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {client.passport_series} {client.passport_number}
                      </dd>
                    </div>
                  )}
                  {client.passport_issued_by && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Кем выдан</dt>
                      <dd className="mt-1 text-sm text-gray-900">{client.passport_issued_by}</dd>
                    </div>
                  )}
                  {client.passport_issued_date && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Дата выдачи</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {format(new Date(client.passport_issued_date), 'dd MMMM yyyy', { locale: ru })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Примечания</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Related Declarations */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Декларации клиента</h2>
              <Link to={`/declarations/new?client_id=${client.id}`} className="btn-primary text-sm">
                <FileText className="h-4 w-4 mr-2" />
                Новая декларация
              </Link>
            </div>
            <div className="card-body">
              <p className="text-gray-500 text-center py-8">
                Здесь будут отображаться декларации этого клиента
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Информация</h2>
            </div>
            <div className="card-body">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Добавил</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {client.created_by_user?.full_name || 'Неизвестно'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Компания</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.company?.name || 'Не указана'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Дата создания</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(client.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Последнее обновление</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(client.updated_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Быстрые действия</h2>
            </div>
            <div className="card-body space-y-3">
              <Link
                to={`/declarations/new?client_id=${client.id}`}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                Создать декларацию
              </Link>
              <Link
                to={`/clients/${client.id}/edit`}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать клиента
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
