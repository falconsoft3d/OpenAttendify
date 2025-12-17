'use client';

import { useState, useEffect } from 'react';

interface Empresa {
  id: string;
  nombre: string;
}

interface Proyecto {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  empresa: Empresa;
}

interface Integracion {
  id: string;
  tipo: string;
  activo: boolean;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [importando, setImportando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    empresaId: '',
    activo: 'todos',
  });
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    empresaId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [proyectosRes, empresasRes, integracionesRes] = await Promise.all([
        fetch('/api/proyectos', { credentials: 'include' }),
        fetch('/api/empresas', { credentials: 'include' }),
        fetch('/api/integraciones', { credentials: 'include' }),
      ]);

      if (proyectosRes.ok) {
        const proyectosData = await proyectosRes.json();
        setProyectos(proyectosData);
      }

      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
      }

      if (integracionesRes.ok) {
        const integracionesData = await integracionesRes.json();
        setIntegraciones(integracionesData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.codigo.length < 1) {
      alert('El código es requerido');
      return;
    }
    
    if (formData.nombre.length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }
    
    if (!formData.empresaId) {
      alert('Debe seleccionar una empresa');
      return;
    }
    
    try {
      const url = editingId ? `/api/proyectos/${editingId}` : '/api/proyectos';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (response.ok) {
        setShowModal(false);
        loadData();
        resetForm();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error al guardar el proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el proyecto');
    }
  };

  const handleEdit = (proyecto: Proyecto) => {
    setFormData({
      codigo: proyecto.codigo,
      nombre: proyecto.nombre,
      empresaId: proyecto.empresa.id,
    });
    setEditingId(proyecto.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este proyecto?')) return;

    try {
      const response = await fetch(`/api/proyectos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Error al eliminar el proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el proyecto');
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/proyectos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !activo }),
        credentials: 'include',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Error al actualizar el estado del proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del proyecto');
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      empresaId: empresas.length > 0 ? empresas[0].id : '',
    });
    setEditingId(null);
  };

  const abrirModalNuevoProyecto = () => {
    resetForm();
    setShowModal(true);
  };

  const importarProyectosDesdeOdoo = async () => {
    // Buscar integración de Odoo activa
    const integracionOdoo = integraciones.find(i => i.tipo === 'ODOO' && i.activo);
    
    if (!integracionOdoo) {
      alert('No hay ninguna integración de Odoo activa. Configure Odoo en Integraciones primero.');
      return;
    }

    if (!confirm('¿Desea importar los proyectos desde Odoo? Los proyectos con códigos existentes serán omitidos.')) {
      return;
    }

    setImportando(true);
    
    try {
      const response = await fetch('/api/integraciones/import-projects-odoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ integracionId: integracionOdoo.id }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}\n\nDetalles:\n- Total en Odoo: ${result.count}\n- Importados: ${result.imported}\n- Omitidos: ${result.skipped}`);
        loadData(); // Recargar la lista de proyectos
      } else {
        alert(`❌ Error al importar proyectos:\n${result.error}\n\n${result.details || ''}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al importar proyectos desde Odoo');
    } finally {
      setImportando(false);
    }
  };

  // Filtrar proyectos
  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const matchBusqueda = 
      proyecto.codigo.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      proyecto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    
    const matchEmpresa = !filtros.empresaId || proyecto.empresa.id === filtros.empresaId;
    const matchActivo = filtros.activo === 'todos' || 
                        (filtros.activo === 'true' ? proyecto.activo : !proyecto.activo);
    
    return matchBusqueda && matchEmpresa && matchActivo;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = proyectosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(proyectosFiltrados.length / itemsPerPage);

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
        <h1 className="text-3xl font-bold mb-2 text-black">Proyectos</h1>
        <p className="text-gray-600">Gestiona los proyectos de tus empresas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Código o nombre..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <select
              value={filtros.empresaId}
              onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.activo}
              onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={abrirModalNuevoProyecto}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Nuevo
            </button>
            {integraciones.some(i => i.tipo === 'ODOO' && i.activo) && (
              <button
                onClick={importarProyectosDesdeOdoo}
                disabled={importando}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title="Importar proyectos desde Odoo"
              >
                {importando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Odoo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de proyectos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay proyectos para mostrar
                  </td>
                </tr>
              ) : (
                currentItems.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {proyecto.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{proyecto.nombre}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {proyecto.empresa.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActivo(proyecto.id, proyecto.activo)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          proyecto.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {proyecto.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(proyecto)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(proyecto.id)}
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

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, proyectosFiltrados.length)}
                  </span>{' '}
                  de <span className="font-medium">{proyectosFiltrados.length}</span> proyectos
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa *
                  </label>
                  <select
                    value={formData.empresaId}
                    onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar empresa</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
