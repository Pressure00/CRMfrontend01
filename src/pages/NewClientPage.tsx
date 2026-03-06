import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Users, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { clientsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  full_name: z.string().min(1, 'Введите ФИО клиента'),
  phone: z.string().min(1, 'Введите телефон'),
  email: z.string().email('Введите корректный email').optional().or(z.literal('')),
  address: z.string().optional(),
  inn: z.string().optional(),
  passport_series: z.string().optional(),
  passport_number: z.string().optional(),
  passport_issued_by: z.string().optional(),
  passport_issued_date: z.string().optional(),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const navigate = useNavigate();
  const { companyMember } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientForm) => {
    try {
      const response = await clientsApi.create({
        ...data,
        company_id: companyMember!.company_id!,
      });
      toast.success('Клиент добавлен');
      navigate(`/clients/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления клиента');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/clients')} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новый клиент</h1>
          <p className="text-gray-600">Добавьте нового клиента</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Контактная информация</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">ФИО *</label>
              <input
                {...register('full_name')}
                className="input"
                placeholder="Иванов Иван Иванович"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Телефон *</label>
                <input
                  {...register('phone')}
                  className="input"
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="input"
                  placeholder="client@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Адрес</label>
              <textarea
                {...register('address')}
                className="input"
                rows={2}
                placeholder="Город, улица, дом..."
              />
            </div>

            <div>
              <label className="label">ИНН</label>
              <input
                {...register('inn')}
                className="input"
                placeholder="1234567890"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Паспортные данные</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Серия паспорта</label>
                <input
                  {...register('passport_series')}
                  className="input"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="label">Номер паспорта</label>
                <input
                  {...register('passport_number')}
                  className="input"
                  placeholder="567890"
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <label className="label">Кем выдан</label>
              <input
                {...register('passport_issued_by')}
                className="input"
                placeholder="УФМС России по г. Москве"
              />
            </div>

            <div>
              <label className="label">Дата выдачи</label>
              <input
                {...register('passport_issued_date')}
                type="date"
                className="input"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Примечания</h2>
          </div>
          <div className="card-body">
            <textarea
              {...register('notes')}
              className="input"
              rows={4}
              placeholder="Дополнительная информация..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Добавить клиента
          </button>
        </div>
      </form>
    </div>
  );
}