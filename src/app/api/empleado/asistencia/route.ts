import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { sincronizarAsistenciaConOdoo } from '@/lib/odoo-sync';
import { JWT_SECRET } from '@/lib/jwt';

// Obtener asistencia activa o historial
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'activa' o 'historial'

    if (tipo === 'activa') {
      // Buscar asistencia activa (sin hora de salida)
      const asistenciaActiva = await prisma.asistencia.findFirst({
        where: {
          empleadoId,
          checkOut: null,
        },
        orderBy: {
          checkIn: 'desc',
        },
        include: {
          proyecto: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            },
          },
        },
      });

      return NextResponse.json({ asistencia: asistenciaActiva }, { status: 200 });
    }

    // Obtener historial de asistencias
    const asistencias = await prisma.asistencia.findMany({
      where: {
        empleadoId,
      },
      orderBy: {
        checkIn: 'desc',
      },
      take: 20, // Últimas 20 asistencias
    });

    return NextResponse.json({ asistencias }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener asistencias:', error);
    return NextResponse.json(
      { error: 'Error al obtener asistencias' },
      { status: 500 }
    );
  }
}

// Registrar entrada
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;
    
    // Leer el body para obtener el proyectoId (opcional)
    let proyectoId: string | undefined;
    try {
      const body = await request.json();
      proyectoId = body.proyectoId;
    } catch (error) {
      // Si no hay body, continuar sin proyecto
    }

    // Verificar que no haya una asistencia activa
    const asistenciaActiva = await prisma.asistencia.findFirst({
      where: {
        empleadoId,
        checkOut: null,
      },
    });

    if (asistenciaActiva) {
      return NextResponse.json(
        { error: 'Ya tienes una asistencia activa' },
        { status: 400 }
      );
    }

    // Obtener datos del empleado con su empresa y usuario para Odoo sync
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    const fechaEntrada = new Date();

    // Crear nueva asistencia
    const asistencia = await prisma.asistencia.create({
      data: {
        empleadoId,
        checkIn: fechaEntrada,
        proyectoId: proyectoId || undefined, // Incluir proyecto si está presente
      },
    });

    // Si hay proyecto seleccionado, buscar en Odoo
    let odooProjectId: number | null = null;
    if (proyectoId) {
      try {
        const proyecto = await prisma.proyecto.findUnique({
          where: { id: proyectoId },
          select: { codigo: true },
        });

        if (proyecto) {
          // Buscar integración Odoo activa
          const integracion = await prisma.integracion.findFirst({
            where: {
              usuarioId: empleado.empresa.usuarioId,
              tipo: 'ODOO',
              activo: true,
            },
          });

          if (integracion) {
            const config = integracion.configuracion as any;
            const odooUrl = `${config.url}:${config.puerto}`;
            
            // Autenticarse en Odoo
            const authResponse = await fetch(`${odooUrl}/jsonrpc`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                  service: 'common',
                  method: 'authenticate',
                  args: [config.database, config.usuario, config.contrasena, {}],
                },
                id: Math.floor(Math.random() * 1000000),
              }),
            });

            const authData = await authResponse.json();
            const uid = authData.result;

            if (uid) {
              // Buscar proyecto en Odoo por el campo 'name' (código)
              const searchResponse = await fetch(`${odooUrl}/jsonrpc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'call',
                  params: {
                    service: 'object',
                    method: 'execute_kw',
                    args: [
                      config.database,
                      uid,
                      config.contrasena,
                      'bim.project',
                      'search',
                      [[['name', '=', proyecto.codigo]]],
                    ],
                  },
                  id: Math.floor(Math.random() * 1000000),
                }),
              });

              const searchData = await searchResponse.json();
              const projectIds = searchData.result;

              if (projectIds && projectIds.length > 0) {
                odooProjectId = projectIds[0];
                console.log(`✅ Proyecto encontrado en Odoo: ${proyecto.codigo} -> ID ${odooProjectId}`);
              } else {
                console.log(`⚠️  Proyecto no encontrado en Odoo: ${proyecto.codigo}`);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error al buscar proyecto en Odoo:', error);
      }
    }

    // Actualizar asistencia con odooProjectId si se encontró
    if (odooProjectId) {
      await prisma.asistencia.update({
        where: { id: asistencia.id },
        data: { odooProjectId },
      });
    }

    // Sincronizar con Odoo si hay integración activa
    try {
      const odooAttendanceId = await sincronizarAsistenciaConOdoo(
        empleado.empresa.usuarioId,
        {
          email: empleado.email,
          dni: empleado.dni,
          codigo: empleado.codigo,
        },
        'entrada',
        fechaEntrada,
        odooProjectId || undefined // Pasar el project_id de Odoo
      );

      // Si se creó en Odoo, guardar el ID
      if (odooAttendanceId) {
        await prisma.asistencia.update({
          where: { id: asistencia.id },
          data: { odooAttendanceId },
        });
        console.log(`✅ ID de Odoo guardado en asistencia local: ${odooAttendanceId}`);
      }
    } catch (error: any) {
      // Solo guardar el error si realmente hay un problema de sincronización
      // (no si simplemente no hay integración configurada)
      console.error('❌ Error al sincronizar con Odoo:', error);
      if (error.message && !error.message.includes('No hay integración')) {
        await prisma.asistencia.update({
          where: { id: asistencia.id },
          data: { 
            odooError: error.message || 'Error desconocido al sincronizar con Odoo'
          },
        });
      }
    }

    return NextResponse.json(
      { 
        message: 'Entrada registrada exitosamente',
        asistencia 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Error al registrar entrada:', error);
    console.error('❌ Stack trace:', error?.stack);
    return NextResponse.json(
      { error: 'Error al registrar entrada', details: error?.message },
      { status: 500 }
    );
  }
}

// Registrar salida
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;

    // Buscar asistencia activa
    const asistenciaActiva = await prisma.asistencia.findFirst({
      where: {
        empleadoId,
        checkOut: null,
      },
    });

    if (!asistenciaActiva) {
      return NextResponse.json(
        { error: 'No tienes una asistencia activa' },
        { status: 400 }
      );
    }

    // Obtener datos del empleado con su empresa y usuario para Odoo sync
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    const fechaSalida = new Date();

    // Actualizar con hora de salida
    const asistencia = await prisma.asistencia.update({
      where: { id: asistenciaActiva.id },
      data: {
        checkOut: fechaSalida,
      },
    });

    // Sincronizar con Odoo si hay integración activa
    try {
      await sincronizarAsistenciaConOdoo(
        empleado.empresa.usuarioId,
        {
          email: empleado.email,
          dni: empleado.dni,
          codigo: empleado.codigo,
        },
        'salida',
        fechaSalida
      );
    } catch (error: any) {
      // Solo guardar el error si realmente hay un problema de sincronización
      console.error('❌ Error al sincronizar con Odoo:', error);
      if (error.message && !error.message.includes('No hay integración')) {
        await prisma.asistencia.update({
          where: { id: asistenciaActiva.id },
          data: {
            odooError: error.message || 'Error desconocido al sincronizar con Odoo'
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Salida registrada exitosamente',
        asistencia,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error al registrar salida:', error);
    return NextResponse.json(
      { error: 'Error al registrar salida' },
      { status: 500 }
    );
  }
}
