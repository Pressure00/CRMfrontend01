import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Car, Calendar } from 'lucide-react';
import { declarationsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const declarationSchema = z.object({
  client_name: z.string().min(1, 'Введите имя клиента'),
  client_phone: z.string().min(1, 'Введите телефон клиента'),
  client_email: z.string().email('Введите корректный email').optional().or(z.literal('')),
  declaration_date: z.string().min(1, 'Выберите дату декларации'),
  deadline: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  notes: z.string().optional(),
});

type DeclarationForm = z.infer<typeof declarationSchema>;

export default function NewDeclarationPage() {
  const navigate = useNavigate();
  const { companyMember } = useAuthStore();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_type: '',
    brand: '',
    model: '',
    vin: '',
    year: '',
    license_plate: '',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeclarationForm>({
    resolver: zodResolver(declarationSchema),
    defaultValues: {
      priority: 'medium',
      declaration_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: DeclarationForm) => {
    try {
      const response = await declarationsApi.create({
        ...data,
        company_id: companyMember!.company_id!,
        deadline: data.deadline || null,
        client_email: data.client_email || null,
        vehicles: vehicles.length > 0 ? vehicles : undefined,
      });
      toast.success('Декларация создана');
      navigate(`/declarations/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания декларации');
    }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_type || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.vin) {
      toast.error('Заполните обязательные поля');
      return;
    }
    setVehicles([
      ...vehicles,
      {
        ...vehicleForm,
        year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
      },
    ]);
    setShowVehicleForm(false);
    setVehicleForm({
      vehicle_type: '',
      brand: '',
      model: '',
      vin: '',
      year: '',
      license_plate: '',
    });
  };

  const removeVehicle = (index: number) => {
    setVehicles(vehicles.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/declarations')} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новая декларация</h1>
          <p className="text-gray-600">Создайте новую декларацию на таможню</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Основная информация</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">ФИО клиента *</label>
                <input
                  {...register('client_name')}
                  className="input"
                  placeholder="Иванов Иван Иванович"
                />
                {errors.client_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Телефон клиента *</label>
                <input
                  {...register('client_phone')}
                  className="input"
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.client_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_phone.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email клиента</label>
                <input
                  {...register('client_email')}
                  type="email"
                  className="input"
                  placeholder="client@example.com"
                />
                {errors.client_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.client_email.message}</p>
                )}
              </div>

              <div>
                <label className="label">Дата декларации *</label>
                <input
                  {...register('declaration_date')}
                  type="date"
                  className="input"
                />
                {errors.declaration_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.declaration_date.message}</p>
                )}
              </div>

              <div>
                <label className="label">Срок завершения</label>
                <input
                  {...register('deadline')}
                  type="date"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Приоритет</label>
                <select {...register('priority')} className="input">
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Примечания</label>
              <textarea
                {...register('notes')}
                className="input"
                rows={3}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Транспортные средства</h2>
            <button
              type="button"
              onClick={() => setShowVehicleForm(!showVehicleForm)}
              className="btn-primary text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить ТС
            </button>
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
                  <button type="submit" className="btn-primary">
                    Добавить
                  </button>
                </div>
              </form>
            )}

            {vehicles.length > 0 && (
              <div className="space-y-2">
                {vehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
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
                    <button
                      type="button"
                      onClick={() => removeVehicle(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/declarations')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Создать декларацию
          </button>
        </div>
      </form>
    </div>
  );
}