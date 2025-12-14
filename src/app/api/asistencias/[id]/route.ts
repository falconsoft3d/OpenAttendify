import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const asistenciaSchema = z.object({
  empleadoId: z.string(),
  checkIn: z.string(),
  checkOut: z.string().optional(),
  observaciones: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que la asistencia pertenece al usuario
    const asistenciaExistente = await prisma.asistencia.findFirst({
      where: {
        id: id,
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
    });

    if (!asistenciaExistente) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = asistenciaSchema.parse(body);

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
    const checkIn = new Date(validatedData.checkIn);
    const checkOut = validatedData.checkOut && validatedData.checkOut.trim() !== '' 
      ? new Date(validatedData.checkOut) 
      : null;

    const asistencia = await prisma.asistencia.update({
      where: { id: id },
      data: {
        empleadoId: validatedData.empleadoId,
        checkIn,
        checkOut,
        observaciones: validatedData.observaciones || null,
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

    return NextResponse.json(asistencia);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando asistencia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que la asistencia pertenece al usuario
    const asistencia = await prisma.asistencia.findFirst({
      where: {
        id: id,
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
    });

    if (!asistencia) {
      return NextResponse.json(
        { error: 'Asistencia no encontrada' },
        { status: 404 }
      );
    }

    await prisma.asistencia.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando asistencia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
