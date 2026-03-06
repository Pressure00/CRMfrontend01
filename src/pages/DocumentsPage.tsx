import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { documentsApi, foldersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  Search,
  FolderOpen,
  FileText,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Upload,
  FolderPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Document, Folder, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const { companyMember } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    parent_folder_id: null as number | null,
  });

  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<PaginatedResponse<Document>>({
    queryKey: ['documents', page, search, selectedFolder, companyMember?.company_id],
    queryFn: () => documentsApi.getAll({
      page,
      size: 20,
      search: search || undefined,
      folder_id: selectedFolder || undefined,
      company_id: companyMember?.company_id,
    }),
    enabled: !!companyMember?.company_id,
  });

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ['folders', companyMember?.company_id],
    queryFn: () => foldersApi.getAll(companyMember!.company_id!),
    enabled: !!companyMember?.company_id,
  });

  const updateFilters = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
    setPage(1);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Выберите файл');
      return;
    }
    if (!uploadForm.title.trim()) {
      toast.error('Введите название документа');
      return;
    }

    try {
      await documentsApi.create({
        title: uploadForm.title,
        description: uploadForm.description,
        file: uploadForm.file,
        folder_id: selectedFolder || undefined,
      });
      toast.success('Документ загружен');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', file: null });
      refetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderForm.name.trim()) {
      toast.error('Введите название папки');
      return;
    }

    try {
      await foldersApi.create({
        name: folderForm.name,
        description: folderForm.description,
        parent_folder_id: folderForm.parent_folder_id,
        company_id: companyMember!.company_id!,
      });
      toast.success('Папка создана');
      setShowFolderModal(false);
      setFolderForm({ name: '', description: '', parent_folder_id: null });
      // Invalidate folders query
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания папки');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;
    
    try {
      await documentsApi.delete(id);
      toast.success('Документ удален');
      refetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
    setMenuOpenId(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
          <p className="text-gray-600">Управление документами</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="btn-outline"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Новая папка
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            <Upload className="h-4 w-4 mr-2" />
            Загрузить документ
          </button>
        </div>
      </div>

      {/* Folders Bar */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedFolder === null
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Все документы
            </button>
            {folders?.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                  selectedFolder === folder.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="card">
        {documentsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : documents?.items.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет документов</h3>
            <p className="text-gray-500 mb-4">
              {selectedFolder ? 'В этой папке нет документов' : 'Загрузите первый документ'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              Загрузить документ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {documents?.items.map((document) => (
              <div
                key={document.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(document.mime_type)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {document.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(document.file_size)}
                      </p>
                      {document.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === document.id ? null : document.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === document.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <a
                          href={`/uploads/${document.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setMenuOpenId(null)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотреть
                        </a>
                        <button
                          onClick={() => {
                            documentsApi.download(document.id);
                            setMenuOpenId(null);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Скачать
                        </button>
                        <button
                          onClick={() => handleDelete(document.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Загружен {format(new Date(document.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                  {document.uploaded_by_user && ` • ${document.uploaded_by_user.full_name}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {documents && documents.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Показано {documents.items.length} из {documents.total}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-outline text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === documents.pages}
                className="btn-outline text-sm disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Загрузить документ</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="label">Название *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Описание</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="label">Файл *</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn-outline"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Загрузить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Создать папку</h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <div className="space-y-4">
                <div>
                  <label className="label">Название папки *</label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Описание</label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                {folders && folders.length > 0 && (
                  <div>
                    <label className="label">Родительская папка</label>
                    <select
                      value={folderForm.parent_folder_id || ''}
                      onChange={(e) => setFolderForm({ ...folderForm, parent_folder_id: e.target.value ? parseInt(e.target.value) : null })}
                      className="input"
                    >
                      <option value="">Нет (корневая папка)</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="btn-outline"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}