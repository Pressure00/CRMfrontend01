import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckSquare, Calendar } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  title: z.string().min(1, 'Введите название задачи'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await tasksApi.getById(parseInt(id!));
        const task = response.data;
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          due_date: task.due_date || '',
        });
      } catch (error: any) {
        toast.error('Ошибка загрузки задачи');
        navigate('/tasks');
      }
    };

    if (id) fetchTask();
  }, [id, reset, navigate]);

  const onSubmit = async (data: TaskForm) => {
    try {
      await tasksApi.update(parseInt(id!), data);
      toast.success('Задача обновлена');
      navigate(`/tasks/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления задачи');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(`/tasks/${id}`)} className="btn-outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Редактировать задачу</h1>
          <p className="text-gray-600">Измените информацию о задаче</p>
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
            onClick={() => navigate(`/tasks/${id}`)}
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