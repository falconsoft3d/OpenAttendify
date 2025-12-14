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
  activo: boolean;
  empresa: Empresa;
}

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    cargo: '',
    empresaId: '',
    password: '' as string | undefined,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordGenerated, setPasswordGenerated] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    try {
      const url = editingId ? `/api/empleados/${editingId}` : '/api/empleados';
      const method = editingId ? 'PUT' : 'POST';
      
      // Si estamos editando y el password está vacío, no lo enviamos
      const dataToSend = { ...formData };
      if (editingId && !dataToSend.password) {
        delete dataToSend.password;
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
          empresaId: '',
          password: '',
        });
        setPasswordGenerated(false);
        setShowPassword(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al guardar empleado');
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
      empresaId: empleado.empresa.id,
      password: '', // No cargar la contraseña existente
    });
    setPasswordGenerated(false);
    setShowPassword(false);
    setShowModal(true);
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
        <button
          onClick={() => setShowModal(true)}
          disabled={empresas.length === 0}
          className="bg-primary-600 text-white hover:bg-primary-700 px-6 py-3 rounded-lg font-semibold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Empleado
        </button>
      </div>

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
            onClick={() => setShowModal(true)}
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
                  Empleado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
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
              {empleados.map((empleado) => (
                <tr key={empleado.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {empleado.nombre} {empleado.apellido}
                    </div>
                    {empleado.email && (
                      <div className="text-sm text-gray-500">{empleado.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-semibold text-blue-600">
                      {empleado.codigo}
                    </div>
                    <button
                      onClick={() => copyEmpleadoCodigo(empleado.codigo)}
                      className="text-xs text-gray-500 hover:text-blue-600"
                    >
                      Copiar código
                    </button>
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
                    empresaId: '',
                    password: '',
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Empleado *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white font-mono"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: 10001"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Código único para acceso al portal móvil
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {!editingId && '*'}
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
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
                  onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
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
