'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Estadisticas {
  vistasHome: number;
  totalUsuarios: number;
  topPaises: Array<{
    pais: string;
    total: number;
  }>;
}

export default function EstadisticasPage() {
  const router = useRouter();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      const response = await fetch('/api/estadisticas');
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-600">Error al cargar estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Estadísticas de OpenAttendify</h1>
          <p className="text-gray-600">Panel de métricas y análisis del sistema</p>
        </div>

        {/* Métricas principales */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Vistas del Home */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-primary-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Visitas al Home</p>
                <p className="text-4xl font-bold text-gray-900">{estadisticas.vistasHome.toLocaleString()}</p>
              </div>
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Usuarios Registrados */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Usuarios Registrados</p>
                <p className="text-4xl font-bold text-gray-900">{estadisticas.totalUsuarios.toLocaleString()}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Países */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Top 10 Países</h2>
          
          {estadisticas.topPaises.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600">No hay datos de países disponibles</p>
            </div>
          ) : (
            <div className="space-y-4">
              {estadisticas.topPaises.map((pais, index) => {
                const maxTotal = estadisticas.topPaises[0].total;
                const porcentaje = (pais.total / maxTotal) * 100;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">{pais.pais || 'No especificado'}</span>
                        <span className="text-gray-600 font-medium">{pais.total} {pais.total === 1 ? 'usuario' : 'usuarios'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botón para volver */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
