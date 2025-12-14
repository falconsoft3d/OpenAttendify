import { prisma } from './prisma';

interface OdooConfig {
  url: string;
  puerto: string;
  database: string;
  usuario: string;
  contrasena: string;
  campoEmpleado: 'email' | 'dni' | 'codigo';
  companiaId: string;
}

interface OdooAuthResult {
  uid: number;
  sessionId: string;
}

/**
 * Autenticar en Odoo y obtener el UID usando JSON-RPC
 */
async function authenticateOdoo(config: OdooConfig): Promise<OdooAuthResult | null> {
  try {
    const odooUrl = `${config.url}:${config.puerto}`;
    
    const response = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'authenticate',
          args: [config.database, config.usuario, config.contrasena, {}],
        },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('❌ Error al autenticar en Odoo:', response.status);
      throw new Error(`No se pudo conectar a Odoo (HTTP ${response.status}). Verifica URL y puerto.`);
    }

    const data = await response.json();

    if (data.error || !data.result) {
      console.error('❌ Credenciales inválidas en Odoo:', data.error);
      throw new Error('Credenciales inválidas. Verifica usuario, contraseña y base de datos.');
    }

    console.log('✅ Autenticado en Odoo, UID:', data.result);

    return {
      uid: data.result,
      sessionId: '', // No necesitamos session_id para JSON-RPC
    };
  } catch (error) {
    console.error('❌ Error de conexión con Odoo:', error);
    return null;
  }
}

/**
 * Buscar un empleado en Odoo por el campo configurado
 */
async function buscarEmpleadoEnOdoo(
  config: OdooConfig,
  auth: OdooAuthResult,
  empleado: { email: string | null; dni: string; codigo: string }
): Promise<number | null> {
  try {
    const odooUrl = `${config.url}:${config.puerto}`;
    
    // Determinar el valor de búsqueda según el campo configurado
    let searchValue: string;
    let searchField: string;

    if (config.campoEmpleado === 'email') {
      searchValue = empleado.email || '';
      searchField = 'work_email'; // Campo estándar de Odoo para email
    } else if (config.campoEmpleado === 'dni') {
      searchValue = empleado.dni;
      searchField = 'identification_id'; // Campo estándar de Odoo para DNI
    } else { // codigo
      searchValue = empleado.codigo;
      searchField = 'x_employee_code'; // Campo personalizado (puede variar)
    }

    if (!searchValue) {
      console.error(`❌ El empleado no tiene ${config.campoEmpleado} configurado`);
      throw new Error(`El empleado no tiene ${config.campoEmpleado} configurado en OpenAttendify.`);
    }

    console.log(`🔍 Buscando empleado en Odoo:`, {
      campo: searchField,
      valor: searchValue,
      companiaId: config.companiaId
    });

    // Buscar empleado en Odoo usando JSON-RPC
    const response = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            auth.uid,
            config.contrasena,
            'hr.employee',
            'search_read',
            [
              [
                [searchField, '=', searchValue],
                ['company_id', '=', parseInt(config.companiaId)],
                ['active', '=', true],
              ],
            ],
            { fields: ['id', 'name', searchField, 'company_id'], limit: 1 },
          ],
        },
        id: 2,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('❌ Error al buscar empleado en Odoo:', response.status);
      throw new Error(`Error al buscar empleado en Odoo (HTTP ${response.status})`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error de Odoo al buscar empleado:', data.error);
      throw new Error(`Error de Odoo: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.result || data.result.length === 0) {
      console.log(`⚠️ Empleado no encontrado en Odoo con ${config.campoEmpleado}: ${searchValue}`);
      console.log(`⚠️ Filtros aplicados:`, {
        [searchField]: searchValue,
        company_id: parseInt(config.companiaId),
        active: true
      });
      throw new Error(`Empleado no encontrado en Odoo. Busca por ${config.campoEmpleado}=${searchValue} en compañía ${config.companiaId}. Verifica que el empleado esté registrado y activo en Odoo.`);
    }

    console.log(`✅ Empleado encontrado en Odoo:`, data.result[0]);
    return data.result[0].id;
  } catch (error) {
    console.error('❌ Error al buscar empleado en Odoo:', error);
    return null;
  }
}

/**
 * Registrar asistencia (check-in) en Odoo
 */
async function registrarCheckInOdoo(
  config: OdooConfig,
  auth: OdooAuthResult,
  empleadoOdooId: number,
  fecha: Date
): Promise<number | null> {
  try {
    const odooUrl = `${config.url}:${config.puerto}`;
    
    // Formatear fecha en formato Odoo: YYYY-MM-DD HH:MM:SS
    const formatoOdoo = fecha.toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');
    
    const response = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            auth.uid,
            config.contrasena,
            'hr.attendance',
            'create',
            [
              {
                employee_id: empleadoOdooId,
                check_in: formatoOdoo,
              },
            ],
          ],
        },
        id: 3,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error('❌ Error al registrar check-in en Odoo:', response.status);
      throw new Error(`Error al registrar entrada en Odoo (HTTP ${response.status})`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error de Odoo al registrar check-in:', data.error);
      throw new Error(`Error de Odoo al registrar entrada: ${data.error.data?.message || data.error.message || JSON.stringify(data.error)}`);
    }

    console.log(`✅ Check-in registrado en Odoo (ID: ${data.result})`);
    return data.result;
  } catch (error) {
    console.error('❌ Error al registrar check-in en Odoo:', error);
    return null;
  }
}

/**
 * Registrar salida (check-out) en Odoo
 */
async function registrarCheckOutOdoo(
  config: OdooConfig,
  auth: OdooAuthResult,
  empleadoOdooId: number,
  fecha: Date
): Promise<boolean> {
  try {
    const odooUrl = `${config.url}:${config.puerto}`;
    
    // Buscar la asistencia activa del empleado (sin check-out)
    const searchResponse = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            auth.uid,
            config.contrasena,
            'hr.attendance',
            'search_read',
            [
              [
                ['employee_id', '=', empleadoOdooId],
                ['check_out', '=', false],
              ],
            ],
            { fields: ['id'], limit: 1, order: 'check_in desc' },
          ],
        },
        id: 4,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!searchResponse.ok) {
      console.error('❌ Error al buscar asistencia activa en Odoo:', searchResponse.status);
      return false;
    }

    const searchData = await searchResponse.json();

    if (searchData.error || !searchData.result || searchData.result.length === 0) {
      console.error('❌ No se encontró asistencia activa en Odoo');
      return false;
    }

    const attendanceId = searchData.result[0].id;

    // Formatear fecha en formato Odoo: YYYY-MM-DD HH:MM:SS
    const formatoOdoo = fecha.toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');

    // Actualizar con check-out
    const updateResponse = await fetch(`${odooUrl}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            config.database,
            auth.uid,
            config.contrasena,
            'hr.attendance',
            'write',
            [
              [attendanceId],
              {
                check_out: formatoOdoo,
              },
            ],
          ],
        },
        id: 5,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!updateResponse.ok) {
      console.error('❌ Error al registrar check-out en Odoo:', updateResponse.status);
      return false;
    }

    const updateData = await updateResponse.json();

    if (updateData.error) {
      console.error('❌ Error de Odoo al registrar check-out:', updateData.error);
      return false;
    }

    console.log(`✅ Check-out registrado en Odoo (Attendance ID: ${attendanceId})`);
    return true;
  } catch (error) {
    console.error('❌ Error al registrar check-out en Odoo:', error);
    return false;
  }
}

/**
 * Sincronizar asistencia con Odoo (entrada o salida)
 * @throws Error si hay integración activa pero falla la sincronización
 */
export async function sincronizarAsistenciaConOdoo(
  usuarioId: string,
  empleado: { email: string | null; dni: string; codigo: string },
  tipo: 'entrada' | 'salida',
  fecha: Date
): Promise<number | null> {
  try {
    console.log(`🔄 Intentando sincronizar ${tipo} con Odoo...`);

    // Buscar integración activa de Odoo
    const integracion = await prisma.integracion.findFirst({
      where: {
        usuarioId,
        tipo: 'ODOO',
        activo: true,
      },
    });

    if (!integracion) {
      console.log('ℹ️ No hay integración de Odoo activa');
      return null;
    }

    const config = integracion.configuracion as unknown as OdooConfig;

    // Autenticar en Odoo (lanza excepción si falla)
    console.log('🔐 Autenticando en Odoo...');
    const auth = await authenticateOdoo(config);
    
    if (!auth) {
      throw new Error('No se pudo autenticar en Odoo');
    }

    // Buscar empleado en Odoo (lanza excepción si falla)
    console.log('🔍 Buscando empleado en Odoo...');
    const empleadoOdooId = await buscarEmpleadoEnOdoo(config, auth, empleado);
    
    if (!empleadoOdooId) {
      throw new Error('No se encontró el empleado en Odoo');
    }

    // Registrar asistencia según el tipo
    if (tipo === 'entrada') {
      const odooAttendanceId = await registrarCheckInOdoo(config, auth, empleadoOdooId, fecha);
      console.log(`✅ Entrada sincronizada exitosamente con Odoo (ID: ${odooAttendanceId})`);
      return odooAttendanceId;
    } else {
      const success = await registrarCheckOutOdoo(config, auth, empleadoOdooId, fecha);
      if (!success) {
        throw new Error('No se pudo registrar la salida en Odoo. Verifica que exista una asistencia activa.');
      }
      console.log(`✅ Salida sincronizada exitosamente con Odoo`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al sincronizar con Odoo:', error);
    throw error; // Re-lanzamos el error para que sea manejado por el llamador
  }
}
