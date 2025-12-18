'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
}

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string | null;
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
  empleado: Empleado | null;
}

export default function TareasPage() {
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'BORRADOR' as 'BORRADOR' | 'ASIGNADA' | 'TRABAJANDO' | 'COMPLETADO',
    fechaInicio: '',
    fechaFin: '',
    proyectoId: '',
    empleadoId: '',
  });
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    fetchTareas();
    fetchProyectos();
    fetchEmpleados();
  }, []);

  const fetchTareas = async () => {
    try {
      const response = await fetch('/api/tareas');
      if (response.ok) {
        const data = await response.json();
        setTareas(data);
      }
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProyectos = async () => {
    try {
      const response = await fetch('/api/proyectos');
      if (response.ok) {
        const data = await response.json();
        setProyectos(data);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const response = await fetch('/api/empleados');
      if (response.ok) {
        const data = await response.json();
        setEmpleados(data);
      }
    } catch (error) {
      console.error('Error al cargar empleados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);

    try {
      const url = editingTarea ? `/api/tareas/${editingTarea.id}` : '/api/tareas';
      const method = editingTarea ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTareas();
        setShowModal(false);
        setEditingTarea(null);
        setFormData({
          nombre: '',
          descripcion: '',
          fecha: new Date().toISOString().split('T')[0],
          estado: 'BORRADOR',
          fechaInicio: '',
          fechaFin: '',
          proyectoId: '',
          empleadoId: '',
        });
        alert(editingTarea ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar tarea');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleEdit = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setFormData({
      nombre: tarea.nombre,
      descripcion: tarea.descripcion || '',
      fecha: tarea.fecha.split('T')[0],
      estado: tarea.estado,
      fechaInicio: tarea.fechaInicio ? new Date(tarea.fechaInicio).toISOString().slice(0, 16) : '',
      fechaFin: tarea.fechaFin ? new Date(tarea.fechaFin).toISOString().slice(0, 16) : '',
      proyectoId: tarea.proyecto.id,
      empleadoId: tarea.empleado?.id || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      const response = await fetch(`/api/tareas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTareas();
        alert('Tarea eliminada correctamente');
      } else {
        alert('Error al eliminar tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar tarea');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      BORRADOR: 'bg-gray-100 text-gray-800',
      TRABAJANDO: 'bg-blue-100 text-blue-800',
      COMPLETADO: 'bg-green-100 text-green-800',
    };
    return badges[estado as keyof typeof badges] || badges.BORRADOR;
  };

  const filteredTareas = tareas.filter((tarea) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      tarea.secuencia.toLowerCase().includes(searchLower) ||
      tarea.nombre.toLowerCase().includes(searchLower) ||
      tarea.proyecto.nombre.toLowerCase().includes(searchLower);
    
    const matchProyecto = filtroProyecto === '' || tarea.proyecto.id === filtroProyecto;
    const matchEstado = filtroEstado === '' || tarea.estado === filtroEstado;
    
    return matchSearch && matchProyecto && matchEstado;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tareas</h1>
        <button
          onClick={() => {
            setEditingTarea(null);
            setFormData({
              nombre: '',
              descripcion: '',
              fecha: new Date().toISOString().split('T')[0],
              estado: 'BORRADOR',
              fechaInicio: '',
              fechaFin: '',
              proyectoId: '',
              empleadoId: '',
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nueva Tarea
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por secuencia, nombre o proyecto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Proyecto
          </label>
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los proyectos</option>
            {proyectos.map((proyecto) => (
              <option key={proyecto.id} value={proyecto.id}>
                {proyecto.codigo} - {proyecto.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ASIGNADA">Asignada</option>
            <option value="TRABAJANDO">Trabajando</option>
            <option value="COMPLETADO">Completado</option>
          </select>
        </div>
      </div>

      {/* Tabla de tareas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Secuencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyecto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Horas
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTareas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No hay tareas registradas
                </td>
              </tr>
            ) : (
              filteredTareas.map((tarea) => (
                <tr key={tarea.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tarea.secuencia}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{tarea.nombre}</div>
                    {tarea.descripcion && (
                      <div className="text-sm text-gray-500 line-clamp-2">{tarea.descripcion}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tarea.proyecto.codigo}</div>
                    <div className="text-sm text-gray-500">{tarea.proyecto.nombre}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tarea.empleado ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {tarea.empleado.nombre} {tarea.empleado.apellido || ''}
                        </div>
                        <div className="text-sm text-gray-500">{tarea.empleado.codigo}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(tarea.estado)}`}>
                      {tarea.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tarea.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tarea.totalHoras ? `${tarea.totalHoras.toFixed(2)}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(tarea)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(tarea.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar tarea */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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

                <div className="md:col-span-2">
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
                    Empleado
                  </label>
                  <select
                    value={formData.empleadoId}
                    onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {empleados.map((empleado) => (
                      <option key={empleado.id} value={empleado.id}>
                        {empleado.codigo} - {empleado.nombre} {empleado.apellido || ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="ASIGNADA">Asignada</option>
                    <option value="TRABAJANDO">Trabajando</option>
                    <option value="COMPLETADO">Completado</option>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTarea(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={loadingSubmit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
