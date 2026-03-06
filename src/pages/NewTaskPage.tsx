import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calendar, CheckSquare, User } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  title: z.string().min(1, 'Введите название задачи'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
  assigned_user_id: z.number().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function NewTaskPage() {
  const navigate = useNavigate();
  const { companyMember } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const onSubmit = async (data: TaskForm) => {
    try {
      const response = await tasksApi.create({
        ...data,
        company_id: companyMember!.company_id!,
        creator_user_id: companyMember!.user_id,
        status: 'pending',
      });
      toast.success('Задача создана');
      navigate(`/tasks/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания задачи');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/tasks')} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новая задача</h1>
          <p className="text-gray-600">Создайте новую задачу</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Основная информация</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Название задачи *</label>
              <input
                {...register('title')}
                className="input"
                placeholder="Введите название задачи"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="label">Описание</label>
              <textarea
                {...register('description')}
                className="input"
                rows={4}
                placeholder="Подробное описание задачи..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Приоритет</label>
                <select {...register('priority')} className="input">
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>

              <div>
                <label className="label">Срок выполнения</label>
                <input
                  {...register('due_date')}
                  type="date"
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="btn-outline"
          >
            Отмена
          </button>
          <button type="submit" className="btn-primary">
            Создать задачу
          </button>
        </div>
      </form>
    </div>
  );
}