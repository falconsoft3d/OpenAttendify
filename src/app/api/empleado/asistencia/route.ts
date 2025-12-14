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
      },
    });

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
        fechaEntrada
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
