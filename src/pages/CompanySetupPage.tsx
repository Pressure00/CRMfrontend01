import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Plus, Check } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function CompanySetupPage() {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyInn, setCompanyInn] = useState('');
  const [searchInn, setSearchInn] = useState('');
  const [foundCompany, setFoundCompany] = useState<{ id: number; name: string; inn: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);

  const handleCreateCompany = async () => {
    if (!companyName.trim() || !companyInn.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    if (companyInn.length !== 9) {
      toast.error('ИНН должен состоять из 9 цифр');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.createCompany({
        company_name: companyName,
        company_inn: companyInn,
      });

      toast.success('Компания создана!');
      // Refresh user data
      const userResponse = await authApi.getMe();
      const companyStatusResponse = await authApi.getCompanyStatus();
      
      login(userResponse.data, localStorage.getItem('access_token')!, {
        company_id: companyStatusResponse.data.company_id!,
        role: companyStatusResponse.data.role!,
        is_active: true,
        user_id: userResponse.data.id,
        id: 0,
        is_blocked: false,
        joined_at: new Date().toISOString(),
      });

      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка создания компании';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCompany = async () => {
    if (!searchInn.trim()) {
      toast.error('Введите ИНН для поиска');
      return;
    }

    if (searchInn.length !== 9) {
      toast.error('ИНН должен состоять из 9 цифр');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.lookupCompany(searchInn);
      if (response.data.exists) {
        setFoundCompany(response.data.company!);
      } else {
        setFoundCompany(null);
        toast.error('Компания с таким ИНН не найдена');
      }
    } catch (error: any) {
      toast.error('Ошибка поиска компании');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!foundCompany) return;

    setIsLoading(true);
    try {
      const response = await authApi.joinCompany({ company_inn: foundCompany.inn });
      toast.success(response.data.message);
      
      // Refresh user data
      const userResponse = await authApi.getMe();
      const companyStatusResponse = await authApi.getCompanyStatus();
      
      login(userResponse.data, localStorage.getItem('access_token')!, {
        company_id: companyStatusResponse.data.company_id!,
        role: companyStatusResponse.data.role!,
        is_active: false, // Pending approval
        user_id: userResponse.data.id,
        id: 0,
        is_blocked: false,
        joined_at: new Date().toISOString(),
      });

      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Ошибка присоединения к компании';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Настройка компании
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {user?.activity_type === 'declarant' 
                ? 'Создайте компанию-декларанта или присоединитесь к существующей'
                : 'Создайте компанию-сертификатора или присоединитесь к существующей'}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full card p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                  <Plus className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Создать новую компанию
                  </h3>
                  <p className="text-sm text-gray-500">
                    Вы станете директором новой компании
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full card p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Присоединиться к существующей компании
                  </h3>
                  <p className="text-sm text-gray-500">
                    Вам нужно будет знать ИНН компании
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Создание компании
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Введите данные для создания новой компании
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <label className="label">Название компании</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                placeholder="ООО Рога и Копыта"
              />
            </div>

            <div>
              <label className="label">ИНН компании (9 цифр)</label>
              <input
                type="text"
                value={companyInn}
                onChange={(e) => setCompanyInn(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="input"
                placeholder="123456789"
                maxLength={9}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setMode(null)}
                className="flex-1 btn-outline"
              >
                Назад
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={isLoading}
                className="flex-1 btn-primary"
              >
                {isLoading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Присоединение к компании
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Введите ИНН компании, к которой хотите присоединиться
            </p>
          </div>

          <div className="card p-6 space-y-4">
            <div>
              <label className="label">ИНН компании (9 цифр)</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchInn}
                  onChange={(e) => setSearchInn(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className="input pr-10"
                  placeholder="123456789"
                  maxLength={9}
                />
                <button
                  onClick={handleSearchCompany}
                  className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {foundCompany && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{foundCompany.name}</p>
                    <p className="text-sm text-gray-500">ИНН: {foundCompany.inn}</p>
                  </div>
                  <button
                    onClick={handleJoinCompany}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Присоединение...' : 'Присоединиться'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setMode(null)}
                className="flex-1 btn-outline"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
