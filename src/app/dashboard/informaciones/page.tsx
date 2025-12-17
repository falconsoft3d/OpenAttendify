'use client';

import { useState, useEffect } from 'react';

interface Informacion {
  id: string;
  secuencia: string;
  titulo: string;
  descripcion: string;
  clasificacion: 'INFORMATIVA' | 'ALERTA' | 'OTRAS';
  createdAt: string;
  updatedAt: string;
}

export default function InformacionesPage() {
  const [informaciones, setInformaciones] = useState<Informacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    clasificacion: 'INFORMATIVA' as 'INFORMATIVA' | 'ALERTA' | 'OTRAS',
  });

  const [filtros, setFiltros] = useState({
    clasificacion: '',
    busqueda: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/informaciones', { credentials: 'include' });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/informaciones/${editingId}`
        : '/api/informaciones';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (res.ok) {
        await loadData();
        handleCloseModal();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al guardar información');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar información');
    }
  };

  const handleEdit = (informacion: Informacion) => {
    setEditingId(informacion.id);
    setFormData({
      titulo: informacion.titulo,
      descripcion: informacion.descripcion,
      clasificacion: informacion.clasificacion,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta información?')) return;

    try {
      const res = await fetch(`/api/informaciones/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Error al eliminar información');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar información');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      titulo: '',
      descripcion: '',
      clasificacion: 'INFORMATIVA',
    });
  };

  const informacionesFiltradas = informaciones.filter((info) => {
    if (filtros.clasificacion && info.clasificacion !== filtros.clasificacion) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (
        info.secuencia.toLowerCase().includes(busqueda) ||
        info.titulo.toLowerCase().includes(busqueda) ||
        info.descripcion.toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

  const getClasificacionBadge = (clasificacion: string) => {
    const badges = {
      INFORMATIVA: 'bg-blue-100 text-blue-800',
      ALERTA: 'bg-red-100 text-red-800',
      OTRAS: 'bg-gray-100 text-gray-800',
    };
    return badges[clasificacion as keyof typeof badges] || 'bg-gray-100 text-gray-800';
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Informaciones</h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              placeholder="Buscar por secuencia, título o descripción..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clasificación
            </label>
            <select
              value={filtros.clasificacion}
              onChange={(e) => setFiltros({ ...filtros, clasificacion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todas</option>
              <option value="INFORMATIVA">Informativa</option>
              <option value="ALERTA">Alerta</option>
              <option value="OTRAS">Otras</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nueva Información
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Secuencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Clasificación
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {informacionesFiltradas.map((info) => (
              <tr key={info.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {info.secuencia}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{info.titulo}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-md truncate" title={info.descripcion}>
                    {info.descripcion}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getClasificacionBadge(
                      info.clasificacion
                    )}`}
                  >
                    {getClasificacionTexto(info.clasificacion)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => handleEdit(info)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(info.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {informacionesFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron informaciones
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Información' : 'Nueva Información'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clasificación *
                  </label>
                  <select
                    value={formData.clasificacion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        clasificacion: e.target.value as 'INFORMATIVA' | 'ALERTA' | 'OTRAS',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="INFORMATIVA">Informativa</option>
                    <option value="ALERTA">Alerta</option>
                    <option value="OTRAS">Otras</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
