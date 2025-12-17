'use client';

import { useState, useEffect } from 'react';

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  empresa: {
    id: string;
    nombre: string;
  };
}

interface Solicitud {
  id: string;
  secuencia: string;
  empleado: Empleado;
  fecha: string;
  texto: string;
  valor: number;
  estado: 'SOLICITADO' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  updatedAt: string;
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    empleadoId: '',
    fecha: new Date().toISOString().split('T')[0],
    texto: '',
    valor: 0,
    estado: 'SOLICITADO' as 'SOLICITADO' | 'APROBADO' | 'RECHAZADO',
  });

  const [filtros, setFiltros] = useState({
    empleadoId: '',
    estado: '',
    busqueda: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [solicitudesRes, empleadosRes] = await Promise.all([
        fetch('/api/solicitudes', { credentials: 'include' }),
        fetch('/api/empleados', { credentials: 'include' }),
      ]);

      if (solicitudesRes.ok) {
        const data = await solicitudesRes.json();
        setSolicitudes(data.solicitudes);
      }

      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json();
        setEmpleados(empleadosData.filter((e: Empleado) => e.id));
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/solicitudes/${editingId}`
        : '/api/solicitudes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId: formData.empleadoId,
          fecha: formData.fecha,
          texto: formData.texto,
          valor: parseFloat(formData.valor.toString()),
          estado: formData.estado,
        }),
        credentials: 'include',
      });

      if (res.ok) {
        await loadData();
        handleCloseModal();
      } else {
        const error = await res.json();
        console.error('Error del servidor:', error);
        const errorMsg = error.details 
          ? error.details.map((d: any) => `${d.campo}: ${d.mensaje}`).join('\n')
          : error.error || 'Error al guardar solicitud';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar solicitud');
    }
  };

  const handleEdit = (solicitud: Solicitud) => {
    setEditingId(solicitud.id);
    setFormData({
      empleadoId: solicitud.empleado.id,
      fecha: new Date(solicitud.fecha).toISOString().split('T')[0],
      texto: solicitud.texto,
      valor: Number(solicitud.valor),
      estado: solicitud.estado,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta solicitud?')) return;

    try {
      const res = await fetch(`/api/solicitudes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        await loadData();
      } else {
        alert('Error al eliminar solicitud');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar solicitud');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      empleadoId: '',
      fecha: new Date().toISOString().split('T')[0],
      texto: '',
      valor: 0,
      estado: 'SOLICITADO',
    });
  };

  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    if (filtros.empleadoId && solicitud.empleado.id !== filtros.empleadoId) return false;
    if (filtros.estado && solicitud.estado !== filtros.estado) return false;
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      return (
        solicitud.secuencia.toLowerCase().includes(busqueda) ||
        solicitud.texto.toLowerCase().includes(busqueda) ||
        solicitud.empleado.nombre.toLowerCase().includes(busqueda) ||
        solicitud.empleado.apellido?.toLowerCase().includes(busqueda)
      );
    }
    return true;
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      SOLICITADO: 'bg-yellow-100 text-yellow-800',
      APROBADO: 'bg-green-100 text-green-800',
      RECHAZADO: 'bg-red-100 text-red-800',
    };
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (estado: string) => {
    const textos = {
      SOLICITADO: 'Solicitado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
    };
    return textos[estado as keyof typeof textos] || estado;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
        <p className="text-gray-600">Gestión de solicitudes de empleados</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empleado
            </label>
            <select
              value={filtros.empleadoId}
              onChange={(e) => setFiltros({ ...filtros, empleadoId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre} {empleado.apellido} ({empleado.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="SOLICITADO">Solicitado</option>
              <option value="APROBADO">Aprobado</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nueva Solicitud
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
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {solicitudesFiltradas.map((solicitud) => (
              <tr key={solicitud.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {solicitud.secuencia}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">
                      {solicitud.empleado.nombre} {solicitud.empleado.apellido}
                    </div>
                    <div className="text-xs text-gray-500">{solicitud.empleado.codigo}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(solicitud.fecha).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={solicitud.texto}>
                    {solicitud.texto}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${Number(solicitud.valor).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(
                      solicitud.estado
                    )}`}
                  >
                    {getEstadoTexto(solicitud.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => handleEdit(solicitud)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(solicitud.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {solicitudesFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No se encontraron solicitudes
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Solicitud' : 'Nueva Solicitud'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empleado *
                  </label>
                  <select
                    value={formData.empleadoId}
                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    disabled={!!editingId}
                  >
                    <option value="">Seleccionar empleado</option>
                    {empleados.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.nombre} {empleado.apellido} ({empleado.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={formData.texto}
                    onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estado: e.target.value as 'SOLICITADO' | 'APROBADO' | 'RECHAZADO',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="SOLICITADO">Solicitado</option>
                    <option value="APROBADO">Aprobado</option>
                    <option value="RECHAZADO">Rechazado</option>
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
