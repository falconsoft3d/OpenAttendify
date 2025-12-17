'use client';

import { useState, useEffect } from 'react';

interface Informacion {
  id: string;
  secuencia: string;
  titulo: string;
  descripcion: string;
  clasificacion: 'INFORMATIVA' | 'ALERTA' | 'OTRAS';
  createdAt: string;
}

export default function InformacionesEmpleado() {
  const [informaciones, setInformaciones] = useState<Informacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarInformaciones();
  }, []);

  const cargarInformaciones = async () => {
    try {
      const response = await fetch('/api/empleado/informaciones');
      if (response.ok) {
        const data = await response.json();
        setInformaciones(data.informaciones);
      }
    } catch (error) {
      console.error('Error al cargar informaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const esNueva = (fechaCreacion: string) => {
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferenciaDias = (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24);
    return diferenciaDias < 3;
  };

  const getClasificacionBadge = (clasificacion: string) => {
    const styles = {
      INFORMATIVA: 'bg-blue-100 text-blue-800',
      ALERTA: 'bg-red-100 text-red-800',
      OTRAS: 'bg-gray-100 text-gray-800',
    };
    return styles[clasificacion as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getClasificacionTexto = (clasificacion: string) => {
    const textos = {
      INFORMATIVA: 'Informativa',
      ALERTA: 'Alerta',
      OTRAS: 'Otras',
    };
    return textos[clasificacion as keyof typeof textos] || clasificacion;
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Informaciones</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Lista de informaciones */}
        <div className="space-y-3">
          {informaciones.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              No hay informaciones disponibles.
            </div>
          ) : (
            informaciones.map((info) => (
              <div
                key={info.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow relative"
              >
                {/* Badge NUEVO si tiene menos de 3 días */}
                {esNueva(info.createdAt) && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                      NUEVO
                    </span>
                  </div>
                )}

                <div className="mb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-16">
                      <span className="text-sm font-mono text-gray-500">
                        {info.secuencia}
                      </span>
                      <h3 className="font-semibold text-gray-900 mt-1 text-lg">
                        {info.titulo}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-3 leading-relaxed">
                  {info.descripcion}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getClasificacionBadge(
                      info.clasificacion
                    )}`}
                  >
                    {getClasificacionTexto(info.clasificacion)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(info.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
