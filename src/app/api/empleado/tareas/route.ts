import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/jwt';
import { z } from 'zod';

const crearTareaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  proyectoId: z.string().min(1, 'El proyecto es requerido'),
  fecha: z.string().transform((val) => new Date(val)),
});

// GET - Obtener tareas asignadas al empleado
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'empleado' || !payload.empleadoId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    console.log('🔍 Buscando tareas para empleadoId:', payload.empleadoId);

    // Debug: Ver todos los empleados para diagnosticar
    const empleados = await prisma.empleado.findMany({
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
      },
      orderBy: { codigo: 'asc' },
    });
    console.log('👥 DEBUG - Todos los empleados:', JSON.stringify(empleados, null, 2));

    // Debug: Ver todas las tareas para diagnosticar
    const todasLasTareas = await prisma.tarea.findMany({
      select: {
        secuencia: true,
        nombre: true,
        empleadoId: true,
      },
    });
    console.log('🔎 DEBUG - Todas las tareas en la BD:', JSON.stringify(todasLasTareas, null, 2));

    // Obtener tareas asignadas al empleado
    const tareas = await prisma.tarea.findMany({
      where: {
        empleadoId: payload.empleadoId as string,
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
      orderBy: [
        { estado: 'asc' },
        { fecha: 'desc' },
      ],
    });

    console.log(`✅ Encontradas ${tareas.length} tareas para el empleado`);

    // Convertir Decimal a number para JSON
    const tareasFormateadas = tareas.map(tarea => ({
      ...tarea,
      totalHoras: tarea.totalHoras ? parseFloat(tarea.totalHoras.toString()) : null,
    }));

    return NextResponse.json({ tareas: tareasFormateadas });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva tarea asignada al empleado
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'empleado' || !payload.empleadoId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = crearTareaSchema.parse(body);

    // Obtener empleado para verificar empresa y usuarioId
    const empleado = await prisma.empleado.findUnique({
      where: { id: payload.empleadoId as string },
      include: {
        empresa: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar que el proyecto pertenece a la empresa
    const proyecto = await prisma.proyecto.findFirst({
      where: {
        id: validatedData.proyectoId,
        empresa: {
          usuarioId: empleado.empresa.usuarioId,
        },
      },
    });

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Generar secuencia
    const ultimaTarea = await prisma.tarea.findFirst({
      where: { usuarioId: empleado.empresa.usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    let numeroSecuencia = 1;
    if (ultimaTarea && ultimaTarea.secuencia) {
      const match = ultimaTarea.secuencia.match(/TAR-(\d{5})$/);
      if (match) {
        numeroSecuencia = parseInt(match[1]) + 1;
      }
    }
    const secuencia = `TAR-${numeroSecuencia.toString().padStart(5, '0')}`;

    // Crear tarea asignada al empleado con estado ASIGNADA
    const tarea = await prisma.tarea.create({
      data: {
        secuencia,
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        fecha: validatedData.fecha,
        estado: 'ASIGNADA',
        proyectoId: validatedData.proyectoId,
        empleadoId: payload.empleadoId as string,
        usuarioId: empleado.empresa.usuarioId,
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

    const tareaFormateada = {
      ...tarea,
      totalHoras: tarea.totalHoras ? parseFloat(tarea.totalHoras.toString()) : null,
    };

    return NextResponse.json(tareaFormateada, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de una tarea (iniciar, pausar, finalizar)
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'empleado' || !payload.empleadoId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { tareaId, accion } = body;

    if (!tareaId || !accion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la tarea está asignada al empleado
    const tarea = await prisma.tarea.findFirst({
      where: {
        id: tareaId,
        empleadoId: payload.empleadoId as string,
      },
    });

    if (!tarea) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no asignada a ti' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    const ahora = new Date();

    switch (accion) {
      case 'iniciar':
        if (tarea.estado === 'BORRADOR' || tarea.estado === 'ASIGNADA') {
          updateData = {
            estado: 'TRABAJANDO',
            fechaInicio: ahora,
          };
        } else if (tarea.estado === 'TRABAJANDO' && !tarea.fechaInicio) {
          updateData = {
            fechaInicio: ahora,
          };
        }
        break;

      case 'detener':
        // Pausar (mantener en TRABAJANDO pero registrar tiempo)
        if (tarea.estado === 'TRABAJANDO') {
          // No cambiamos el estado, solo actualizamos el tiempo si es necesario
          updateData = {
            // Mantener estado actual
          };
        }
        break;

      case 'finalizar':
        if (tarea.estado !== 'COMPLETADO') {
          const fechaInicio = tarea.fechaInicio || ahora;
          const totalHoras = (ahora.getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60);
          
          updateData = {
            estado: 'COMPLETADO',
            fechaFin: ahora,
            totalHoras: Math.round(totalHoras * 100) / 100,
          };
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Solo actualizar si hay cambios
    if (Object.keys(updateData).length > 0) {
      const tareaActualizada = await prisma.tarea.update({
        where: { id: tareaId },
        data: updateData,
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

      return NextResponse.json({ 
        success: true,
        tarea: tareaActualizada,
        mensaje: `Tarea ${accion === 'iniciar' ? 'iniciada' : accion === 'finalizar' ? 'finalizada' : 'actualizada'} correctamente` 
      });
    }

    return NextResponse.json({ 
      success: true,
      mensaje: 'Sin cambios necesarios' 
    });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}
