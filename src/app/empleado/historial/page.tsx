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
  tipoRegistro: string;
  observaciones: string | null;
}

export default function HistorialAsistencias() {
  const router = useRouter();
  const [empleado, setEmpleado] = useState<Empleado | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Obtener historial de asistencias
      const resAsistencias = await fetch('/api/empleado/asistencia');
      if (resAsistencias.ok) {
        const dataAsistencias = await resAsistencias.json();
        setAsistencias(dataAsistencias.asistencias || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      router.push('/empleado/login');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatearHora = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularHorasTrabajadas = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'En curso';
    
    const entrada = new Date(checkIn);
    const salida = new Date(checkOut);
    const diff = salida.getTime() - entrada.getTime();
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };

  const cerrarSesion = async () => {
    try {
      await fetch('/api/empleado/logout', { method: 'POST' });
      router.push('/empleado/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Historial</h1>
            <p className="text-blue-100 text-sm">{empleado?.nombre} {empleado?.apellido}</p>
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

        {/* Lista de asistencias */}
        <div className="space-y-3">
          {asistencias.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-lg font-semibold mb-2">Sin registros</p>
              <p className="text-blue-100 text-sm">
                Aún no tienes asistencias registradas
              </p>
            </div>
          ) : (
            asistencias.map((asistencia) => (
              <div
                key={asistencia.id}
                className="bg-white rounded-2xl shadow-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatearFecha(asistencia.checkIn)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {asistencia.tipoRegistro.toLowerCase()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asistencia.checkOut
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {asistencia.checkOut ? 'Completo' : 'En curso'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Entrada</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatearHora(asistencia.checkIn)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Salida</p>
                    <p className="text-lg font-bold text-gray-900">
                      {asistencia.checkOut
                        ? formatearHora(asistencia.checkOut)
                        : '--:--'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Tiempo trabajado
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {calcularHorasTrabajadas(
                        asistencia.checkIn,
                        asistencia.checkOut
                      )}
                    </span>
                  </div>
                </div>

                {asistencia.observaciones && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Observaciones</p>
                    <p className="text-sm text-gray-700">
                      {asistencia.observaciones}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
