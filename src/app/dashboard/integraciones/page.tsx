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
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    cargarIntegraciones();
  }, []);

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

      {/* Sección de Documentación de API para Empleados */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">API Portal de Empleados</h3>
                <p className="text-sm text-gray-500">
                  Endpoints para que los empleados registren y consulten sus asistencias
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="w-full px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
          >
            {showApiDocs ? '▲ Ocultar Documentación' : '▼ Ver Documentación de API'}
          </button>

          {showApiDocs && (
            <div className="mt-6 space-y-6">
              {/* Introducción */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🔐 Autenticación</h4>
                <p className="text-sm text-gray-700 mb-2">
                  El portal de empleados utiliza <strong>autenticación basada en cookies con JWT</strong>. 
                  No se requiere API Key externa.
                </p>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>El empleado hace login con su código y contraseña</li>
                  <li>El servidor retorna una cookie HttpOnly con el token JWT</li>
                  <li>Todas las peticiones usan automáticamente esta cookie</li>
                  <li>El token expira después de 7 días</li>
                </ol>
              </div>

              {/* Base URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">🌐 Base URL</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-600">Desarrollo:</span>
                    <code className="block mt-1 px-3 py-2 bg-gray-900 text-green-400 rounded text-xs">
                      http://localhost:3000
                    </code>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">Producción:</span>
                    <code className="block mt-1 px-3 py-2 bg-gray-900 text-green-400 rounded text-xs">
                      https://tu-dominio.com
                    </code>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">📡 Endpoints Disponibles</h4>
                
                {/* Login */}
                <div className="mb-6 border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-mono rounded">POST</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/login</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Autentica al empleado y establece una sesión mediante cookie
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver detalles y ejemplo
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Body (JSON):</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">{`{
  "codigo": "10001",
  "password": "miPass123"
}`}</pre>
                      </div>
                      
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Respuesta exitosa (200):</p>
                        <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">{`{
  "success": true,
  "empleado": {
    "id": "clx123abc",
    "codigo": "10001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "cargo": "Desarrollador",
    "empresa": "Mi Empresa"
  }
}`}</pre>
                      </div>
                      
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <p className="text-xs font-semibold mb-2 text-yellow-400">Ejemplo JavaScript:</p>
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    codigo: '10001',
    password: 'miPass123'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Login exitoso:', data.empleado);
}`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Información del Empleado */}
                <div className="mb-6 border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">GET</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/me</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Obtiene la información actualizada del empleado autenticado
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/me', {
  credentials: 'include'
});

const data = await response.json();
console.log('Empleado:', data.empleado);`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Registrar Entrada */}
                <div className="mb-6 border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-mono rounded">POST</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/asistencia</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Registra la entrada (check-in) del empleado
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div className="bg-white rounded p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">
                          ⚠️ No requiere body. Solo se puede tener una asistencia activa a la vez.
                        </p>
                      </div>
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/asistencia', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();
console.log(data.message); // "Entrada registrada exitosamente"
console.log('Hora:', new Date(data.asistencia.checkIn));`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Registrar Salida */}
                <div className="mb-6 border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-mono rounded">PATCH</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/asistencia</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Registra la salida (check-out) del empleado
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/asistencia', {
  method: 'PATCH',
  credentials: 'include'
});

const data = await response.json();
console.log(data.message); // "Salida registrada exitosamente"`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Consultar Asistencia Activa */}
                <div className="mb-6 border-l-4 border-yellow-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">GET</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/asistencia?tipo=activa</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Verifica si el empleado tiene una asistencia activa
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch(
  '/api/empleado/asistencia?tipo=activa', 
  { credentials: 'include' }
);

const data = await response.json();
if (data.asistencia) {
  console.log('Asistencia activa desde:', 
    new Date(data.asistencia.checkIn));
}`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Consultar Historial */}
                <div className="mb-6 border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono rounded">GET</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/asistencia</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Obtiene el historial de asistencias (últimas 20)
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/asistencia', {
  credentials: 'include'
});

const data = await response.json();
console.log('Historial:', data.asistencias);

// Calcular horas trabajadas
data.asistencias.forEach(asist => {
  if (asist.checkOut) {
    const horas = (new Date(asist.checkOut) - 
                   new Date(asist.checkIn)) / 3600000;
    console.log(\`Horas: \${horas.toFixed(2)}\`);
  }
});`}</pre>
                      </div>
                    </div>
                  </details>
                </div>

                {/* Cerrar Sesión */}
                <div className="mb-6 border-l-4 border-red-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-mono rounded">POST</span>
                    <code className="text-sm font-semibold text-gray-900">/api/empleado/logout</code>
                  </div>
                  <p className="text-xs text-gray-700 mb-3">
                    Cierra la sesión del empleado
                  </p>
                  
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700 font-medium">
                      Ver ejemplo
                    </summary>
                    <div className="mt-3">
                      <div className="bg-gray-900 text-gray-100 rounded p-3">
                        <pre className="text-xs overflow-x-auto">{`const response = await fetch('/api/empleado/logout', {
  method: 'POST',
  credentials: 'include'
});

const data = await response.json();
console.log(data.message);
window.location.href = '/empleado/login';`}</pre>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Ejemplo de Flujo Completo */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">🚀 Flujo Completo de Ejemplo</h4>
                <details>
                  <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-700 font-medium">
                    Ver código completo
                  </summary>
                  <div className="mt-3 bg-gray-900 text-gray-100 rounded p-3">
                    <pre className="text-xs overflow-x-auto">{`// 1. Login
const login = await fetch('/api/empleado/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ codigo: '10001', password: 'miPass123' })
});
const loginData = await login.json();
console.log('✅ Login:', loginData.empleado.nombre);

// 2. Verificar estado
const estado = await fetch('/api/empleado/asistencia?tipo=activa', {
  credentials: 'include'
});
const estadoData = await estado.json();

if (estadoData.asistencia) {
  // Ya tiene entrada, registrar salida
  const salida = await fetch('/api/empleado/asistencia', {
    method: 'PATCH',
    credentials: 'include'
  });
  const salidaData = await salida.json();
  console.log('🚪 Salida registrada');
} else {
  // Registrar entrada
  const entrada = await fetch('/api/empleado/asistencia', {
    method: 'POST',
    credentials: 'include'
  });
  const entradaData = await entrada.json();
  console.log('🚪 Entrada registrada');
}

// 3. Ver historial
const historial = await fetch('/api/empleado/asistencia', {
  credentials: 'include'
});
const historialData = await historial.json();
console.log('📅 Historial:', historialData.asistencias.length, 'registros');`}</pre>
                  </div>
                </details>
              </div>

              {/* Notas importantes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Notas Importantes</h4>
                <ul className="text-xs text-gray-700 space-y-2 list-disc list-inside">
                  <li><strong>Cookies HttpOnly:</strong> Las cookies se gestionan automáticamente por el navegador</li>
                  <li><strong>credentials: 'include':</strong> Siempre incluir este parámetro en todas las peticiones</li>
                  <li><strong>Contraseñas:</strong> Los empleados deben tener contraseña configurada por el administrador</li>
                  <li><strong>Una asistencia activa:</strong> Solo puede haber un check-in sin check-out a la vez</li>
                  <li><strong>Token expira:</strong> Después de 7 días el empleado debe volver a hacer login</li>
                  <li><strong>Sincronización Odoo:</strong> Si está configurada, las asistencias se sincronizan automáticamente</li>
                </ul>
              </div>

              {/* Códigos de error */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">❌ Códigos de Error</h4>
                <div className="text-xs text-gray-700 space-y-1">
                  <div><span className="font-mono font-semibold">400:</span> Petición inválida o acción no permitida</div>
                  <div><span className="font-mono font-semibold">401:</span> No autenticado o token inválido</div>
                  <div><span className="font-mono font-semibold">404:</span> Empleado no encontrado</div>
                  <div><span className="font-mono font-semibold">500:</span> Error interno del servidor</div>
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}
