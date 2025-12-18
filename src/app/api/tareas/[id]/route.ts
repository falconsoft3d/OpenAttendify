import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const tareaUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  fecha: z.string().transform((val) => new Date(val)).optional(),
  estado: z.enum(['BORRADOR', 'ASIGNADA', 'TRABAJANDO', 'COMPLETADO']).optional(),
  fechaInicio: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  fechaFin: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  proyectoId: z.string().optional(),
  empleadoId: z.string().optional(),
});

// Función para calcular total de horas
function calcularTotalHoras(fechaInicio?: Date | null, fechaFin?: Date | null): number | null {
  if (!fechaInicio || !fechaFin) return null;
  const diff = fechaFin.getTime() - fechaInicio.getTime();
  return Math.max(0, diff / (1000 * 60 * 60)); // Convertir a horas
}

// GET - Obtener una tarea por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const usuarioId = payload.userId as string;

    const tarea = await prisma.tarea.findFirst({
      where: {
        id: params.id,
        usuarioId,
      },
      include: {
        proyecto: true,
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!tarea) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Convertir Decimal a number
    const tareaFormateada = {
      ...tarea,
      totalHoras: tarea.totalHoras ? parseFloat(tarea.totalHoras.toString()) : null,
    };

    return NextResponse.json(tareaFormateada);
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar tarea
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const usuarioId = payload.userId as string;

    // Verificar que la tarea existe y pertenece al usuario
    const tareaExistente = await prisma.tarea.findFirst({
      where: {
        id: params.id,
        usuarioId,
      },
    });

    if (!tareaExistente) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = tareaUpdateSchema.parse(body);

    // Si se cambia el proyecto, verificar que pertenece al usuario
    if (validatedData.proyectoId) {
      const proyecto = await prisma.proyecto.findFirst({
        where: {
          id: validatedData.proyectoId,
          empresa: {
            usuarioId,
          },
        },
      });

      if (!proyecto) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }
    }

    // Calcular total de horas si hay cambios en las fechas
    let totalHoras = tareaExistente.totalHoras;
    const fechaInicio = validatedData.fechaInicio !== undefined ? validatedData.fechaInicio : tareaExistente.fechaInicio;
    const fechaFin = validatedData.fechaFin !== undefined ? validatedData.fechaFin : tareaExistente.fechaFin;
    
    if (validatedData.fechaInicio !== undefined || validatedData.fechaFin !== undefined) {
      const calculado = calcularTotalHoras(fechaInicio, fechaFin);
      if (calculado !== null) {
        totalHoras = new Prisma.Decimal(calculado);
      }
    }

    // Si se asigna un empleado y la tarea está en BORRADOR, cambiar a ASIGNADA
    let estadoActualizado = validatedData.estado;
    if (validatedData.empleadoId && tareaExistente.estado === 'BORRADOR' && !validatedData.estado) {
      estadoActualizado = 'ASIGNADA';
    }

    const tarea = await prisma.tarea.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        estado: estadoActualizado || validatedData.estado,
        totalHoras,
      },
      include: {
        proyecto: true,
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    return NextResponse.json(tarea);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const usuarioId = payload.userId as string;

    const tarea = await prisma.tarea.findFirst({
      where: {
        id: params.id,
        usuarioId,
      },
    });

    if (!tarea) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    await prisma.tarea.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
