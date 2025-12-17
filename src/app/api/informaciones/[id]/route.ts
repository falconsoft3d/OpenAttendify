import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const informacionUpdateSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').optional(),
  descripcion: z.string().min(1, 'La descripción es requerida').optional(),
  clasificacion: z.enum(['INFORMATIVA', 'ALERTA', 'OTRAS']).optional(),
});

// GET - Obtener una información por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const informacion = await prisma.informacion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!informacion) {
      return NextResponse.json(
        { error: 'Información no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(informacion);
  } catch (error) {
    console.error('Error obteniendo información:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar información
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que la información pertenece al usuario
    const informacionExistente = await prisma.informacion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!informacionExistente) {
      return NextResponse.json(
        { error: 'Información no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = informacionUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.titulo) updateData.titulo = validatedData.titulo;
    if (validatedData.descripcion) updateData.descripcion = validatedData.descripcion;
    if (validatedData.clasificacion) updateData.clasificacion = validatedData.clasificacion;

    const informacion = await prisma.informacion.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(informacion);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando información:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar información
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que la información pertenece al usuario
    const informacion = await prisma.informacion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!informacion) {
      return NextResponse.json(
        { error: 'Información no encontrada' },
        { status: 404 }
      );
    }

    await prisma.informacion.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Información eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando información:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
