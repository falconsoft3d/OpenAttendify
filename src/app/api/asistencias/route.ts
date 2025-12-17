import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const asistenciaSchema = z.object({
  empleadoId: z.string().min(1, 'Debe seleccionar un empleado'),
  checkIn: z.string(),
  checkOut: z.string().optional().or(z.literal('')),
  observaciones: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const asistencias = await prisma.asistencia.findMany({
      where: {
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
      include: {
        empleado: {
          include: {
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        proyecto: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    });

    return NextResponse.json(asistencias);
  } catch (error) {
    console.error('Error obteniendo asistencias:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📝 Body recibido:', JSON.stringify(body, null, 2));
    
    const validatedData = asistenciaSchema.parse(body);
    console.log('✅ Datos validados:', JSON.stringify(validatedData, null, 2));

    // Verificar que el empleado pertenece al usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: validatedData.empleadoId,
        empresa: {
          usuarioId: payload.userId,
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Crear checkIn y checkOut
    console.log('🕐 Creando fechas - checkIn:', validatedData.checkIn, 'checkOut:', validatedData.checkOut);
    const checkIn = new Date(validatedData.checkIn);
    console.log('🕐 checkIn creado:', checkIn);
    
    const checkOut = validatedData.checkOut && validatedData.checkOut.trim() !== '' 
      ? new Date(validatedData.checkOut) 
      : null;
    console.log('🕐 checkOut creado:', checkOut);

    console.log('💾 Creando asistencia en DB...');
    const asistencia = await prisma.asistencia.create({
      data: {
        empleadoId: validatedData.empleadoId,
        checkIn,
        checkOut,
        observaciones: validatedData.observaciones || null,
        tipoRegistro: 'MANUAL',
      },
      include: {
        empleado: {
          include: {
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(asistencia, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.errors);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creando asistencia:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Error interno del servidor', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
