import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const proyectoUpdateSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  empresaId: z.string().min(1, 'Debe seleccionar una empresa').optional(),
  activo: z.boolean().optional(),
});

// GET - Obtener un proyecto por ID
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

    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            usuarioId: true,
          }
        }
      }
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el proyecto pertenezca a una empresa del usuario
    if (proyecto.empresa.usuarioId !== payload.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    return NextResponse.json(proyecto);
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un proyecto
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

    const body = await request.json();
    const validatedData = proyectoUpdateSchema.parse(body);

    // Verificar que el proyecto exista y pertenezca al usuario
    const proyectoExistente = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            usuarioId: true,
          }
        }
      }
    });

    if (!proyectoExistente) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    console.log('🔍 Verificando autorización:');
    console.log('  - Usuario del token:', payload.userId);
    console.log('  - Usuario de la empresa:', proyectoExistente.empresa.usuarioId);

    if (proyectoExistente.empresa.usuarioId !== payload.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Si se está actualizando la empresa, verificar que pertenezca al usuario
    if (validatedData.empresaId) {
      const empresa = await prisma.empresa.findFirst({
        where: {
          id: validatedData.empresaId,
          usuarioId: payload.userId,
        },
      });

      if (!empresa) {
        return NextResponse.json(
          { error: 'Empresa no encontrada o no autorizada' },
          { status: 403 }
        );
      }
    }

    // Si se está actualizando el código, verificar que no exista
    if (validatedData.codigo && validatedData.codigo !== proyectoExistente.codigo) {
      const codigoExiste = await prisma.proyecto.findUnique({
        where: { codigo: validatedData.codigo },
      });

      if (codigoExiste) {
        return NextResponse.json(
          { error: 'Ya existe un proyecto con este código' },
          { status: 400 }
        );
      }
    }

    const proyecto = await prisma.proyecto.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    return NextResponse.json(proyecto);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un proyecto
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

    // Verificar que el proyecto exista y pertenezca al usuario
    const proyecto = await prisma.proyecto.findUnique({
      where: { id: params.id },
      include: {
        empresa: {
          select: {
            usuarioId: true,
          }
        }
      }
    });

    if (!proyecto) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    if (proyecto.empresa.usuarioId !== payload.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    await prisma.proyecto.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
