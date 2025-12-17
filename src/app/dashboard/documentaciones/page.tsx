'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string | null;
}

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
  empleado: Empleado;
  tipoDocumentacion: TipoDocumentacion | null;
  archivoBase64: string;
}

export default function DocumentacionesPage() {
  const router = useRouter();
  const [documentaciones, setDocumentaciones] = useState<Documentacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [tiposDocumentacion, setTiposDocumentacion] = useState<TipoDocumentacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(''); // 'todos', 'vigente', 'por-vencer', 'vencido'
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    empleadoId: '',
    fechaVencimiento: '',
    tipoDocumentacionId: '',
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    fetchDocumentaciones();
    fetchEmpleados();
    fetchTiposDocumentacion();
  }, []);

  const fetchDocumentaciones = async () => {
    try {
      const response = await fetch('/api/documentaciones');
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

  const fetchTiposDocumentacion = async () => {
    try {
      const response = await fetch('/api/tipos-documentacion');
      if (response.ok) {
        const data = await response.json();
        setTiposDocumentacion(data.filter((t: TipoDocumentacion & { activo: boolean }) => t.activo));
      }
    } catch (error) {
      console.error('Error al cargar tipos de documentación:', error);
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

      const response = await fetch('/api/documentaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empleadoId: formData.empleadoId,
          nombreArchivo: archivo.name,
          archivoBase64: base64Data,
          mimeType: archivo.type,
          fechaVencimiento: formData.fechaVencimiento,
          tipoDocumentacionId: formData.tipoDocumentacionId || undefined,
        }),
      });

      if (response.ok) {
        await fetchDocumentaciones();
        setShowModal(false);
        setFormData({ empleadoId: '', fechaVencimiento: '', tipoDocumentacionId: '' });
        setArchivo(null);
        alert('Documentación creada correctamente');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear documentación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear documentación');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta documentación?')) return;

    try {
      const response = await fetch(`/api/documentaciones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDocumentaciones();
        alert('Documentación eliminada correctamente');
      } else {
        alert('Error al eliminar documentación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar documentación');
    }
  };

  const handleDownload = (doc: Documentacion) => {
    // Crear el data URL completo
    const dataUrl = `data:${doc.mimeType};base64,${doc.archivoBase64}`;
    
    // Crear un elemento <a> temporal para la descarga
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = doc.nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredDocumentaciones = documentaciones.filter((doc) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      doc.nombreArchivo.toLowerCase().includes(searchLower) ||
      doc.empleado.nombre.toLowerCase().includes(searchLower) ||
      doc.empleado.codigo.toLowerCase().includes(searchLower);
    
    // Filtro por empleado
    const matchEmpleado = filtroEmpleado === '' || doc.empleado.id === filtroEmpleado;
    
    // Filtro por tipo de documentación
    const matchTipo = filtroTipo === '' || 
      (filtroTipo === 'sin-tipo' && !doc.tipoDocumentacion) ||
      (doc.tipoDocumentacion && doc.tipoDocumentacion.id === filtroTipo);
    
    // Filtro por estado
    let matchEstado = true;
    if (filtroEstado !== '') {
      const vencido = isVencido(doc.fechaVencimiento);
      const dias = diasParaVencer(doc.fechaVencimiento);
      const porVencer = dias > 0 && dias <= 7;
      
      if (filtroEstado === 'vigente') {
        matchEstado = !vencido && !porVencer;
      } else if (filtroEstado === 'por-vencer') {
        matchEstado = porVencer;
      } else if (filtroEstado === 'vencido') {
        matchEstado = vencido;
      }
    }
    
    return matchSearch && matchEmpleado && matchTipo && matchEstado;
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
        <h1 className="text-2xl font-bold text-gray-800">Documentación</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nuevo Documento
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre de archivo, empleado o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Empleado
          </label>
          <select
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los empleados</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.codigo} - {emp.nombre} {emp.apellido || ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Tipo
          </label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="sin-tipo">Sin tipo</option>
            {tiposDocumentacion.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
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
            <option value="vigente">✅ Vigente</option>
            <option value="por-vencer">⚠️ Por vencer (7 días)</option>
            <option value="vencido">❌ Vencido</option>
          </select>
        </div>
      </div>

      {/* Tabla de documentaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empleado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Archivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Vencimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Carga
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDocumentaciones.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No hay documentaciones registradas
                </td>
              </tr>
            ) : (
              filteredDocumentaciones.map((doc) => {
                const vencido = isVencido(doc.fechaVencimiento);
                const dias = diasParaVencer(doc.fechaVencimiento);
                const porVencer = dias > 0 && dias <= 7;

                return (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.empleado.nombre} {doc.empleado.apellido || ''}
                      </div>
                      <div className="text-sm text-gray-500">{doc.empleado.codigo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doc.tipoDocumentacion ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {doc.tipoDocumentacion.nombre}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Sin tipo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doc.nombreArchivo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(doc.fechaVencimiento).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vencido ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Vencido
                        </span>
                      ) : porVencer ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Por vencer ({dias}d)
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Vigente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Descargar
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear documentación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Documentación</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado *
                </label>
                <select
                  value={formData.empleadoId}
                  onChange={(e) => setFormData({ ...formData, empleadoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un empleado</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.codigo} - {emp.nombre} {emp.apellido || ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={formData.tipoDocumentacionId}
                  onChange={(e) => setFormData({ ...formData, tipoDocumentacionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un tipo (opcional)</option>
                  {tiposDocumentacion.map((tipo) => (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ empleadoId: '', fechaVencimiento: '', tipoDocumentacionId: '' });
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
