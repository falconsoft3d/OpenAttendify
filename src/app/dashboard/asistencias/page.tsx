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
  createdAt: string;
  updatedAt: string;
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
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    empleadoId: '',
    empresaId: '',
    fechaInicio: '',
    fechaFin: '',
    busqueda: '',
  });

  // Estados para columnas visibles
  const [columnasVisibles, setColumnasVisibles] = useState({
    empleado: true,
    checkIn: true,
    checkOut: true,
    horas: true,
    empresa: true,
    estadoOdoo: true,
    creado: false,
    editado: false,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar el menú de columnas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowColumnMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnMenu]);

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

  const calcularHorasTrabajadas = (checkIn: string, checkOut: string | null): number => {
    if (!checkOut) return 0;
    const entrada = new Date(checkIn);
    const salida = new Date(checkOut);
    const diff = salida.getTime() - entrada.getTime();
    return Math.max(0, diff / (1000 * 60 * 60)); // Convertir a horas
  };

  const formatearHoras = (horas: number): string => {
    const horasEnteras = Math.floor(horas);
    const minutos = Math.round((horas - horasEnteras) * 60);
    return `${horasEnteras}h ${minutos}m`;
  };

  // Función para filtrar asistencias
  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    // Filtro por empleado
    if (filtros.empleadoId && asistencia.empleado.id !== filtros.empleadoId) {
      return false;
    }
    
    // Filtro por empresa
    if (filtros.empresaId && asistencia.empleado.empresa.id !== filtros.empresaId) {
      return false;
    }
    
    // Filtro por fecha inicio
    if (filtros.fechaInicio) {
      const fechaAsistencia = new Date(asistencia.checkIn);
      const fechaInicioFiltro = new Date(filtros.fechaInicio);
      if (fechaAsistencia < fechaInicioFiltro) {
        return false;
      }
    }
    
    // Filtro por fecha fin
    if (filtros.fechaFin) {
      const fechaAsistencia = new Date(asistencia.checkIn);
      const fechaFinFiltro = new Date(filtros.fechaFin);
      fechaFinFiltro.setHours(23, 59, 59, 999); // Incluir todo el día
      if (fechaAsistencia > fechaFinFiltro) {
        return false;
      }
    }
    
    // Filtro por búsqueda de texto (nombre, apellido, DNI)
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase();
      const nombreCompleto = `${asistencia.empleado.nombre} ${asistencia.empleado.apellido}`.toLowerCase();
      const dni = asistencia.empleado.dni.toLowerCase();
      if (!nombreCompleto.includes(busquedaLower) && !dni.includes(busquedaLower)) {
        return false;
      }
    }
    
    return true;
  });

  // Función para exportar a Excel
  const exportarAExcel = () => {
    const datos = asistenciasFiltradas.map((asistencia) => {
      const horasTrabajadas = calcularHorasTrabajadas(asistencia.checkIn, asistencia.checkOut);
      return {
        'Empleado': `${asistencia.empleado.nombre} ${asistencia.empleado.apellido}`,
        'DNI': asistencia.empleado.dni,
        'Empresa': asistencia.empleado.empresa.nombre,
        'Check In': formatDateTime(asistencia.checkIn),
        'Check Out': asistencia.checkOut ? formatDateTime(asistencia.checkOut) : '-',
        'Horas Trabajadas': asistencia.checkOut ? formatearHoras(horasTrabajadas) : '-',
        'Observaciones': asistencia.observaciones || '-',
      };
    });

    // Crear CSV
    const headers = Object.keys(datos[0] || {});
    const csvContent = [
      headers.join(','),
      ...datos.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtener empresas únicas de los empleados
  const empresasUnicas = Array.from(new Set(empleados.map(e => e.empresa.id)))
    .map(id => empleados.find(e => e.empresa.id === id)?.empresa)
    .filter(Boolean) as { id: string; nombre: string }[];

  const limpiarFiltros = () => {
    setFiltros({
      empleadoId: '',
      empresaId: '',
      fechaInicio: '',
      fechaFin: '',
      busqueda: '',
    });
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
        <div className="flex gap-3">
          {/* Botón de Columnas */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="bg-gray-600 text-white hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Columnas
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Mostrar Columnas</div>
                  {[
                    { key: 'empleado', label: 'Empleado' },
                    { key: 'checkIn', label: 'Entrada' },
                    { key: 'checkOut', label: 'Salida' },
                    { key: 'horas', label: 'Horas' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'estadoOdoo', label: 'Estado Odoo' },
                    { key: 'creado', label: 'Creado' },
                    { key: 'editado', label: 'Última Edición' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={columnasVisibles[col.key as keyof typeof columnasVisibles]}
                        onChange={(e) => setColumnasVisibles({
                          ...columnasVisibles,
                          [col.key]: e.target.checked
                        })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportarAExcel}
            disabled={asistenciasFiltradas.length === 0}
            className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-lg font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Excel
          </button>
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
      </div>

      {/* Filtros */}
      {empleados.length > 0 && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Búsqueda
              </label>
              <input
                type="text"
                placeholder="Nombre o DNI..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.busqueda}
                onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.empleadoId}
                onChange={(e) => setFiltros({ ...filtros, empleadoId: e.target.value })}
              >
                <option value="">Todos los empleados</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} {empleado.apellido}
                  </option>
                ))}
              </select>
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
                {empresasUnicas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Mostrando <span className="font-semibold text-gray-900">{asistenciasFiltradas.length}</span> de{' '}
            <span className="font-semibold text-gray-900">{asistencias.length}</span> asistencias
          </div>
        </div>
      )}

      {empleados.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Primero crea empleados</h3>
          <p className="text-gray-600">Necesitas tener empleados registrados para crear asistencias</p>
        </div>
      ) : asistenciasFiltradas.length === 0 ? (
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
                {columnasVisibles.empleado && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                )}
                {columnasVisibles.checkIn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada
                  </th>
                )}
                {columnasVisibles.checkOut && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salida
                  </th>
                )}
                {columnasVisibles.horas && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horas
                  </th>
                )}
                {columnasVisibles.empresa && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                )}
                {columnasVisibles.estadoOdoo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Odoo
                  </th>
                )}
                {columnasVisibles.creado && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creado
                  </th>
                )}
                {columnasVisibles.editado && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Edición
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {asistenciasFiltradas.map((asistencia) => {
                const horasTrabajadas = calcularHorasTrabajadas(asistencia.checkIn, asistencia.checkOut);
                
                return (
                <tr key={asistencia.id} className={asistencia.odooError ? "hover:bg-red-50 bg-red-50" : "hover:bg-gray-50"}>
                  {columnasVisibles.empleado && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {asistencia.empleado.nombre} {asistencia.empleado.apellido}
                      </div>
                      <div className="text-sm text-gray-500">{asistencia.empleado.dni}</div>
                    </td>
                  )}
                  {columnasVisibles.checkIn && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(asistencia.checkIn)}
                    </td>
                  )}
                  {columnasVisibles.checkOut && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asistencia.checkOut ? formatDateTime(asistencia.checkOut) : '-'}
                    </td>
                  )}
                  {columnasVisibles.horas && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {asistencia.checkOut ? formatearHoras(horasTrabajadas) : '-'}
                    </td>
                  )}
                  {columnasVisibles.empresa && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asistencia.empleado.empresa.nombre}
                    </td>
                  )}
                  {columnasVisibles.estadoOdoo && (
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
                  )}
                  {columnasVisibles.creado && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">{formatDateTime(asistencia.createdAt)}</div>
                    </td>
                  )}
                  {columnasVisibles.editado && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="text-xs">
                        {asistencia.createdAt !== asistencia.updatedAt 
                          ? formatDateTime(asistencia.updatedAt)
                          : '-'
                        }
                      </div>
                    </td>
                  )}
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
              );
              })}
              <tr className="bg-gray-100 font-bold">
                <td className="px-6 py-4 text-sm text-gray-900" colSpan={3}>
                  TOTAL HORAS
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                  {formatearHoras(
                    asistenciasFiltradas.reduce((total, asistencia) => 
                      total + calcularHorasTrabajadas(asistencia.checkIn, asistencia.checkOut), 0
                    )
                  )}
                </td>
                <td colSpan={3}></td>
              </tr>
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
                  Entrada *
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
                  Salida
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

              {/* Información de Auditoría */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Auditoría</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creado el:</span>
                    <span className="font-medium text-gray-900">{formatDateTime(selectedAsistencia.createdAt)}</span>
                  </div>
                  {selectedAsistencia.createdAt !== selectedAsistencia.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última modificación:</span>
                      <span className="font-medium text-gray-900">{formatDateTime(selectedAsistencia.updatedAt)}</span>
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
