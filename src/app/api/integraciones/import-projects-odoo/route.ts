import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

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
  console.log('🚀 INICIO - Petición recibida en /api/integraciones/import-projects-odoo');
  
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    console.log('🔐 Token encontrado:', token ? 'Sí' : 'No');
    
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'No autorizado',
        details: 'Debe iniciar sesión para importar proyectos'
      }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;
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
        usuarioId: usuarioId
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
      where: { usuarioId: usuarioId }
    });

    if (!empresa) {
      return NextResponse.json({ 
        success: false,
        error: 'No tiene empresas',
        details: 'Debe crear al menos una empresa antes de importar proyectos'
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

    console.log('✅ Autenticado en Odoo con UID:', uid);

    // Buscar todos los proyectos en Odoo (tabla bim.project)
    console.log('🔍 Buscando proyectos en Odoo con modelo: bim.project');
    const projectIds = await odooJsonRpcCall(
      config.url,
      'object',
      'execute_kw',
      [
        config.database,
        uid,
        config.contrasena,
        'bim.project',
        'search',
        [[]]
      ]
    ) as number[];

    console.log('📋 IDs de proyectos encontrados:', projectIds);

    if (!projectIds || projectIds.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No hay proyectos en Odoo',
        details: 'No se encontraron proyectos en el sistema Odoo. Verifique que existan proyectos registrados en bim.project',
        count: 0,
        imported: 0,
        skipped: 0
      });
    }

    // Leer datos de proyectos (name y nombre)
    console.log('📖 Leyendo datos de proyectos. Campos solicitados: id, name, nombre');
    const projects = await odooJsonRpcCall(
      config.url,
      'object',
      'execute_kw',
      [
        config.database,
        uid,
        config.contrasena,
        'bim.project',
        'read',
        [projectIds, ['id', 'name', 'nombre']]
      ]
    ) as any[];

    console.log('📁 Proyectos obtenidos de Odoo:', JSON.stringify(projects, null, 2));

    // Importar proyectos
    let importCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const proj of projects) {
      try {
        const codigo = proj.name || `PROJ-${proj.id}`;
        const nombre = proj.nombre || proj.name || 'Sin nombre';

        console.log(`\n📁 Procesando proyecto: ${nombre} (código: ${codigo})`);

        // Verificar si el código ya existe
        const existente = await prisma.proyecto.findUnique({
          where: { codigo: codigo }
        });

        if (existente) {
          console.log(`⚠️  Proyecto con código ${codigo} ya existe, omitiendo...`);
          skippedCount++;
          continue;
        }

        // Crear el proyecto
        const proyecto = await prisma.proyecto.create({
          data: {
            codigo: codigo,
            nombre: nombre,
            empresaId: empresa.id,
            activo: true,
          }
        });

        console.log(`✅ Proyecto creado: ${proyecto.nombre} (ID: ${proyecto.id})`);
        importCount++;
      } catch (error: any) {
        const errorMsg = `Error al importar proyecto ${proj.name || proj.id}: ${error.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log('\n📊 Resumen de importación:');
    console.log(`   ✅ Importados: ${importCount}`);
    console.log(`   ⚠️  Omitidos (ya existen): ${skippedCount}`);
    console.log(`   ❌ Errores: ${errors.length}`);

    return NextResponse.json({ 
      success: true,
      message: `Se importaron ${importCount} proyectos desde Odoo`,
      details: `Total en Odoo: ${projects.length}, Importados: ${importCount}, Omitidos: ${skippedCount}`,
      count: projects.length,
      imported: importCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('❌ ERROR GENERAL:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Error al importar proyectos',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
