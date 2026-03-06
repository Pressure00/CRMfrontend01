import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { declarationsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Calendar,
  User,
  Car,
  FileText,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function DeclarationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, companyMember } = useAuthStore();
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_type: '',
    brand: '',
    model: '',
    vin: '',
    year: '',
    license_plate: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: declaration, isLoading } = useQuery({
    queryKey: ['declaration', id],
    queryFn: () => declarationsApi.getById(parseInt(id!)),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => declarationsApi.changeStatus(parseInt(id!), status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaration', id] });
      queryClient.invalidateQueries({ queryKey: ['declarations'] });
      toast.success('Статус обновлен');
    },
  });

  const addVehicleMutation = useMutation({
    mutationFn: (data: any) => declarationsApi.addVehicle(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaration', id] });
      setShowVehicleForm(false);
      setVehicleForm({
        vehicle_type: '',
        brand: '',
        model: '',
        vin: '',
        year: '',
        license_plate: '',
      });
      toast.success('Транспортное средство добавлено');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) => declarationsApi.removeVehicle(parseInt(id!), vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaration', id] });
      toast.success('Транспортное средство удалено');
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) => declarationsApi.uploadAttachment(parseInt(id!), file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaration', id] });
      setSelectedFile(null);
      toast.success('Файл загружен');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) => declarationsApi.removeAttachment(parseInt(id!), attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['declaration', id] });
      toast.success('Файл удален');
    },
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_type || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.vin) {
      toast.error('Заполните обязательные поля');
      return;
    }
    addVehicleMutation.mutate({
      ...vehicleForm,
      year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
    });
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    uploadAttachmentMutation.mutate(selectedFile);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Декларация не найдена</h3>
        <button onClick={() => navigate('/declarations')} className="btn-primary">
          Назад к списку
        </button>
      </div>
    );
  }

  const canEdit = companyMember?.role === 'director' || declaration.created_by === user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/declarations')} className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Декларация {declaration.declaration_number}
            </h1>
            <p className="text-gray-600">
              Создана: {format(new Date(declaration.created_at), 'dd MMMM yyyy', { locale: ru })}
            </p>
          </div>
        </div>
        {canEdit && (
          <button className="btn-outline">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </button>
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
                    <span className={`badge ${
                      declaration.status === 'draft' ? 'badge-gray' :
                      declaration.status === 'submitted' ? 'badge-info' :
                      declaration.status === 'in_progress' ? 'badge-warning' :
                      declaration.status === 'completed' ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {declaration.status === 'draft' ? 'Черновик' :
                       declaration.status === 'submitted' ? 'Отправлена' :
                       declaration.status === 'in_progress' ? 'В работе' :
                       declaration.status === 'completed' ? 'Завершена' :
                       'Отменена'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Приоритет</dt>
                  <dd className="mt-1">
                    <span className={`badge ${
                      declaration.priority === 'low' ? 'badge-gray' :
                      declaration.priority === 'medium' ? 'badge-info' :
                      declaration.priority === 'high' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {declaration.priority === 'low' ? 'Низкий' :
                       declaration.priority === 'medium' ? 'Средний' :
                       declaration.priority === 'high' ? 'Высокий' :
                       'Срочный'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Клиент</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.client_name || 'Не указан'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Телефон клиента</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.client_phone || 'Не указан'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email клиента</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.client_email || 'Не указан'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Срок</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.deadline ? (
                      <span className={`flex items-center ${new Date(declaration.deadline) < new Date() ? 'text-red-600' : ''}`}>
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(declaration.deadline), 'dd MMM yyyy', { locale: ru })}
                      </span>
                    ) : (
                      'Не указан'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ответственный</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.assigned_user?.full_name || 'Не назначен'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Дата декларации</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(declaration.declaration_date), 'dd MMM yyyy', { locale: ru })}
                  </dd>
                </div>
              </dl>
              {declaration.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-500">Примечания</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {declaration.notes}
                  </dd>
                </div>
              )}
            </div>
          </div>

          {/* Vehicles */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Транспортные средства</h2>
              {canEdit && (
                <button
                  onClick={() => setShowVehicleForm(!showVehicleForm)}
                  className="btn-primary text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить ТС
                </button>
              )}
            </div>
            <div className="card-body">
              {showVehicleForm && (
                <form onSubmit={handleAddVehicle} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Тип ТС *</label>
                      <input
                        type="text"
                        value={vehicleForm.vehicle_type}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                        className="input"
                        placeholder="Легковой, грузовой и т.д."
                      />
                    </div>
                    <div>
                      <label className="label">Марка *</label>
                      <input
                        type="text"
                        value={vehicleForm.brand}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                        className="input"
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <label className="label">Модель *</label>
                      <input
                        type="text"
                        value={vehicleForm.model}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                        className="input"
                        placeholder="Camry"
                      />
                    </div>
                    <div>
                      <label className="label">VIN *</label>
                      <input
                        type="text"
                        value={vehicleForm.vin}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })}
                        className="input"
                        placeholder="JTNBV4HE6D1234567"
                      />
                    </div>
                    <div>
                      <label className="label">Год выпуска</label>
                      <input
                        type="number"
                        value={vehicleForm.year}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                        className="input"
                        placeholder="2020"
                        min="1900"
                        max="2024"
                      />
                    </div>
                    <div>
                      <label className="label">Номерной знак</label>
                      <input
                        type="text"
                        value={vehicleForm.license_plate}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value.toUpperCase() })}
                        className="input"
                        placeholder="А123БС777"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowVehicleForm(false)}
                      className="btn-outline"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={addVehicleMutation.isLoading}
                      className="btn-primary"
                    >
                      {addVehicleMutation.isLoading ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </form>
              )}

              {declaration.vehicles && declaration.vehicles.length > 0 ? (
                <div className="space-y-3">
                  {declaration.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model} ({vehicle.vehicle_type})
                          </p>
                          <p className="text-sm text-gray-500">
                            VIN: {vehicle.vin} {vehicle.license_plate && `• №: ${vehicle.license_plate}`}
                            {vehicle.year && ` • ${vehicle.year} г.`}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Нет транспортных средств</p>
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

              {declaration.attachments && declaration.attachments.length > 0 ? (
                <div className="space-y-2">
                  {declaration.attachments.map((attachment) => (
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
              <button
                onClick={() => updateStatusMutation.mutate('submitted')}
                disabled={declaration.status !== 'draft' || updateStatusMutation.isLoading}
                className="w-full btn-outline disabled:opacity-50"
              >
                Отправить на рассмотрение
              </button>
              <button
                onClick={() => updateStatusMutation.mutate('in_progress')}
                disabled={declaration.status !== 'submitted' || updateStatusMutation.isLoading}
                className="w-full btn-outline disabled:opacity-50"
              >
                Начать работу
              </button>
              <button
                onClick={() => updateStatusMutation.mutate('completed')}
                disabled={declaration.status !== 'in_progress' || updateStatusMutation.isLoading}
                className="w-full btn-primary disabled:opacity-50"
              >
                Завершить
              </button>
              <button
                onClick={() => updateStatusMutation.mutate('cancelled')}
                disabled={declaration.status === 'cancelled' || declaration.status === 'completed' || updateStatusMutation.isLoading}
                className="w-full btn-danger disabled:opacity-50"
              >
                Отменить
              </button>
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
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {declaration.created_by_user?.full_name || 'Неизвестно'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Компания</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {declaration.company?.name || 'Не указана'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Обновлена</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(declaration.updated_at), 'dd MMM yyyy HH:mm', { locale: ru })}
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