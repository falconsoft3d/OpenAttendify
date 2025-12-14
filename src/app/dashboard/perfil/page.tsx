'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  avatarUrl?: string | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Estado para subir avatar
  const [uploading, setUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para cambiar contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estado para eliminar cuenta
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'La imagen es muy grande. Máximo 5MB' });
      return;
    }

    setUploading(true);
    setAvatarMessage(null);

    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        try {
          const response = await fetch('/api/auth/upload-avatar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ avatarUrl: base64 }),
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setAvatarMessage({ type: 'success', text: '¡Imagen actualizada correctamente!' });
          } else {
            const error = await response.json();
            setAvatarMessage({ type: 'error', text: error.error || 'Error al actualizar imagen' });
          }
        } catch (error) {
          console.error('Error:', error);
          setAvatarMessage({ type: 'error', text: 'Error al subir la imagen' });
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setAvatarMessage({ type: 'error', text: 'Error al leer el archivo' });
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      setAvatarMessage({ type: 'error', text: 'Error al procesar la imagen' });
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar tu imagen de perfil?')) {
      return;
    }

    setUploading(true);
    setAvatarMessage(null);

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl: '' }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAvatarMessage({ type: 'success', text: 'Imagen eliminada correctamente' });
      } else {
        const error = await response.json();
        setAvatarMessage({ type: 'error', text: error.error || 'Error al eliminar imagen' });
      }
    } catch (error) {
      console.error('Error:', error);
      setAvatarMessage({ type: 'error', text: 'Error al eliminar la imagen' });
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validaciones
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Error al cambiar la contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteMessage(null);

    if (!deletePassword) {
      setDeleteMessage({ type: 'error', text: 'Debes ingresar tu contraseña' });
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteMessage({ type: 'success', text: 'Cuenta eliminada exitosamente. Redirigiendo...' });
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setDeleteMessage({ type: 'error', text: data.error || 'Error al eliminar la cuenta' });
      }
    } catch (error) {
      setDeleteMessage({ type: 'error', text: 'Error al eliminar la cuenta' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      {/* Información del Usuario */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Información Personal</h2>
        
        {/* Foto de Perfil */}
        <div className="mb-6 pb-6 border-b">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Foto de Perfil</h3>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nombre}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
                />
              ) : (
                <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center text-white text-4xl font-semibold border-4 border-primary-100">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Sube una foto de perfil para personalizar tu cuenta. Se recomienda usar una imagen cuadrada de al menos 200x200 píxeles.
              </p>
              
              {avatarMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm ${
                    avatarMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {avatarMessage.text}
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? 'Subiendo...' : user?.avatarUrl ? 'Cambiar Foto' : 'Subir Foto'}
                </button>

                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading}
                    className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Eliminar Foto
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Tamaño máximo: 5MB. Formatos: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>

        {/* Datos del Usuario */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-600">Nombre</label>
            <p className="text-gray-800 text-lg">{user?.nombre}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
            <p className="text-gray-800 text-lg">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Rol</label>
            <p className="text-gray-800 text-lg">{user?.rol}</p>
          </div>
        </div>
      </div>

      {/* Cambiar Contraseña */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={passwordLoading}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={passwordLoading}
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
              disabled={passwordLoading}
              minLength={6}
            />
          </div>

          {passwordMessage && (
            <div
              className={`p-4 rounded-lg ${
                passwordMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {passwordLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Zona de Peligro - Eliminar Cuenta */}
      <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Zona de Peligro</h2>
        <p className="text-gray-600 mb-4">
          Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.
        </p>

        {!showDeleteModal ? (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Eliminar Cuenta
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              ⚠️ Confirmar Eliminación de Cuenta
            </h3>
            <p className="text-red-700 mb-4">
              Esta acción eliminará permanentemente tu cuenta y todos los datos asociados, incluyendo:
            </p>
            <ul className="list-disc list-inside text-red-700 mb-4 space-y-1">
              <li>Todas tus empresas</li>
              <li>Todos los empleados de tus empresas</li>
              <li>Todos los registros de asistencia</li>
            </ul>
            <p className="text-red-700 font-semibold mb-4">
              Esta acción NO se puede deshacer.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-red-700 mb-1">
                  Ingresa tu contraseña para confirmar
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={deleteLoading}
                  placeholder="Tu contraseña actual"
                />
              </div>

              {deleteMessage && (
                <div
                  className={`p-4 rounded-lg ${
                    deleteMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {deleteMessage.text}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteMessage(null);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {deleteLoading ? 'Eliminando...' : 'Sí, Eliminar Mi Cuenta'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
