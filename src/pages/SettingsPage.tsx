import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Camera, Bell } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Введите полное имя'),
  phone: z.string().min(10, 'Введите номер телефона'),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Введите текущий пароль'),
  new_password: z.string().min(6, 'Новый пароль должен быть не менее 6 символов'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Пароли не совпадают",
  path: ["confirm_password"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      const response = await settingsApi.updateProfile(data);
      setUser(response.data);
      toast.success('Профиль обновлен');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления профиля');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      await settingsApi.changePassword(data.current_password, data.new_password);
      toast.success('Пароль изменен');
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка изменения пароля');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой. Максимум 5 МБ');
      return;
    }

    setAvatarFile(file);
    setIsUploadingAvatar(true);
    try {
      const response = await settingsApi.uploadAvatar(file);
      setUser(response.data);
      toast.success('Аватар обновлен');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    try {
      await settingsApi.toggleSound(enabled);
      toast.success('Настройки звука обновлены');
    } catch (error: any) {
      toast.error('Ошибка обновления настроек');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Профиль' },
    { id: 'password', name: 'Пароль' },
    { id: 'notifications', name: 'Уведомления' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600">Управление настройками аккаунта</p>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="card-body">
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-2xl">
              {/* Avatar */}
              <div>
                <label className="label">Аватар</label>
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={`/uploads/${user.avatar_url}`} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <label className="btn-outline cursor-pointer">
                      <Camera className="h-4 w-4 mr-2" />
                      Изменить аватар
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG до 5 МБ
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Полное имя</label>
                <input
                  {...profileForm.register('full_name')}
                  className="input"
                  placeholder="Иванов Иван Иванович"
                />
                {profileForm.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="label">Email (только для чтения)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email нельзя изменить
                </p>
              </div>

              <div>
                <label className="label">Телефон</label>
                <input
                  {...profileForm.register('phone')}
                  className="input"
                  placeholder="+7 (999) 123-45-67"
                />
                {profileForm.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="label">Тип деятельности</label>
                <input
                  type="text"
                  value={user?.activity_type === 'declarant' ? 'Декларант' : 'Сертификатор'}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <button type="submit" className="btn-primary">
                Сохранить изменения
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-2xl">
              <div>
                <label className="label">Текущий пароль</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('current_password')}
                    type="password"
                    className="input"
                    placeholder="Введите текущий пароль"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {passwordForm.formState.errors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.current_password.message}</p>
                )}
              </div>

              <div>
                <label className="label">Новый пароль</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('new_password')}
                    type="password"
                    className="input"
                    placeholder="Минимум 6 символов"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {passwordForm.formState.errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="label">Подтвердите новый пароль</label>
                <div className="relative">
                  <input
                    {...passwordForm.register('confirm_password')}
                    type="password"
                    className="input"
                    placeholder="Повторите новый пароль"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                {passwordForm.formState.errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirm_password.message}</p>
                )}
              </div>

              <button type="submit" className="btn-primary">
                Изменить пароль
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Звуковые уведомления</p>
                    <p className="text-sm text-gray-500">
                      Воспроизводить звук при получении уведомлений
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSoundToggle(!user?.sound_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    user?.sound_enabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user?.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email уведомления</p>
                    <p className="text-sm text-gray-500">
                      Получать уведомления на email (в разработке)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}