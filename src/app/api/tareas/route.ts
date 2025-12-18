import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';
import { z } from 'zod';

const tareaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  fecha: z.string().transform((val) => new Date(val)),
  estado: z.enum(['BORRADOR', 'ASIGNADA', 'TRABAJANDO', 'COMPLETADO']).default('BORRADOR'),
  fechaInicio: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  fechaFin: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  proyectoId: z.string(),
  empleadoId: z.string().optional(),
});

// Función para generar la siguiente secuencia
async function generarSecuencia(usuarioId: string): Promise<string> {
  const ultimaTarea = await prisma.tarea.findFirst({
    where: { usuarioId },
    orderBy: { createdAt: 'desc' },
  });

  let numeroSecuencia = 1;
  if (ultimaTarea && ultimaTarea.secuencia) {
    const match = ultimaTarea.secuencia.match(/TAR-(\d{5})$/);
    if (match) {
      numeroSecuencia = parseInt(match[1]) + 1;
    }
  }

  return `TAR-${numeroSecuencia.toString().padStart(5, '0')}`;
}

// Función para calcular total de horas
function calcularTotalHoras(fechaInicio?: Date, fechaFin?: Date): number | null {
  if (!fechaInicio || !fechaFin) return null;
  const diff = fechaFin.getTime() - fechaInicio.getTime();
  return Math.max(0, diff / (1000 * 60 * 60)); // Convertir a horas
}

// GET - Obtener todas las tareas
export async function GET(request: NextRequest) {
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

    const tareas = await prisma.tarea.findMany({
      where: { usuarioId },
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
      orderBy: { createdAt: 'desc' },
    });

    // Convertir Decimal a number para JSON
    const tareasFormateadas = tareas.map(tarea => ({
      ...tarea,
      totalHoras: tarea.totalHoras ? parseFloat(tarea.totalHoras.toString()) : null,
    }));

    return NextResponse.json(tareasFormateadas);
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = tareaSchema.parse(body);

    // Verificar que el proyecto pertenece al usuario
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

    // Generar secuencia
    const secuencia = await generarSecuencia(usuarioId);

    // Calcular total de horas si hay fechas
    const totalHoras = calcularTotalHoras(validatedData.fechaInicio, validatedData.fechaFin);

    // Determinar el estado: si se asigna empleado y está en BORRADOR, cambiar a ASIGNADA
    const estadoFinal = validatedData.empleadoId && validatedData.estado === 'BORRADOR' 
      ? 'ASIGNADA' 
      : validatedData.estado;

    const tarea = await prisma.tarea.create({
      data: {
        secuencia,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        fecha: validatedData.fecha,
        estado: estadoFinal,
        fechaInicio: validatedData.fechaInicio,
        fechaFin: validatedData.fechaFin,
        totalHoras,
        proyectoId: validatedData.proyectoId,
        empleadoId: validatedData.empleadoId,
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

    return NextResponse.json(tarea, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
