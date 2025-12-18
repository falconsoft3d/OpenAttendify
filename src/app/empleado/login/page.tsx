'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function EmpleadoLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    codigo: '',
    password: '',
    remember: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    const savedCodigo = localStorage.getItem('rememberedEmpleadoCodigo');
    const savedPassword = localStorage.getItem('rememberedEmpleadoPassword');
    
    if (savedCodigo && savedPassword) {
      setFormData({
        codigo: savedCodigo,
        password: savedPassword,
        remember: true,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/empleado/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // Guardar o limpiar credenciales según opción "recordar"
        if (formData.remember) {
          localStorage.setItem('rememberedEmpleadoCodigo', formData.codigo);
          localStorage.setItem('rememberedEmpleadoPassword', formData.password);
        } else {
          localStorage.removeItem('rememberedEmpleadoCodigo');
          localStorage.removeItem('rememberedEmpleadoPassword');
        }
        
        router.push('/empleado');
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="OpenAttendify Logo"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OpenAttendify</h1>
          <p className="text-gray-600 mt-2">Portal del Empleado</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-gray-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Empleado
              </label>
              <input
                id="codigo"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white text-lg"
                placeholder="Ej: 10001"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white text-lg"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Recordar mis datos
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes acceso? Contacta a tu supervisor
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            © 2025 Attendify - Sistema de Asistencias
          </p>
        </div>
      </div>
    </div>
  );
}
