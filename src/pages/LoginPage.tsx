import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      const { access_token, user_id, is_admin } = response.data;

      // Save token to localStorage BEFORE making authenticated requests
      localStorage.setItem('access_token', access_token);

      // Get user details
      const userResponse = await authApi.getMe();
      const user = userResponse.data;

      // Get company status
      let companyMember = null;
      try {
        const companyStatusResponse = await authApi.getCompanyStatus();
        if (companyStatusResponse.data.status === 'active') {
          companyMember = {
            company_id: companyStatusResponse.data.company_id!,
            role: companyStatusResponse.data.role!,
            is_active: true,
            user_id: user.id,
            id: 0,
          };
        }
      } catch (error) {
        // Company not set up yet, that's okay
      }

      login(user, access_token, companyMember);
      toast.success('Добро пожаловать!');

      // Redirect based on user type and company status
      if (is_admin) {
        navigate('/admin');
      } else if (!companyMember) {
        navigate('/company-setup');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка входа';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Declarant CRM - система управления декларациями и сертификатами
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  className="input pl-10"
                  placeholder="example@domain.com"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Пароль
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Введите пароль"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}