'use client';

import { useEffect, useState } from 'react';

interface TipoDocumentacion {
  id: string;
  nombre: string;
}

interface Documentacion {
  id: string;
  nombreArchivo: string;
  mimeType: string;
  fechaVencimiento: string;
  createdAt: string;
  tipoDocumentacion: TipoDocumentacion | null;
  tipoDocumentacionId: string | null;
}

interface TipoRequerido {
  id: string;
  nombre: string;
  tiene: boolean;
  cantidadDocumentos: number;
  documentoActual: {
    id: string;
    fechaVencimiento: string;
  } | null;
}

export default function EmpleadoDocumentacionPage() {
  const [documentaciones, setDocumentaciones] = useState<Documentacion[]>([]);
  const [tiposRequeridos, setTiposRequeridos] = useState<TipoRequerido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    tipoDocumentacionId: '',
    fechaVencimiento: '',
  });
  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    fetchDocumentaciones();
    fetchTiposRequeridos();
  }, []);

  const fetchDocumentaciones = async () => {
    try {
      const response = await fetch('/api/empleado/documentaciones', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocumentaciones(data);
      }
    } catch (error) {
      console.error('Error al cargar documentaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposRequeridos = async () => {
    try {
      const response = await fetch('/api/empleado/tipos-documentacion', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTiposRequeridos(data);
      }
    } catch (error) {
      console.error('Error al cargar tipos requeridos:', error);
    }
  };

  const isVencido = (fecha: string) => {
    return new Date(fecha) < new Date();
  };

  const diasParaVencer = (fecha: string) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diff = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getEstadoBadge = (fecha: string) => {
    const vencido = isVencido(fecha);
    const dias = diasParaVencer(fecha);
    const porVencer = dias > 0 && dias <= 30;

    if (vencido) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          VENCIDO
        </span>
      );
    } else if (porVencer) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Vence en {dias} días
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Vigente
        </span>
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Verificar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        return;
      }
      setArchivo(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remover el prefijo "data:...;base64,"
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivo) {
      alert('Por favor seleccione un archivo');
      return;
    }

    setLoadingSubmit(true);

    try {
      // Convertir archivo a base64
      const base64Data = await convertToBase64(archivo);

      const response = await fetch('/api/empleado/documentaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombreArchivo: archivo.name,
          archivoBase64: base64Data,
          mimeType: archivo.type,
          fechaVencimiento: formData.fechaVencimiento,
          tipoDocumentacionId: formData.tipoDocumentacionId || undefined,
        }),
      });

      if (response.ok) {
        await fetchDocumentaciones();
        await fetchTiposRequeridos();
        setShowModal(false);
        setFormData({ tipoDocumentacionId: '', fechaVencimiento: '' });
        setArchivo(null);
        alert('Documento cargado correctamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al cargar documento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar documento');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mi Documentación</h1>
            <p className="text-blue-100">Revisa el estado de tus documentos y verifica qué documentación debes entregar</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-semibold shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Subir Documento</span>
          </button>
        </div>

        {/* Alerta si hay documentos vencidos */}
        {documentaciones.some(doc => isVencido(doc.fechaVencimiento)) && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Tienes documentos vencidos. Por favor, contacta a tu supervisor para renovarlos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alerta si hay documentos por vencer */}
        {documentaciones.some(doc => {
          const dias = diasParaVencer(doc.fechaVencimiento);
          return dias > 0 && dias <= 30;
        }) && !documentaciones.some(doc => isVencido(doc.fechaVencimiento)) && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Tienes documentos próximos a vencer. Prepáralos para renovación.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sección: Mis Documentos */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documentos Actuales
            </h2>

            {documentaciones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No tienes documentos registrados</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {documentaciones.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{doc.nombreArchivo}</p>
                        {doc.tipoDocumentacion && (
                          <span className="text-xs text-blue-600 font-medium">
                            {doc.tipoDocumentacion.nombre}
                          </span>
                        )}
                      </div>
                      {getEstadoBadge(doc.fechaVencimiento)}
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Vence: {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}</p>
                      <p>Cargado: {new Date(doc.createdAt).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Documentación Requerida */}
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Documentación Requerida
            </h2>

            {tiposRequeridos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No hay documentación configurada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tiposRequeridos.map((tipo) => (
                  <div
                    key={tipo.id}
                    className={`border-2 rounded-lg p-4 ${
                      tipo.tiene
                        ? tipo.documentoActual && isVencido(tipo.documentoActual.fechaVencimiento)
                          ? 'border-red-200 bg-red-50'
                          : tipo.documentoActual && diasParaVencer(tipo.documentoActual.fechaVencimiento) <= 30
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {tipo.tiene ? (
                          tipo.documentoActual && isVencido(tipo.documentoActual.fechaVencimiento) ? (
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{tipo.nombre}</p>
                          {tipo.tiene && tipo.documentoActual && (
                            <p className="text-xs text-gray-600">
                              {isVencido(tipo.documentoActual.fechaVencimiento) 
                                ? '⚠️ Vencido - Requiere renovación'
                                : diasParaVencer(tipo.documentoActual.fechaVencimiento) <= 30
                                ? `⚠️ Vence en ${diasParaVencer(tipo.documentoActual.fechaVencimiento)} días`
                                : `✓ ${tipo.cantidadDocumentos} documento(s)`
                              }
                            </p>
                          )}
                          {!tipo.tiene && (
                            <p className="text-xs text-red-600">Pendiente de entrega</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Nota:</strong> Si necesitas renovar o entregar documentación, contacta a tu supervisor o área de recursos humanos.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-6 bg-white rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{documentaciones.length}</p>
              <p className="text-xs text-gray-600">Total Documentos</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {documentaciones.filter(doc => !isVencido(doc.fechaVencimiento) && diasParaVencer(doc.fechaVencimiento) > 30).length}
              </p>
              <p className="text-xs text-gray-600">Vigentes</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {documentaciones.filter(doc => {
                  const dias = diasParaVencer(doc.fechaVencimiento);
                  return dias > 0 && dias <= 30;
                }).length}
              </p>
              <p className="text-xs text-gray-600">Por Vencer</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {documentaciones.filter(doc => isVencido(doc.fechaVencimiento)).length}
              </p>
              <p className="text-xs text-gray-600">Vencidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para subir documentación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Subir Documento</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={formData.tipoDocumentacionId}
                  onChange={(e) => setFormData({ ...formData, tipoDocumentacionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  <option value="">Seleccione un tipo (opcional)</option>
                  {tiposRequeridos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo * (Máx. 5MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                  required
                />
                {archivo && (
                  <p className="mt-2 text-sm text-gray-600">
                    Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-800"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ tipoDocumentacionId: '', fechaVencimiento: '' });
                    setArchivo(null);
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
                  {loadingSubmit ? 'Subiendo...' : 'Subir Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
