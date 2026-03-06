import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Award, Calendar } from 'lucide-react';
import { certificatesApi } from '@/lib/api';
import toast from 'react-hot-toast';

const certificateSchema = z.object({
  certificate_number: z.string().min(1, 'Введите номер сертификата'),
  certificate_type: z.string().min(1, 'Введите тип сертификата'),
  issue_date: z.string().min(1, 'Выберите дату выдачи'),
  expiry_date: z.string().min(1, 'Выберите дату истечения'),
  description: z.string().optional(),
});

type CertificateForm = z.infer<typeof certificateSchema>;

export default function EditCertificatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CertificateForm>({
    resolver: zodResolver(certificateSchema),
  });

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await certificatesApi.getById(parseInt(id!));
        const certificate = response.data;
        reset({
          certificate_number: certificate.certificate_number,
          certificate_type: certificate.certificate_type,
          issue_date: certificate.issue_date,
          expiry_date: certificate.expiry_date,
          description: certificate.description || '',
        });
      } catch (error: any) {
        toast.error('Ошибка загрузки сертификата');
        navigate('/certificates');
      }
    };

    if (id) fetchCertificate();
  }, [id, reset, navigate]);

  const onSubmit = async (data: CertificateForm) => {
    try {
      await certificatesApi.update(parseInt(id!), data);
      toast.success('Сертификат обновлен');
      navigate(`/certificates/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления сертификата');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(`/certificates/${id}`)} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Редактировать сертификат</h1>
          <p className="text-gray-600">Измените информацию о сертификате</p>
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
            onClick={() => navigate(`/certificates/${id}`)}
            className="btn-outline"
          >
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
}