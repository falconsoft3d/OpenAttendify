'use client';

import { useState, useEffect } from 'react';

interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  empresa: {
    id: string;
    nombre: string;
  };
}

interface Asistencia {
  id: string;
  checkIn: string;
  checkOut: string | null;
  empleado: Empleado;
  tipoRegistro: string;
  observaciones: string | null;
  odooAttendanceId: number | null;
  odooError: string | null;
}

export default function AsistenciasPage() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsistencia, setSelectedAsistencia] = useState<Asistencia | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    empleadoId: '',
    checkIn: '',
    checkOut: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [asistenciasRes, empleadosRes] = await Promise.all([
        fetch('/api/asistencias'),
        fetch('/api/empleados'),
      ]);

      if (asistenciasRes.ok) {
        const asistenciasData = await asistenciasRes.json();
        setAsistencias(asistenciasData);
      }

      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json();
        setEmpleados(empleadosData.filter((e: Empleado) => e));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/asistencias/${editingId}` : '/api/asistencias';
      const method = editingId ? 'PUT' : 'POST';

      // Convertir datetime-local a ISO string
      const data = {
        empleadoId: formData.empleadoId,
        checkIn: new Date(formData.checkIn).toISOString(),
        checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : '',
        observaciones: formData.observaciones,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          empleadoId: '',
          checkIn: '',
          checkOut: '',
          observaciones: '',
        });
        loadData();
      } else {
        const error = await response.json();
        console.error('Error del servidor:', error);
        alert(error.error || 'Error al guardar la asistencia');
      }
    } catch (error) {
      console.error('Error guardando asistencia:', error);
      alert('Error al guardar la asistencia');
    }
  };

  const handleEdit = (asistencia: Asistencia) => {
    setEditingId(asistencia.id);
    setFormData({
      empleadoId: asistencia.empleado.id,
      checkIn: formatDateTimeLocal(asistencia.checkIn),
      checkOut: asistencia.checkOut ? formatDateTimeLocal(asistencia.checkOut) : '',
      observaciones: asistencia.observaciones || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta asistencia?')) return;

    try {
      const response = await fetch(`/api/asistencias/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error eliminando asistencia:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (asistencia: Asistencia) => {
    setSelectedAsistencia(asistencia);
    setShowDetailModal(true);
  };

  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asistencias</h1>
          <p className="mt-2 text-gray-600">Registra y gestiona las asistencias</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={empleados.length === 0}
          className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Registrar Asistencia
        </button>
      </div>

      {empleados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Primero crea empleados</h3>
          <p className="text-gray-600">Necesitas tener empleados registrados para crear asistencias</p>
        </div>
      ) : asistencias.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay asistencias registradas</h3>
          <p className="text-gray-600 mb-4">Comienza registrando la primera asistencia</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-lg font-semibold"
          >
            Registrar Asistencia
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Odoo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asistencias.map((asistencia) => (
                <tr key={asistencia.id} className={asistencia.odooError ? "hover:bg-red-50 bg-red-50" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {asistencia.empleado.nombre} {asistencia.empleado.apellido}
                    </div>
                    <div className="text-sm text-gray-500">{asistencia.empleado.dni}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(asistencia.checkIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asistencia.checkOut ? formatDateTime(asistencia.checkOut) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asistencia.empleado.empresa.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {asistencia.odooError ? (
                      <div className="flex items-center text-red-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium cursor-help" title={asistencia.odooError}>
                          Error de sync
                        </span>
                      </div>
                    ) : asistencia.odooAttendanceId ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          Sincronizado
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleViewDetails(asistencia)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(asistencia)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(asistencia.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Asistencia' : 'Registrar Asistencia'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.empleadoId}
                  onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                >
                  <option value="">Selecciona un empleado</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.nombre} {empleado.apellido} - {empleado.empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check In *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Out
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-semibold"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedAsistencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles de Asistencia
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAsistencia(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Información del Empleado */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Empleado</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-medium text-gray-900">
                      {selectedAsistencia.empleado.nombre} {selectedAsistencia.empleado.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DNI:</span>
                    <span className="font-medium text-gray-900">{selectedAsistencia.empleado.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Empresa:</span>
                    <span className="font-medium text-gray-900">{selectedAsistencia.empleado.empresa.nombre}</span>
                  </div>
                </div>
              </div>

              {/* Información de Asistencia */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Asistencia</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entrada:</span>
                    <span className="font-medium text-gray-900">{formatDateTime(selectedAsistencia.checkIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salida:</span>
                    <span className="font-medium text-gray-900">
                      {selectedAsistencia.checkOut ? formatDateTime(selectedAsistencia.checkOut) : 'En curso'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo de Registro:</span>
                    <span className="font-medium text-gray-900">{selectedAsistencia.tipoRegistro}</span>
                  </div>
                  {selectedAsistencia.observaciones && (
                    <div className="flex flex-col">
                      <span className="text-gray-600 mb-1">Observaciones:</span>
                      <span className="font-medium text-gray-900 bg-gray-50 p-2 rounded">
                        {selectedAsistencia.observaciones}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado de Sincronización con Odoo */}
              <div className="pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Sincronización con Odoo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado:</span>
                    {selectedAsistencia.odooError ? (
                      <div className="flex items-center text-red-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Error de Sincronización</span>
                      </div>
                    ) : selectedAsistencia.odooAttendanceId ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Sincronizado Correctamente</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-medium">Sin integración</span>
                    )}
                  </div>

                  {selectedAsistencia.odooAttendanceId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID en Odoo:</span>
                      <span className="font-mono font-medium text-gray-900 bg-green-50 px-2 py-1 rounded">
                        #{selectedAsistencia.odooAttendanceId}
                      </span>
                    </div>
                  )}

                  {selectedAsistencia.odooError && (
                    <div className="mt-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-800 mb-1">Detalle del Error:</h4>
                            <p className="text-sm text-red-700 whitespace-pre-wrap break-words">
                              {selectedAsistencia.odooError}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p><strong>Posibles soluciones:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Verifica las credenciales de la integración de Odoo</li>
                          <li>Confirma que el empleado existe en Odoo con el mismo email/DNI/código</li>
                          <li>Revisa que la URL y puerto de Odoo sean correctos</li>
                          <li>Asegúrate de que la integración esté activa</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedAsistencia(null);
                }}
                className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
