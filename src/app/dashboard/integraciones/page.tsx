'use client';

import { useState, useEffect } from 'react';

interface Integracion {
  id: string;
  tipo: string;
  activo: boolean;
  configuracion: any;
}

export default function IntegracionesPage() {
  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOdooModal, setShowOdooModal] = useState(false);
  const [odooConfig, setOdooConfig] = useState({
    url: '',
    puerto: '443',
    database: '',
    usuario: '',
    contrasena: '',
    campoEmpleado: 'email',
    companiaId: '1',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; error?: string; details?: any } | null>(null);
  const [connectionTested, setConnectionTested] = useState(false);
  
  // Estados para API Key
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  // Estado para login externo de empleados
  const [empleadoLoginEnabled, setEmpleadoLoginEnabled] = useState(false);

  useEffect(() => {
    cargarIntegraciones();
    cargarApiKeys();
    cargarConfiguracion();
  }, []);

  const cargarApiKeys = async () => {
    try {
      const res = await fetch('/api/auth/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Error al cargar API Keys:', error);
    }
  };

  const generarApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Por favor ingresa un nombre para la API Key');
      return;
    }

    setGeneratingKey(true);
    try {
      const res = await fetch('/api/auth/generate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newKeyName }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await cargarApiKeys();
        setShowNewKeyModal(false);
        setNewKeyName('');
        alert('API Key generada exitosamente');
      } else {
        console.error('Error del servidor:', data);
        alert(data.error || 'Error al generar API Key');
      }
    } catch (error) {
      console.error('Error al generar API Key:', error);
      alert('Error al generar API Key');
    } finally {
      setGeneratingKey(false);
    }
  };

  const copiarApiKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };
  
  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const eliminarApiKey = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta API Key? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/api-keys/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await cargarApiKeys();
        alert('API Key eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error al eliminar API Key:', error);
      alert('Error al eliminar API Key');
    }
  };

  const toggleApiKey = async (id: string, activa: boolean) => {
    try {
      const res = await fetch(`/api/auth/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !activa }),
      });
      
      if (res.ok) {
        await cargarApiKeys();
      }
    } catch (error) {
      console.error('Error al actualizar API Key:', error);
      alert('Error al actualizar API Key');
    }
  };

  const cargarIntegraciones = async () => {
    try {
      const res = await fetch('/api/integraciones');
      if (res.ok) {
        const data = await res.json();
        setIntegraciones(data);
      }
    } catch (error) {
      console.error('Error al cargar integraciones:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cargarConfiguracion = async () => {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        setEmpleadoLoginEnabled(data.loginEmpleadosExterno);
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    }
  };
  
  const toggleEmpleadoLogin = async () => {
    try {
      const nuevoValor = !empleadoLoginEnabled;
      const res = await fetch('/api/auth/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginEmpleadosExterno: nuevoValor })
      });
      
      if (res.ok) {
        setEmpleadoLoginEnabled(nuevoValor);
      } else {
        const data = await res.json();
        console.error('Error del servidor:', data);
        alert(data.error || 'Error al actualizar configuración');
      }
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      alert('Error al actualizar configuración: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const toggleIntegracion = async (tipo: string, activo: boolean) => {
    if (!activo && tipo === 'ODOO') {
      // Si se está activando Odoo, mostrar modal de configuración
      const existente = integraciones.find(i => i.tipo === 'ODOO');
      if (existente) {
        setEditingId(existente.id);
        setOdooConfig(existente.configuracion);
      }
      setShowOdooModal(true);
      return;
    }

    // Desactivar la integración
    try {
      const integracion = integraciones.find(i => i.tipo === tipo);
      if (!integracion) return;

      const res = await fetch(`/api/integraciones/${integracion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: false }),
      });

      if (res.ok) {
        cargarIntegraciones();
      }
    } catch (error) {
      console.error('Error al actualizar integración:', error);
    }
  };

  const probarConexion = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/integraciones/test-odoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(odooConfig),
      });

      const data = await res.json();
      setTestResult(data);
      
      if (data.success) {
        setConnectionTested(true);
        setTimeout(() => setTestResult(null), 5000);
      } else {
        setConnectionTested(false);
      }
    } catch (error) {
      console.error('Error al probar conexión:', error);
      setTestResult({
        success: false,
        message: 'Error al probar la conexión',
      });
    } finally {
      setTesting(false);
    }
  };

  const guardarOdoo = async () => {
    try {
      const url = editingId 
        ? `/api/integraciones/${editingId}`
        : '/api/integraciones';
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'ODOO',
          activo: true,
          configuracion: odooConfig,
        }),
      });

      if (res.ok) {
        setShowOdooModal(false);
        setEditingId(null);
        setTestResult(null);
        setConnectionTested(false);
        setOdooConfig({
          url: '',
          puerto: '443',
          database: '',
          usuario: '',
          contrasena: '',
          campoEmpleado: 'email',
          companiaId: '1',
        });
        cargarIntegraciones();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error al guardar Odoo:', error);
      alert('Error al guardar configuración');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const odooIntegracion = integraciones.find(i => i.tipo === 'ODOO');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Integraciones</h1>
        <p className="mt-2 text-gray-600">
          Conecta tu sistema con otras plataformas
        </p>
      </div>

      {/* Sección de API Key */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">API Keys para Aplicaciones Externas</h3>
                <p className="text-sm text-gray-500">
                  Gestiona tus claves API para integrar aplicaciones móviles o sistemas externos
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva API Key</span>
              </button>
            </div>
          </div>
          
          {/* Configuración de Login de Empleados Externo */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Permitir login de empleados desde aplicaciones externas
                </h4>
                <p className="text-xs text-gray-600">
                  Cuando está activado, las aplicaciones externas pueden autenticar empleados usando su código y contraseña.
                  Requiere una API Key válida para funcionar.
                </p>
              </div>
              <button
                onClick={toggleEmpleadoLogin}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ml-4 ${
                  empleadoLoginEnabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    empleadoLoginEnabled ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {empleadoLoginEnabled && (
              <div className="mt-3 pt-3 border-t border-blue-300">
                <p className="text-xs font-semibold text-gray-900 mb-2">⚙️ Configuración requerida para los empleados:</p>
                <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Ve a <strong>Dashboard → Empleados</strong></li>
                  <li>Edita cada empleado que necesite acceso desde apps externas</li>
                  <li>Configura una <strong>contraseña</strong> en el campo correspondiente</li>
                  <li>El empleado podrá hacer login usando su <strong>código o DNI + contraseña</strong></li>
                </ol>
                <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  <strong>💡 Nota:</strong> Solo los empleados con contraseña configurada podrán autenticarse desde aplicaciones externas.
                </div>
              </div>
            )}
          </div>

          {apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{key.nombre}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          key.activa 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {key.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          readOnly
                          value={visibleKeys.has(key.id) ? key.key : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                        />
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-1"
                          title={visibleKeys.has(key.id) ? 'Ocultar' : 'Mostrar'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {visibleKeys.has(key.id) ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={() => copiarApiKey(key.key, key.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                        >
                          {copiedKeyId === key.id ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-xs">Copiado</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs">Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Creada: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.ultimoUso && (
                          <span>Último uso: {new Date(key.ultimoUso).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => toggleApiKey(key.id, key.activa)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          key.activa ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            key.activa ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => eliminarApiKey(key.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-3">
                ⚠️ Mantén tus API Keys seguras. No las compartas públicamente ni las incluyas en el código del cliente.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-gray-600 mb-4">No tienes ninguna API Key generada</p>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Primera API Key
              </button>
            </div>
          )}

          {/* Documentación de API */}
          {showApiDocs && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-gray-900">Documentación de la API</h4>
                <a 
                  href="/API_DOCUMENTATION.md" 
                  target="_blank"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  📄 Ver documentación completa
                </a>
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>¿Cómo usar la API?</strong>
                  </p>
                  <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                    <li>Genera una API Key en esta página</li>
                    <li>Activa "Permitir login de empleados desde apps externas" si lo necesitas</li>
                    <li>Incluye el header <code className="bg-blue-100 px-1 rounded">X-API-Key: tu-api-key</code> en todas tus peticiones</li>
                    <li>Consulta la documentación completa para ver todos los endpoints disponibles</li>
                  </ol>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">📍 Endpoints Disponibles</h5>
                  <div className="space-y-4">
                    {/* Login de Empleado */}
                    <div className="border-l-4 border-green-500 pl-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-mono rounded">POST</span>
                        <code className="text-sm font-semibold text-gray-900">/api/auth/external/empleado</code>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">Login de empleado desde aplicación externa (requiere toggle activado)</p>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Headers:</p>
                        <code className="text-xs text-gray-600 block">Content-Type: application/json</code>
                        <code className="text-xs text-gray-600 block">X-API-Key: oatt_tu-api-key</code>
                      </div>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Body (JSON):</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">{`{
  "codigo": "10001",      // Código o DNI
  "password": "miPass123" // Contraseña del empleado
}`}</pre>
                      </div>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Respuesta exitosa (200):</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">{`{
  "success": true,
  "token": "eyJhbGci...",
  "empleado": {
    "id": "clx123",
    "codigo": "10001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "empresa": { "id": "...", "nombre": "..." }
  }
}`}</pre>
                      </div>
                      
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">Ver ejemplos de código</summary>
                        <div className="mt-2 space-y-2">
                          <div className="bg-gray-900 text-gray-100 rounded p-2">
                            <p className="text-xs font-semibold mb-1 text-green-400">cURL:</p>
                            <pre className="text-xs overflow-x-auto">{`curl -X POST http://localhost:3000/api/auth/external/empleado \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: oatt_tu-api-key" \\
  -d '{"codigo":"10001","password":"miPass123"}'`}</pre>
                          </div>
                          
                          <div className="bg-gray-900 text-gray-100 rounded p-2">
                            <p className="text-xs font-semibold mb-1 text-yellow-400">JavaScript:</p>
                            <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/auth/external/empleado', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    codigo: '10001',
    password: 'miPass123'
  })
});
const data = await response.json();
if (data.success) {
  console.log('Token:', data.token);
  console.log('Empleado:', data.empleado);
}`}</pre>
                          </div>
                        </div>
                      </details>
                    </div>
                    
                    {/* Registrar Asistencia */}
                    <div className="border-l-4 border-purple-500 pl-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-mono rounded">POST</span>
                        <code className="text-sm font-semibold text-gray-900">/api/asistencias</code>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">Registrar entrada o salida de empleado</p>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Headers:</p>
                        <code className="text-xs text-gray-600 block">Content-Type: application/json</code>
                        <code className="text-xs text-gray-600 block">X-API-Key: oatt_tu-api-key</code>
                      </div>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Body (JSON):</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto">{`{
  "empleadoId": "clx123abc",
  "tipo": "entrada"  // "entrada" o "salida"
}`}</pre>
                      </div>
                      
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">Ver ejemplo de código</summary>
                        <div className="mt-2 bg-gray-900 text-gray-100 rounded p-2">
                          <p className="text-xs font-semibold mb-1 text-yellow-400">JavaScript:</p>
                          <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/asistencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    empleadoId: data.empleado.id,
    tipo: 'entrada'
  })
});`}</pre>
                        </div>
                      </details>
                    </div>
                    
                    {/* Consultar Asistencias */}
                    <div className="border-l-4 border-blue-500 pl-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">GET</span>
                        <code className="text-sm font-semibold text-gray-900">/api/asistencias?empleadoId=...</code>
                      </div>
                      <p className="text-xs text-gray-700 mb-2">Consultar historial de asistencias</p>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Headers:</p>
                        <code className="text-xs text-gray-600 block">X-API-Key: oatt_tu-api-key</code>
                      </div>
                      
                      <div className="bg-white rounded p-2 mb-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Query Parameters:</p>
                        <code className="text-xs text-gray-600 block">empleadoId (requerido)</code>
                        <code className="text-xs text-gray-600 block">fechaInicio (opcional): YYYY-MM-DD</code>
                        <code className="text-xs text-gray-600 block">fechaFin (opcional): YYYY-MM-DD</code>
                      </div>
                      
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">Ver ejemplo de código</summary>
                        <div className="mt-2 bg-gray-900 text-gray-100 rounded p-2">
                          <p className="text-xs font-semibold mb-1 text-yellow-400">JavaScript:</p>
                          <pre className="text-xs overflow-x-auto">{`const empleadoId = 'clx123abc';
const url = \`/api/asistencias?empleadoId=\${empleadoId}\`;
const response = await fetch(url, {
  headers: { 'X-API-Key': 'oatt_tu-api-key' }
});
const asistencias = await response.json();`}</pre>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Importante:</strong> La documentación completa incluye ejemplos en cURL y JavaScript, 
                    códigos de error, y casos de uso completos. Haz clic en "Ver documentación completa" arriba.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="w-full mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {showApiDocs ? '▲ Ocultar Documentación' : '▼ Ver Documentación de la API'}
          </button>
        </div>
      </div>

      {/* Lista de integraciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {/* Integración Odoo */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                odooIntegracion?.activo && connectionTested
                  ? 'bg-green-100'
                  : 'bg-purple-100'
              }`}>
                <svg
                  className={`w-6 h-6 ${
                    odooIntegracion?.activo && connectionTested
                      ? 'text-green-600'
                      : 'text-purple-600'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Odoo</h3>
                <p className="text-sm text-gray-500">
                  Sistema ERP para gestión empresarial
                </p>
                {odooIntegracion?.activo && (
                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                    <span>URL: {odooIntegracion.configuracion.url}</span>
                    <span>Puerto: {odooIntegracion.configuracion.puerto}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {odooIntegracion?.activo && (
                <>
                  <button
                    onClick={async () => {
                      setOdooConfig(odooIntegracion.configuracion);
                      setTesting(true);
                      setTestResult(null);
                      
                      try {
                        const res = await fetch('/api/integraciones/test-odoo', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(odooIntegracion.configuracion),
                        });

                        const data = await res.json();
                        setTestResult(data);
                        
                        if (data.success) {
                          setConnectionTested(true);
                          setTimeout(() => setTestResult(null), 5000);
                        } else {
                          setConnectionTested(false);
                        }
                      } catch (error) {
                        console.error('Error al probar conexión:', error);
                        setTestResult({
                          success: false,
                          message: 'Error al probar la conexión',
                        });
                      } finally {
                        setTesting(false);
                      }
                    }}
                    disabled={testing}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium disabled:opacity-50"
                  >
                    {testing ? 'Probando...' : 'Probar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(odooIntegracion.id);
                      setOdooConfig(odooIntegracion.configuracion);
                      setConnectionTested(false);
                      setShowOdooModal(true);
                    }}
                    className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                  >
                    Configurar
                  </button>
                </>
              )}
              <button
                onClick={() => toggleIntegracion('ODOO', odooIntegracion?.activo || false)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  odooIntegracion?.activo
                    ? 'bg-primary-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    odooIntegracion?.activo
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación de resultado de prueba */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {testResult.success ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </h3>
              {testResult.details && (
                <div className="mt-2 text-sm text-green-700">
                  <p>Versión: {testResult.details.version}</p>
                  <p>Usuario: {testResult.details.userName} (ID: {testResult.details.userId})</p>
                  <p>Compañía ID: {testResult.details.companyId}</p>
                </div>
              )}
              {!testResult.success && testResult.error && (
                <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="ml-3 flex-shrink-0"
            >
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal de configuración Odoo */}
      {showOdooModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Configurar Odoo
              </h2>
              <button
                onClick={() => {
                  setShowOdooModal(false);
                  setEditingId(null);
                  setTestResult(null);
                  setOdooConfig({
                    url: '',
                    puerto: '443',
                    database: '',
                    usuario: '',
                    contrasena: '',
                    campoEmpleado: 'email',
                    companiaId: '1',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.url}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, url: e.target.value })
                  }
                  placeholder="https://tu-odoo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puerto *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.puerto}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, puerto: e.target.value })
                  }
                  placeholder="443"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base de Datos *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.database}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, database: e.target.value })
                  }
                  placeholder="odoo"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nombre de la base de datos de Odoo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.usuario}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, usuario: e.target.value })
                  }
                  placeholder="admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.contrasena}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, contrasena: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campo de búsqueda empleado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.campoEmpleado}
                  onChange={(e) =>
                    setOdooConfig({
                      ...odooConfig,
                      campoEmpleado: e.target.value,
                    })
                  }
                >
                  <option value="email">Email</option>
                  <option value="dni">DNI</option>
                  <option value="codigo">Código</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Campo usado para buscar empleados en Odoo
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de Compañía *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                  value={odooConfig.companiaId}
                  onChange={(e) =>
                    setOdooConfig({ ...odooConfig, companiaId: e.target.value })
                  }
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ID de la compañía en Odoo donde se registrarán las asistencias
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={probarConexion}
                disabled={testing || !odooConfig.url || !odooConfig.database || !odooConfig.usuario || !odooConfig.contrasena}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {testing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Probando conexión...
                  </>
                ) : (
                  '🔌 Probar Conexión'
                )}
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowOdooModal(false);
                    setEditingId(null);
                    setTestResult(null);
                    setOdooConfig({
                      url: '',
                      puerto: '443',
                      database: '',
                      usuario: '',
                      contrasena: '',
                      campoEmpleado: 'email',
                      companiaId: '1',
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarOdoo}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Nueva API Key */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Crear Nueva API Key
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre / Descripción *
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ej: App Móvil iOS, Sistema de fichaje..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={50}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Un nombre descriptivo para identificar dónde se usa esta key
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowNewKeyModal(false);
                    setNewKeyName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={generarApiKey}
                  disabled={generatingKey || !newKeyName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingKey ? 'Generando...' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
