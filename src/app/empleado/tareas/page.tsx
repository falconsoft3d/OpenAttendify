'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
}

interface Asistencia {
  id: string;
  checkIn: string;
  checkOut: string | null;
  proyecto?: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
}

interface Tarea {
  id: string;
  secuencia: string;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  estado: 'BORRADOR' | 'ASIGNADA' | 'TRABAJANDO' | 'COMPLETADO';
  fechaInicio: string | null;
  fechaFin: string | null;
  totalHoras: number | null;
  proyecto: Proyecto;
}

export default function TareasEmpleado() {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [asistenciaActiva, setAsistenciaActiva] = useState<Asistencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTES');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    proyectoId: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const cargarTareas = async () => {
    try {
      const response = await fetch('/api/empleado/tareas');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/empleado/login');
          return;
        }
        throw new Error('Error al cargar tareas');
      }
      const data = await response.json();
      console.log('📋 Tareas recibidas:', data);
      setTareas(data.tareas || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const cargarProyectos = async () => {
    try {
      const response = await fetch('/api/empleado/proyectos');
      if (response.ok) {
        const data = await response.json();
        setProyectos(data.proyectos || []);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const cargarAsistenciaActiva = async () => {
    try {
      const response = await fetch('/api/empleado/asistencia?tipo=activa');
      if (response.ok) {
        const data = await response.json();
        setAsistenciaActiva(data.asistencia);
        
        // Si hay proyecto en la asistencia activa, pre-seleccionarlo
        if (data.asistencia?.proyecto?.id) {
          setFormData(prev => ({
            ...prev,
            proyectoId: data.asistencia.proyecto.id,
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar asistencia:', error);
    }
  };

  useEffect(() => {
    cargarTareas();
    cargarProyectos();
    cargarAsistenciaActiva();
  }, []);

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (procesando) return;

    setProcesando('crear');
    try {
      const response = await fetch('/api/empleado/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear tarea');
      }

      toast.success('Tarea creada correctamente');
      setShowCrearModal(false);
      setFormData({
        nombre: '',
        descripcion: '',
        proyectoId: '',
        fecha: new Date().toISOString().split('T')[0],
      });
      await cargarTareas();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear la tarea');
    } finally {
      setProcesando(null);
    }
  };

  const actualizarTarea = async (tareaId: string, accion: 'iniciar' | 'detener' | 'finalizar') => {
    if (procesando) return;
    
    const confirmMessages = {
      iniciar: '¿Deseas iniciar esta tarea?',
      detener: '¿Deseas pausar esta tarea?',
      finalizar: '¿Deseas marcar esta tarea como completada?',
    };

    // Usar toast.promise para confirmar la acción
    const confirmar = () => {
      return new Promise((resolve, reject) => {
        const toastId = toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <p className="font-medium">{confirmMessages[accion]}</p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    reject(new Error('Cancelado'));
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Confirmar
                </button>
              </div>
            </div>
          ),
          {
            duration: Infinity,
          }
        );
      });
    };

    try {
      await confirmar();
    } catch {
      return; // Usuario canceló
    }

    setProcesando(tareaId);
    try {
      const response = await fetch('/api/empleado/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tareaId, accion }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar tarea');
      }

      const data = await response.json();
      toast.success(data.mensaje || 'Tarea actualizada correctamente');
      await cargarTareas();
      setTareaSeleccionada(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la tarea');
    } finally {
      setProcesando(null);
    }
  };

  const tareasFiltradas = filtroEstado === 'PENDIENTES'
    ? tareas.filter((t) => t.estado !== 'COMPLETADO')
    : filtroEstado
    ? tareas.filter((t) => t.estado === filtroEstado)
    : tareas;

  const obtenerBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'BORRADOR':
        return 'bg-gray-100 text-gray-800';
      case 'ASIGNADA':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRABAJANDO':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETADO':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatearHoras = (horas: number | null) => {
    if (!horas) return '-';
    const horasNum = typeof horas === 'number' ? horas : parseFloat(horas.toString());
    return `${horasNum.toFixed(2)}h`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center text-gray-600">Cargando tareas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Toaster position="top-center" />
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Mis Tareas Asignadas</h1>
          <button
            onClick={() => setShowCrearModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>

        {/* Filtro por estado */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDIENTES">Pendientes (sin completar)</option>
            <option value="BORRADOR">Solo borradores</option>
            <option value="TRABAJANDO">En progreso</option>
            <option value="COMPLETADO">Completadas</option>
            <option value="">Todas</option>
          </select>
        </div>

        {/* Lista de tareas */}
        {tareasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filtroEstado ? 'No tienes tareas con este estado' : 'No tienes tareas asignadas'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tareasFiltradas.map((tarea) => (
              <div
                key={tarea.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-gray-500">{tarea.secuencia}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${obtenerBadgeEstado(tarea.estado)}`}>
                        {tarea.estado === 'BORRADOR' ? 'Borrador' : 
                         tarea.estado === 'ASIGNADA' ? 'Asignada' :
                         tarea.estado === 'TRABAJANDO' ? 'En Progreso' : 'Completada'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{tarea.nombre}</h3>
                    {tarea.descripcion && (
                      <p className="text-sm text-gray-600 mb-2">{tarea.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <span>{tarea.proyecto.codigo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatearFecha(tarea.fecha)}</span>
                      </div>
                      {tarea.totalHoras !== null && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatearHoras(tarea.totalHoras)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(tarea.estado === 'BORRADOR' || tarea.estado === 'ASIGNADA') && (
                    <button
                      onClick={() => actualizarTarea(tarea.id, 'iniciar')}
                      disabled={procesando === tarea.id}
                      className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {procesando === tarea.id ? 'Procesando...' : '▶ Iniciar'}
                    </button>
                  )}

                  {tarea.estado === 'TRABAJANDO' && (
                    <>
                      <button
                        onClick={() => actualizarTarea(tarea.id, 'finalizar')}
                        disabled={procesando === tarea.id}
                        className="flex-1 min-w-[120px] px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {procesando === tarea.id ? 'Procesando...' : '✓ Finalizar'}
                      </button>
                    </>
                  )}

                  {tarea.estado === 'COMPLETADO' && (
                    <div className="flex-1 px-4 py-2 bg-green-50 text-green-800 rounded-lg text-center font-medium">
                      ✓ Completada
                    </div>
                  )}

                  <button
                    onClick={() => setTareaSeleccionada(tarea)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear tarea */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nueva Tarea</h2>
              <button
                onClick={() => setShowCrearModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={crearTarea} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyecto *
                </label>
                <select
                  value={formData.proyectoId}
                  onChange={(e) => setFormData({ ...formData, proyectoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un proyecto</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.codigo} - {proyecto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCrearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando === 'crear'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {procesando === 'crear' ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {tareaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles de la Tarea</h2>
              <button
                onClick={() => setTareaSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Secuencia</label>
                <p className="text-lg font-mono text-gray-900">{tareaSeleccionada.secuencia}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Nombre</label>
                <p className="text-lg text-gray-900">{tareaSeleccionada.nombre}</p>
              </div>

              {tareaSeleccionada.descripcion && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Descripción</label>
                  <p className="text-gray-900">{tareaSeleccionada.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Proyecto</label>
                  <p className="text-gray-900">{tareaSeleccionada.proyecto.nombre}</p>
                  <p className="text-sm text-gray-500">{tareaSeleccionada.proyecto.codigo}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <p>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${obtenerBadgeEstado(tareaSeleccionada.estado)}`}>
                      {tareaSeleccionada.estado === 'BORRADOR' ? 'Borrador' : 
                       tareaSeleccionada.estado === 'ASIGNADA' ? 'Asignada' :
                       tareaSeleccionada.estado === 'TRABAJANDO' ? 'En Progreso' : 'Completada'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha</label>
                  <p className="text-gray-900">{formatearFecha(tareaSeleccionada.fecha)}</p>
                </div>

                {tareaSeleccionada.totalHoras !== null && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total de Horas</label>
                    <p className="text-gray-900 font-semibold">{formatearHoras(tareaSeleccionada.totalHoras)}</p>
                  </div>
                )}
              </div>

              {tareaSeleccionada.fechaInicio && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Inicio</label>
                  <p className="text-gray-900">
                    {new Date(tareaSeleccionada.fechaInicio).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {tareaSeleccionada.fechaFin && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Finalización</label>
                  <p className="text-gray-900">
                    {new Date(tareaSeleccionada.fechaFin).toLocaleString('es-ES')}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setTareaSeleccionada(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
