import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, Award } from 'lucide-react';
import { certificatesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const certificateSchema = z.object({
  certificate_number: z.string().min(1, 'Введите номер сертификата'),
  certificate_type: z.string().min(1, 'Введите тип сертификата'),
  issue_date: z.string().min(1, 'Выберите дату выдачи'),
  expiry_date: z.string().min(1, 'Выберите дату истечения'),
  description: z.string().optional(),
});

type CertificateForm = z.infer<typeof certificateSchema>;

export default function NewCertificatePage() {
  const navigate = useNavigate();
  const { companyMember } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CertificateForm>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      issue_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: CertificateForm) => {
    try {
      const response = await certificatesApi.create({
        ...data,
        declarant_company_id: companyMember!.company_id!,
        status: 'draft',
      });
      toast.success('Сертификат создан');
      navigate(`/certificates/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания сертификата');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/certificates')} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новый сертификат</h1>
          <p className="text-gray-600">Создайте новый сертификат</p>
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
                <label className="label">Номер сертификата *</label>
                <input
                  {...register('certificate_number')}
                  className="input"
                  placeholder="CERT-2024-001"
                />
                {errors.certificate_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.certificate_number.message}</p>
                )}
              </div>

              <div>
                <label className="label">Тип сертификата *</label>
                <input
                  {...register('certificate_type')}
                  className="input"
                  placeholder="ISO 9001, ГОСТ и т.д."
                />
                {errors.certificate_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.certificate_type.message}</p>
                )}
              </div>

              <div>
                <label className="label">Дата выдачи *</label>
                <input
                  {...register('issue_date')}
                  type="date"
                  className="input"
                />
                {errors.issue_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>
                )}
              </div>

              <div>
                <label className="label">Действует до *</label>
                <input
                  {...register('expiry_date')}
                  type="date"
                  className="input"
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label">Описание</label>
              <textarea
                {...register('description')}
                className="input"
                rows={4}
                placeholder="Дополнительная информация о сертификате..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/certificates')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Создать сертификат
          </button>
        </div>
      </form>
    </div>
  );
}