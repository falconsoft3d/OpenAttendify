'use client';

import { useState, useEffect } from 'react';

interface Configuracion {
  id: string;
  usarProyectosAsistencia: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TipoDocumentacion {
  id: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ConfiguracionPage() {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null);
  const [tiposDocumentacion, setTiposDocumentacion] = useState<TipoDocumentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [showModalTipo, setShowModalTipo] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoDocumentacion | null>(null);
  const [formDataTipo, setFormDataTipo] = useState({ nombre: '', activo: true });

  useEffect(() => {
    cargarConfiguracion();
    cargarTiposDocumentacion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await fetch('/api/configuracion', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTiposDocumentacion = async () => {
    try {
      const response = await fetch('/api/tipos-documentacion', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTiposDocumentacion(data);
      }
    } catch (error) {
      console.error('Error cargando tipos de documentación:', error);
    }
  };

  const handleToggleProyectos = async (value: boolean) => {
    setGuardando(true);
    try {
      const response = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          usarProyectosAsistencia: value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfiguracion(data);
      } else {
        alert('Error al actualizar configuración');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const handleSubmitTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const url = editingTipo
        ? `/api/tipos-documentacion/${editingTipo.id}`
        : '/api/tipos-documentacion';
      
      const response = await fetch(url, {
        method: editingTipo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formDataTipo),
      });

      if (response.ok) {
        await cargarTiposDocumentacion();
        setShowModalTipo(false);
        setEditingTipo(null);
        setFormDataTipo({ nombre: '', activo: true });
        alert(editingTipo ? 'Tipo actualizado correctamente' : 'Tipo creado correctamente');
      } else {
        alert('Error al guardar tipo de documentación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar tipo de documentación');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditTipo = (tipo: TipoDocumentacion) => {
    setEditingTipo(tipo);
    setFormDataTipo({ nombre: tipo.nombre, activo: tipo.activo });
    setShowModalTipo(true);
  };

  const handleDeleteTipo = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este tipo de documentación?')) return;

    try {
      const response = await fetch(`/api/tipos-documentacion/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await cargarTiposDocumentacion();
        alert('Tipo eliminado correctamente');
      } else {
        alert('Error al eliminar tipo de documentación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar tipo de documentación');
    }
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
        <h1 className="text-3xl font-bold mb-2 text-black">Configuración</h1>
        <p className="text-gray-600">Personaliza las opciones del sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Sección de Asistencias */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Asistencias</h2>
            <div className="space-y-4">
              {/* Toggle para proyectos */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    Usar proyectos en asistencia
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Permite que los empleados seleccionen un proyecto al registrar su asistencia
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() =>
                      handleToggleProyectos(!configuracion?.usarProyectosAsistencia)
                    }
                    className={`${
                      configuracion?.usarProyectosAsistencia
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span
                      className={`${
                        configuracion?.usarProyectosAsistencia
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>

              {configuracion?.usarProyectosAsistencia && (
                <div className="ml-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Con esta opción activada, los empleados deberán seleccionar un proyecto
                        al registrar su entrada o salida. Asegúrate de tener proyectos creados
                        en el sistema.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p>
                <strong>Nota:</strong> Los cambios en la configuración se aplican inmediatamente
                y afectan a todos los empleados del sistema.
              </p>
            </div>
          </div>

          {/* Sección de Tipos de Documentación */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tipos de Documentación</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configura los tipos de documentos que pueden adjuntarse a los empleados
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTipo(null);
                  setFormDataTipo({ nombre: '', activo: true });
                  setShowModalTipo(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Agregar Tipo
              </button>
            </div>

            {tiposDocumentacion.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay tipos de documentación configurados
              </div>
            ) : (
              <div className="space-y-2">
                {tiposDocumentacion.map((tipo) => (
                  <div
                    key={tipo.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{tipo.nombre}</h3>
                        <p className="text-xs text-gray-500">
                          {tipo.activo ? (
                            <span className="text-green-600">Activo</span>
                          ) : (
                            <span className="text-gray-400">Inactivo</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTipo(tipo)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTipo(tipo.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar tipo de documentación */}
      {showModalTipo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTipo ? 'Editar Tipo de Documentación' : 'Nuevo Tipo de Documentación'}
            </h2>
            <form onSubmit={handleSubmitTipo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Tipo *
                </label>
                <input
                  type="text"
                  value={formDataTipo.nombre}
                  onChange={(e) =>
                    setFormDataTipo({ ...formDataTipo, nombre: e.target.value })
                  }
                  placeholder="Ej: DNI, Certificado de Nacimiento, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formDataTipo.activo}
                    onChange={(e) =>
                      setFormDataTipo({ ...formDataTipo, activo: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModalTipo(false);
                    setEditingTipo(null);
                    setFormDataTipo({ nombre: '', activo: true });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
