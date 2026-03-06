import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Calendar,
  CheckSquare,
  User,
  Edit,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, companyMember } = useAuthStore();
  const [showAttachmentUpload, setShowAttachmentUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: taskResponse, isPending } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(parseInt(id!)),
    enabled: !!id,
  });
  const task = taskResponse?.data;

  const changeStatusMutation = useMutation({
    mutationFn: (status: string) => tasksApi.changeStatus(parseInt(id!), status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Статус обновлен');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => tasksApi.uploadAttachment(parseInt(id!), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setSelectedFile(null);
      toast.success('Файл загружен');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      tasksApi.removeAttachment(parseInt(id!), attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      toast.success('Файл удален');
    },
  });

  const handleFileUpload = () => {
    if (!selectedFile) return;
    uploadAttachmentMutation.mutate(selectedFile);
  };

  const canEdit = companyMember?.role === 'director' || task?.creator_user_id === user?.id;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Задача не найдена</h3>
        <button onClick={() => navigate('/tasks')} className="btn-primary">
          Назад к списку
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'badge-gray',
      in_progress: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
    };
    return statusMap[status] || 'badge-gray';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'badge-gray',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger',
    };
    return priorityMap[priority] || 'badge-gray';
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/tasks')} className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600">
              Создана {format(new Date(task.created_at), 'dd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        {canEdit && (
          <Link to={`/tasks/${id}/edit`} className="btn-outline">
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
              <h2 className="text-lg font-semibold text-gray-900">Описание задачи</h2>
            </div>
            <div className="card-body">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {task.description || 'Описание отсутствует'}
                </p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Вложения</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="task-file-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="task-file-upload"
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
                    disabled={uploadAttachmentMutation.isPending}
                    className="btn-primary text-xs"
                  >
                    {uploadAttachmentMutation.isPending ? 'Загрузка...' : 'Загрузить'}
                  </button>
                </div>
              )}

              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-2">
                  {task.attachments.map((attachment: any) => (
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

          {/* History */}
          {task.history && task.history.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">История изменений</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {task.history.map((history: any) => (
                    <div key={history.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{history.changed_by_user?.full_name || 'Система'}</span>
                          {' изменил статус на '}
                          <span className="font-medium">
                            {history.status === 'pending' ? 'Ожидает' :
                             history.status === 'in_progress' ? 'В работе' :
                             history.status === 'completed' ? 'Завершена' :
                             'Отменена'}
                          </span>
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(history.changed_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Статус и приоритет</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Статус</label>
                <select
                  value={task.status}
                  onChange={(e) => changeStatusMutation.mutate(e.target.value)}
                  disabled={changeStatusMutation.isPending}
                  className="input"
                >
                  <option value="pending">Ожидает</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
              <div>
                <label className="label">Приоритет</label>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getPriorityBadge(task.priority)}`}>
                    {task.priority === 'low' ? 'Низкий' :
                     task.priority === 'medium' ? 'Средний' :
                     task.priority === 'high' ? 'Высокий' :
                     'Срочный'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Даты</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Срок выполнения</dt>
                <dd className={`mt-1 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                  {task.due_date ? (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(task.due_date), 'dd MMM yyyy', { locale: ru })}
                      {isOverdue && ' (просрочена)'}
                    </span>
                  ) : (
                    'Не указан'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Создана</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(task.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Обновлена</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(task.updated_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                </dd>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Назначение</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Исполнитель</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {task.assigned_user?.full_name || 'Не назначен'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Создал</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {task.creator_user?.full_name || 'Неизвестно'}
                </dd>
              </div>
              {task.target_company && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Компания</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {task.target_company.name}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Related */}
          {(task.related_declaration_id || task.related_certificate_id) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Связанные объекты</h2>
              </div>
              <div className="card-body space-y-3">
                {task.related_declaration_id && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Декларация</dt>
                    <dd className="mt-1">
                      <Link
                        to={`/declarations/${task.related_declaration_id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        #{task.related_declaration_id}
                      </Link>
                    </dd>
                  </div>
                )}
                {task.related_certificate_id && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Сертификат</dt>
                    <dd className="mt-1">
                      <Link
                        to={`/certificates/${task.related_certificate_id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        #{task.related_certificate_id}
                      </Link>
                    </dd>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
