'use client';

import { useState, useEffect } from 'react';

interface Solicitud {
  id: string;
  secuencia: string;
  fecha: string;
  texto: string;
  valor: number;
  estado: 'SOLICITADO' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
}

export default function SolicitudesEmpleado() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fecha, setFecha] = useState('');
  const [texto, setTexto] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await fetch('/api/empleado/solicitudes');
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.solicitudes);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/empleado/solicitudes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fecha,
          texto,
          valor: valor ? parseFloat(valor) : 0,
        }),
      });

      if (response.ok) {
        setFecha('');
        setTexto('');
        setValor('');
        setShowForm(false);
        cargarSolicitudes();
      } else {
        const data = await response.json();
        setError(data.error || 'Error al crear solicitud');
      }
    } catch (error) {
      setError('Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const styles = {
      SOLICITADO: 'bg-yellow-100 text-yellow-800',
      APROBADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
    };
    return styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Mis Solicitudes</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nueva Solicitud'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Nueva Solicitud</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe tu solicitud..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (opcional)
                </label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {submitting ? 'Creando...' : 'Crear Solicitud'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de solicitudes */}
        <div className="space-y-3">
          {solicitudes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              No tienes solicitudes. Crea una nueva para empezar.
            </div>
          ) : (
            solicitudes.map((solicitud) => (
              <div
                key={solicitud.id}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-mono text-gray-500">
                      {solicitud.secuencia}
                    </span>
                    <h3 className="font-medium text-gray-900 mt-1">
                      {solicitud.texto}
                    </h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(
                      solicitud.estado
                    )}`}
                  >
                    {solicitud.estado}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(solicitud.fecha).toLocaleDateString('es-ES')}
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> $
                    {Number(solicitud.valor).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
