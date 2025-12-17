'use client';

import { useState, useEffect } from 'react';

interface Empresa {
  id: string;
  nombre: string;
}

interface Empleado {
  id: string;
  codigo: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  sueldo: number | null;
  costoHora: number | null;
  activo: boolean;
  avatarUrl?: string | null;
  empresa: Empresa;
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
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
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    cargo: '',
    sueldo: 0,
    costoHora: 0,
    empresaId: '',
    password: '' as string | undefined,
    avatarUrl: '' as string | undefined,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordGenerated, setPasswordGenerated] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Función para obtener el siguiente código de empleado
  const obtenerSiguienteCodigo = async (empresaId: string) => {
    try {
      const response = await fetch(`/api/empleados/next-codigo?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        return data.codigo;
      }
      return '';
    } catch (error) {
      console.error('Error obteniendo siguiente código:', error);
      return '';
    }
  };

  // Función para abrir modal de nuevo empleado
  const abrirModalNuevoEmpleado = async () => {
    // Si hay empresas, obtener el código para la primera empresa
    if (empresas.length > 0) {
      const codigo = await obtenerSiguienteCodigo(empresas[0].id);
      setFormData({
        codigo,
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        cargo: '',
        sueldo: 0,
        costoHora: 0,
        empresaId: empresas[0].id,
        password: '',
        avatarUrl: '',
      });
    }
    setEditingId(null);
    setPasswordGenerated(false);
    setShowPassword(false);
    setAvatarPreview(null);
    setShowModal(true);
  };

  // Función para generar contraseña aleatoria
  const generatePassword = () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    setPasswordGenerated(true);
    setShowPassword(true);
  };

  // Función para copiar contraseña al portapapeles
  const copyToClipboard = async () => {
    if (formData.password) {
      try {
        await navigator.clipboard.writeText(formData.password);
        alert('Contraseña copiada al portapapeles');
      } catch (err) {
        console.error('Error al copiar:', err);
      }
    }
  };

  // Función para copiar código de empleado
  const copyEmpleadoCodigo = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      alert('Código copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const loadData = async () => {
    try {
      const [empleadosRes, empresasRes] = await Promise.all([
        fetch('/api/empleados'),
        fetch('/api/empresas'),
      ]);

      if (empleadosRes.ok) {
        const empleadosData = await empleadosRes.json();
        setEmpleados(empleadosData);
      }

      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones del lado del cliente
    if (formData.nombre.length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }
    
    if (formData.apellido.length < 2) {
      alert('El apellido debe tener al menos 2 caracteres');
      return;
    }
    
    if (formData.dni.length < 8) {
      alert('El DNI debe tener al menos 8 caracteres');
      return;
    }
    
    if (!editingId && (!formData.password || formData.password.length < 6)) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('El email no es válido');
      return;
    }
    
    if (!formData.empresaId) {
      alert('Debe seleccionar una empresa');
      return;
    }
    
    try {
      const url = editingId ? `/api/empleados/${editingId}` : '/api/empleados';
      const method = editingId ? 'PUT' : 'POST';
      
      // Si estamos editando y el password está vacío, no lo enviamos
      const dataToSend = { ...formData };
      if (editingId && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      // Si avatarUrl está vacío, enviarlo como string vacío (el schema lo acepta)
      if (!dataToSend.avatarUrl) {
        dataToSend.avatarUrl = '';
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          codigo: '',
          nombre: '',
          apellido: '',
          dni: '',
          email: '',
          telefono: '',
          cargo: '',
          sueldo: 0,
          costoHora: 0,
          empresaId: '',
          password: '',
          avatarUrl: '',
        });
        setPasswordGenerated(false);
        setShowPassword(false);
        setAvatarPreview(null);
        loadData();
      } else {
        const error = await response.json();
        // Mostrar detalles del error de validación
        if (error.details && error.details.length > 0) {
          const errores = error.details.map((d: any) => `${d.campo}: ${d.mensaje}`).join('\n');
          alert(`${error.error}\n\n${errores}`);
        } else {
          alert(error.error || 'Error al guardar empleado');
        }
      }
    } catch (error) {
      console.error('Error guardando empleado:', error);
      alert('Error al guardar empleado');
    }
  };

  const handleEdit = (empleado: Empleado) => {
    setEditingId(empleado.id);
    setFormData({
      codigo: empleado.codigo,
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      dni: empleado.dni,
      email: empleado.email || '',
      telefono: empleado.telefono || '',
      cargo: empleado.cargo || '',
      sueldo: empleado.sueldo || 0,
      costoHora: empleado.costoHora || 0,
      empresaId: empleado.empresa.id,
      password: '', // No cargar la contraseña existente
      avatarUrl: empleado.avatarUrl || '',
    });
    setAvatarPreview(empleado.avatarUrl || null);
    setPasswordGenerated(false);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarPreview(base64);
        setFormData({ ...formData, avatarUrl: base64 } as any);
        setUploadingAvatar(false);
      };

      reader.onerror = () => {
        alert('Error al leer el archivo');
        setUploadingAvatar(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la imagen');
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData({ ...formData, avatarUrl: '' } as any);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;

    try {
      const response = await fetch(`/api/empleados/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error eliminando empleado:', error);
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const response = await fetch(`/api/empleados/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error actualizando empleado:', error);
    }
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      empresaId: '',
      activo: 'todos',
    });
    setCurrentPage(1);
  };

  // Función para filtrar empleados
  const empleadosFiltrados = empleados.filter((empleado) => {
    // Filtro por búsqueda (nombre, apellido, DNI, email, código)
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toLowerCase();
      const dni = empleado.dni.toLowerCase();
      const email = (empleado.email || '').toLowerCase();
      const codigo = empleado.codigo.toLowerCase();
      
      if (!nombreCompleto.includes(busquedaLower) && 
          !dni.includes(busquedaLower) && 
          !email.includes(busquedaLower) &&
          !codigo.includes(busquedaLower)) {
        return false;
      }
    }
    
    // Filtro por empresa
    if (filtros.empresaId && empleado.empresa.id !== filtros.empresaId) {
      return false;
    }
    
    // Filtro por estado activo
    if (filtros.activo === 'activos' && !empleado.activo) {
      return false;
    }
    if (filtros.activo === 'inactivos' && empleado.activo) {
      return false;
    }
    
    return true;
  });

  // Calcular empleados para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmpleados = empleadosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(empleadosFiltrados.length / itemsPerPage);

  // Función para cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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
          <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
          <p className="mt-2 text-gray-600">Gestiona los empleados registrados</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/empleado/login"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-blue-600 px-6 py-3 rounded-lg font-semibold flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Portal Empleado
          </a>
          <button
            onClick={abrirModalNuevoEmpleado}
            disabled={empresas.length === 0}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Filtros */}
      {empresas.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
            <button
              onClick={limpiarFiltros}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpiar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <input
                type="text"
                placeholder="Nombre, DNI, Email o Código..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.empresaId}
                onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
              >
                <option value="">Todas las empresas</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.activo}
                onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {empleadosFiltrados.length} de {empleados.length} empleados
          </div>
        </div>
      )}

      {empresas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Primero crea una empresa</h3>
          <p className="text-gray-600">Necesitas tener al menos una empresa para crear empleados</p>
        </div>
      ) : empleados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay empleados registrados</h3>
          <p className="text-gray-600 mb-4">Comienza agregando tu primer empleado</p>
          <button
            onClick={abrirModalNuevoEmpleado}
            className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-2 rounded-lg font-semibold"
          >
            Crear Empleado
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avatar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
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
              {currentEmpleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {empleado.avatarUrl ? (
                      <img
                        src={empleado.avatarUrl}
                        alt={`${empleado.nombre} ${empleado.apellido}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => copyEmpleadoCodigo(empleado.codigo)}
                      className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Clic para copiar"
                    >
                      {empleado.codigo}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {empleado.nombre} {empleado.apellido}
                    </div>
                    {empleado.email && (
                      <div className="text-sm text-gray-500">{empleado.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empleado.dni}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empleado.cargo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empleado.empresa.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActivo(empleado.id, empleado.activo)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        empleado.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {empleado.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(empleado)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(empleado.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, empleadosFiltrados.length)}
                    </span>{' '}
                    de <span className="font-medium">{empleadosFiltrados.length}</span> empleados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setFormData({
                    codigo: '',
                    nombre: '',
                    apellido: '',
                    dni: '',
                    email: '',
                    telefono: '',
                    cargo: '',
                    sueldo: 0,
                    costoHora: 0,
                    empresaId: '',
                    password: '',
                    avatarUrl: '',
                  });
                  setPasswordGenerated(false);
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto de Perfil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de Perfil
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      {uploadingAvatar ? 'Subiendo...' : avatarPreview ? 'Cambiar Foto' : 'Subir Foto'}
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo 5MB. JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Empleado *
                </label>
                <input
                  type="text"
                  required
                  readOnly={!editingId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-gray-50 font-mono"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Se generará automáticamente"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {editingId 
                    ? "Código único para acceso al portal móvil" 
                    : "Código generado automáticamente según la empresa"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sueldo</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.sueldo}
                  onChange={(e) => setFormData({ ...formData, sueldo: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Hora</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.costoHora}
                  onChange={(e) => setFormData({ ...formData, costoHora: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {!editingId && '*'}
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white pr-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingId ? 'Dejar vacío para no cambiar' : 'Contraseña del empleado'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-1 whitespace-nowrap"
                      title="Generar contraseña automáticamente"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Generar</span>
                    </button>
                  </div>
                  {passwordGenerated && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">Contraseña generada</p>
                          <p className="text-xs text-green-700 mt-1">
                            Asegúrate de copiar y compartir esta contraseña con el empleado. No podrás verla después.
                          </p>
                          <button
                            type="button"
                            onClick={copyToClipboard}
                            className="mt-2 text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded font-medium flex items-center space-x-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copiar Contraseña</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {editingId && (
                    <p className="text-xs text-gray-500">
                      💡 Deja el campo vacío si no deseas cambiar la contraseña actual
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empresa *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={formData.empresaId}
                  onChange={async (e) => {
                    const nuevaEmpresaId = e.target.value;
                    // Si no estamos editando y hay una empresa seleccionada, obtener el nuevo código
                    if (!editingId && nuevaEmpresaId) {
                      const codigo = await obtenerSiguienteCodigo(nuevaEmpresaId);
                      setFormData({ ...formData, empresaId: nuevaEmpresaId, codigo });
                    } else {
                      setFormData({ ...formData, empresaId: nuevaEmpresaId });
                    }
                  }}
                >
                  <option value="">Selecciona una empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
