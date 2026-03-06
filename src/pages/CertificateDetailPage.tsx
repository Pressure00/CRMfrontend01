import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificatesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Calendar,
  Award,
  Check,
  X,
  FileText,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function CertificateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, companyMember } = useAuthStore();
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState({
    action_type: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: certificate, isLoading } = useQuery({
    queryKey: ['certificate', id],
    queryFn: () => certificatesApi.getById(parseInt(id!)),
    enabled: !!id,
  });

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => certificatesApi.changeStatus(parseInt(id!), status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success('Статус обновлен');
    },
  });

  const addActionMutation = useMutation({
    mutationFn: (data: { action_type: string; notes?: string }) =>
      certificatesApi.addAction(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      setShowActionForm(false);
      setActionForm({ action_type: '', notes: '' });
      toast.success('Действие добавлено');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => certificatesApi.uploadAttachment(parseInt(id!), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      setSelectedFile(null);
      toast.success('Файл загружен');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      certificatesApi.removeAttachment(parseInt(id!), attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      toast.success('Файл удален');
    },
  });

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionForm.action_type) {
      toast.error('Выберите тип действия');
      return;
    }
    addActionMutation.mutate(actionForm);
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    uploadAttachmentMutation.mutate(selectedFile);
  };

  const canEdit = companyMember?.role === 'director' || certificate?.created_by === user?.id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Сертификат не найден</h3>
        <button onClick={() => navigate('/certificates')} className="btn-primary">
          Назад к списку
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: 'badge-gray',
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      expired: 'badge-danger',
    };
    return statusMap[status] || 'badge-gray';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/certificates')} className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Сертификат {certificate.certificate_number}
            </h1>
            <p className="text-gray-600">
              Тип: {certificate.certificate_type}
            </p>
          </div>
        </div>
        {canEdit && (
          <Link to={`/certificates/${id}/edit`} className="btn-outline">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Основная информация</h2>
            </div>
            <div className="card-body">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Статус</dt>
                  <dd className="mt-1">
                    <span className={`badge ${getStatusBadge(certificate.status)}`}>
                      {certificate.status === 'draft' ? 'Черновик' :
                       certificate.status === 'pending' ? 'На рассмотрении' :
                       certificate.status === 'approved' ? 'Одобрен' :
                       certificate.status === 'rejected' ? 'Отклонен' :
                       'Истек'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Декларант</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {certificate.declarant_company?.name || certificate.declarant_user?.full_name || 'Не указан'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Сертификатор</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {certificate.certifier_company?.name || certificate.certifier_user?.full_name || 'Не указан'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Дата выдачи</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(certificate.issue_date), 'dd MMM yyyy', { locale: ru })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Действует до</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(certificate.expiry_date), 'dd MMM yyyy', { locale: ru })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Создан</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(certificate.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </dd>
                </div>
              </dl>
              {certificate.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-500">Описание</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {certificate.description}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">История действий</h2>
              {canEdit && (
                <button
                  onClick={() => setShowActionForm(!showActionForm)}
                  className="btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить действие
                </button>
              )}
            </div>
            <div className="card-body">
              {showActionForm && (
                <form onSubmit={handleAddAction} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Тип действия *</label>
                      <input
                        type="text"
                        value={actionForm.action_type}
                        onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                        className="input"
                        placeholder="Например: Проверка, Одобрение и т.д."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="label">Комментарий</label>
                    <textarea
                      value={actionForm.notes}
                      onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Дополнительные комментарии..."
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowActionForm(false)}
                      className="btn-outline"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={addActionMutation.isLoading}
                      className="btn-primary"
                    >
                      {addActionMutation.isLoading ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}

              {certificate.actions && certificate.actions.length > 0 ? (
                <div className="space-y-3">
                  {certificate.actions.map((action) => (
                    <div key={action.id} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{action.action_type}</p>
                        {action.notes && (
                          <p className="text-sm text-gray-600 mt-1">{action.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {action.performed_by_user?.full_name} • {format(new Date(action.performed_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет истории действий</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Вложения</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="file-upload"
                  className="btn-primary text-sm cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить файл
                </label>
              </div>
            </div>
            <div className="card-body">
              {selectedFile && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-blue-900">{selectedFile.name}</span>
                  <button
                    onClick={handleFileUpload}
                    disabled={uploadAttachmentMutation.isLoading}
                    className="btn-primary text-xs"
                  >
                    {uploadAttachmentMutation.isLoading ? 'Загрузка...' : 'Загрузить'}
                  </button>
                </div>
              )}

              {certificate.attachments && certificate.attachments.length > 0 ? (
                <div className="space-y-2">
                  {certificate.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {(attachment.file_size / 1024).toFixed(1)} КБ •{' '}
                            {format(new Date(attachment.uploaded_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`/uploads/${attachment.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline text-sm"
                        >
                          Скачать
                        </a>
                        {canEdit && (
                          <button
                            onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет вложений</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Действия</h2>
            </div>
            <div className="card-body space-y-3">
              {certificate.status === 'draft' && (
                <button
                  onClick={() => changeStatusMutation.mutate('pending')}
                  disabled={changeStatusMutation.isLoading}
                  className="w-full btn-outline"
                >
                  Отправить на рассмотрение
                </button>
              )}
              {certificate.status === 'pending' && (
                <>
                  <button
                    onClick={() => changeStatusMutation.mutate('approved')}
                    disabled={changeStatusMutation.isLoading}
                    className="w-full btn-primary"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Одобрить
                  </button>
                  <button
                    onClick={() => changeStatusMutation.mutate('rejected')}
                    disabled={changeStatusMutation.isLoading}
                    className="w-full btn-danger"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отклонить
                  </button>
                </>
              )}
              {certificate.status === 'approved' && (
                <button
                  onClick={() => changeStatusMutation.mutate('expired')}
                  disabled={changeStatusMutation.isLoading}
                  className="w-full btn-danger"
                >
                  Пометить как истекший
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Информация</h2>
            </div>
            <div className="card-body">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Создал</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {certificate.created_by_user?.full_name || 'Неизвестно'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Компания декларанта</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {certificate.declarant_company?.name || 'Не указана'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Компания сертификатора</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {certificate.certifier_company?.name || 'Не указана'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Обновлен</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(certificate.updated_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}