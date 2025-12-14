'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  cargo: string;
  empresa: {
    id: string;
    nombre: string;
  };
}

interface Asistencia {
  id: string;
  checkIn: string;
  checkOut: string | null;
}

export default function EmpleadoPortal() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [asistenciaActiva, setAsistenciaActiva] = useState<Asistencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // Obtener datos del empleado
      const resEmpleado = await fetch('/api/empleado/me');
      if (!resEmpleado.ok) {
        router.push('/empleado/login');
        return;
      }
      const dataEmpleado = await resEmpleado.json();
      setEmpleado(dataEmpleado.empleado);

      // Obtener asistencia activa
      const resAsistencia = await fetch('/api/empleado/asistencia?tipo=activa');
      if (resAsistencia.ok) {
        const dataAsistencia = await resAsistencia.json();
        setAsistenciaActiva(dataAsistencia.asistencia);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      router.push('/empleado/login');
    } finally {
      setLoading(false);
    }
  };

  const registrarEntrada = async () => {
    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      const res = await fetch('/api/empleado/asistencia', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar entrada');
        return;
      }

      setMensaje('¡Entrada registrada exitosamente!');
      setAsistenciaActiva(data.asistencia);
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setProcesando(false);
    }
  };

  const registrarSalida = async () => {
    setProcesando(true);
    setError('');
    setMensaje('');

    try {
      const res = await fetch('/api/empleado/asistencia', {
        method: 'PATCH',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrar salida');
        return;
      }

      setMensaje('¡Salida registrada exitosamente!');
      setAsistenciaActiva(null);
      
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setProcesando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await fetch('/api/empleado/logout', { method: 'POST' });
      router.push('/empleado/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularHorasTrabajadas = () => {
    if (!asistenciaActiva) return '0h 0m';
    
    const entrada = new Date(asistenciaActiva.checkIn);
    const ahora = new Date();
    const diff = ahora.getTime() - entrada.getTime();
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold">¡Hola, {empleado?.nombre}!</h1>
            <p className="text-blue-100 text-sm">{empleado?.cargo}</p>
            <p className="text-blue-100 text-xs mt-1">{empleado?.empresa.nombre}</p>
          </div>
          <button
            onClick={cerrarSesion}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="mb-4 p-4 bg-green-500 text-white rounded-2xl shadow-lg">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-2xl shadow-lg">
            {error}
          </div>
        )}

        {/* Estado de asistencia */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="text-center">
            <div className="mb-6">
              <div
                className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${
                  asistenciaActiva
                    ? 'bg-green-100'
                    : 'bg-gray-100'
                }`}
              >
                {asistenciaActiva ? (
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {asistenciaActiva ? 'En el trabajo' : 'Fuera del trabajo'}
              </h2>

              {asistenciaActiva && (
                <div className="space-y-2">
                  <p className="text-gray-600">
                    Entrada: {formatearHora(asistenciaActiva.checkIn)}
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    Tiempo trabajado: {calcularHorasTrabajadas()}
                  </p>
                </div>
              )}

              {!asistenciaActiva && (
                <p className="text-gray-600">
                  Registra tu entrada cuando llegues al trabajo
                </p>
              )}
            </div>

            {/* Botón principal */}
            <button
              onClick={asistenciaActiva ? registrarSalida : registrarEntrada}
              disabled={procesando}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-200 ${
                asistenciaActiva
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              } ${procesando ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {procesando
                ? 'Procesando...'
                : asistenciaActiva
                ? 'REGISTRAR SALIDA'
                : 'REGISTRAR ENTRADA'}
            </button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100">Código de empleado</span>
            <span className="font-semibold">{empleado?.codigo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-100">Estado</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500 text-xs font-semibold">
              Activo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
