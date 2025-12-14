import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Cliente JSON-RPC para Odoo
async function odooJsonRpcCall(url: string, service: string, method: string, args: any[]) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: service,
      method: method,
      args: args,
    },
    id: Math.floor(Math.random() * 1000000),
  };

  console.log('🔵 Llamada JSON-RPC a Odoo:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log('🟢 Respuesta de Odoo:', JSON.stringify(data, null, 2));

  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'Error en Odoo');
  }

  return data.result;
}

export async function POST(request: NextRequest) {
  console.log('🚀 INICIO - Petición recibida en /api/integraciones/import-employees-odoo');
  
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');
    
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'No autorizado',
        details: 'Debe iniciar sesión para importar empleados'
      }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as number;
    console.log('👤 Usuario autenticado ID:', usuarioId);

    // Obtener datos del body
    const { integracionId } = await request.json();
    console.log('📦 IntegracionId recibido:', integracionId);

    if (!integracionId) {
      return NextResponse.json({ 
        success: false,
        error: 'Datos incompletos',
        details: 'El ID de la integración es requerido'
      }, { status: 400 });
    }

    // Obtener la integración de Odoo
    console.log('🔎 Buscando integración en DB...');
    const integracion = await prisma.integracion.findFirst({
      where: {
        id: integracionId,
        tipo: 'ODOO',
        usuarioId: usuarioId.toString()
      }
    });

    console.log('📋 Integración encontrada:', integracion ? 'Sí' : 'No');
    if (integracion) {
      console.log('   - ID:', integracion.id);
      console.log('   - Activo:', integracion.activo);
      console.log('   - Config:', JSON.stringify(integracion.configuracion, null, 2));
    }

    if (!integracion) {
      return NextResponse.json({ 
        success: false,
        error: 'Integración no encontrada',
        details: 'No se encontró una integración de Odoo con ese ID o no tiene permisos para acceder a ella'
      }, { status: 404 });
    }

    if (!integracion.activo) {
      return NextResponse.json({ 
        success: false,
        error: 'Integración inactiva',
        details: 'La integración con Odoo está desactivada. Por favor, actívela primero en la configuración'
      }, { status: 400 });
    }

    const config = integracion.configuracion as any;

    // Obtener la primera empresa del usuario
    const empresa = await prisma.empresa.findFirst({
      where: { usuarioId: usuarioId.toString() }
    });

    if (!empresa) {
      return NextResponse.json({ 
        success: false,
        error: 'No tiene empresas',
        details: 'Debe crear al menos una empresa antes de importar empleados'
      }, { status: 400 });
    }

    console.log('🏢 Empresa encontrada:', empresa.nombre, '- ID:', empresa.id);

    // Autenticarse en Odoo usando JSON-RPC
    let uid: number;
    try {
      uid = await odooJsonRpcCall(
        config.url,
        'common',
        'authenticate',
        [config.database, config.usuario, config.contrasena, {}]
      ) as number;

      if (!uid) {
        return NextResponse.json({ 
          success: false,
          error: 'Error de autenticación con Odoo',
          details: 'Las credenciales configuradas son incorrectas. Verifique el usuario y contraseña en la configuración de Odoo'
        }, { status: 401 });
      }
    } catch (error: any) {
      return NextResponse.json({ 
        success: false,
        error: 'No se pudo conectar con Odoo',
        details: `Error al conectar con ${config.url}: ${error.message}. Verifique que la URL sea correcta y que el servidor esté accesible`
      }, { status: 500 });
    }

    // Buscar todos los empleados en Odoo
    console.log('🔍 Buscando empleados en Odoo con modelo: hr.employee');
    const employeeIds = await odooJsonRpcCall(
      config.url,
      'object',
      'execute_kw',
      [
        config.database,
        uid,
        config.contrasena,
        'hr.employee',
        'search',
        [[]]
      ]
    ) as number[];

    console.log('📋 IDs de empleados encontrados:', employeeIds);

    if (!employeeIds || employeeIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No hay empleados en Odoo',
        details: 'No se encontraron empleados en el sistema Odoo. Verifique que existan empleados registrados',
        count: 0
      });
    }

    // Leer datos de empleados (solo name, email, id)
    console.log('📖 Leyendo datos de empleados. Campos solicitados: id, name, work_email');
    const employees = await odooJsonRpcCall(
      config.url,
      'object',
      'execute_kw',
      [
        config.database,
        uid,
        config.contrasena,
        'hr.employee',
        'read',
        [employeeIds, ['id', 'name', 'work_email']]
      ]
    ) as any[];

    console.log('👥 Empleados obtenidos de Odoo:', JSON.stringify(employees, null, 2));

    // Importar empleados
    let importCount = 0;
    const errors: string[] = [];

    for (const emp of employees) {
      try {
        // Validar datos requeridos
        if (!emp.id) {
          errors.push(`⚠️ ${emp.name}: Falta ID (campo requerido para la importación)`);
          continue;
        }

        // Usar el ID de Odoo como código del empleado
        const codigoEmpleado = emp.id.toString();

        // Verificar si el empleado ya existe por código
        const existingEmpleadoByCodigo = await prisma.empleado.findFirst({
          where: {
            codigo: codigoEmpleado,
            empresaId: empresa.id
          }
        });

        // Verificar si el empleado ya existe por email (si tiene email)
        let existingEmpleadoByEmail = null;
        if (emp.work_email) {
          existingEmpleadoByEmail = await prisma.empleado.findFirst({
            where: {
              email: emp.work_email,
              empresaId: empresa.id
            }
          });

          // Si el email ya existe en otro empleado, no crear/actualizar
          if (existingEmpleadoByEmail && (!existingEmpleadoByCodigo || existingEmpleadoByEmail.id !== existingEmpleadoByCodigo.id)) {
            errors.push(`❌ ${emp.name} (ID: ${emp.id}): El email "${emp.work_email}" ya está registrado para otro empleado`);
            continue;
          }
        }

        if (existingEmpleadoByCodigo) {
          // Actualizar empleado existente
          await prisma.empleado.update({
            where: { id: existingEmpleadoByCodigo.id },
            data: {
              nombre: emp.name,
              email: emp.work_email || null,
              // No actualizar la contraseña si ya existe
            }
          });
        } else {
          // Generar contraseña por defecto
          const defaultPassword = codigoEmpleado;
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);

          // Crear nuevo empleado
          await prisma.empleado.create({
            data: {
              codigo: codigoEmpleado,
              nombre: emp.name,
              apellido: "-", // Apellido por defecto
              dni: codigoEmpleado, // Usar el mismo ID como DNI
              email: emp.work_email || null,
              password: hashedPassword,
              empresaId: empresa.id,
            }
          });
        }

        importCount++;
      } catch (error: any) {
        const errorMsg = error.message.includes('Unique constraint')
          ? `❌ ${emp.name} (ID: ${emp.id}): Ya existe un empleado con este ID o email`
          : `❌ ${emp.name} (ID: ${emp.id}): ${error.message}`;
        errors.push(errorMsg);
      }
    }

    // Generar mensaje final descriptivo
    let finalMessage = '';
    if (importCount === employees.length) {
      finalMessage = `✅ Se importaron todos los empleados exitosamente (${importCount} de ${employees.length})`;
    } else if (importCount > 0) {
      finalMessage = `⚠️ Importación parcial: ${importCount} de ${employees.length} empleados importados. ${errors.length} empleados con problemas`;
    } else {
      finalMessage = `❌ No se pudo importar ningún empleado. Revise los errores a continuación`;
    }

    return NextResponse.json({
      success: importCount > 0,
      message: finalMessage,
      count: importCount,
      total: employees.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Error importando empleados:', error);
    
    // Mensaje de error más específico
    let errorDetails = error.message;
    if (error.message.includes('fetch')) {
      errorDetails = 'Error de red al conectar con Odoo. Verifique su conexión a internet y que el servidor Odoo esté accesible';
    } else if (error.message.includes('JSON')) {
      errorDetails = 'Error al procesar la respuesta de Odoo. Verifique que la URL y configuración sean correctas';
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Error inesperado durante la importación',
      details: errorDetails
    }, { status: 500 });
  }
}
