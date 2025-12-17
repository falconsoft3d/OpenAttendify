import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const solicitudUpdateSchema = z.object({
  empleadoId: z.string().optional(),
  fecha: z.string().optional(),
  texto: z.string().min(1, 'El texto es requerido').optional(),
  valor: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) {
      throw new Error('El valor debe ser un número mayor o igual a cero');
    }
    return num;
  }).optional(),
  estado: z.enum(['SOLICITADO', 'APROBADO', 'RECHAZADO']).optional(),
});

// GET - Obtener una solicitud por ID
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

    const solicitud = await prisma.solicitud.findFirst({
      where: {
        id: params.id,
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
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

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Convertir valores Decimal a number
    const solicitudFormateada = {
      ...solicitud,
      valor: typeof solicitud.valor === 'object' ? parseFloat(solicitud.valor.toString()) : solicitud.valor,
    };

    return NextResponse.json(solicitudFormateada);
  } catch (error) {
    console.error('Error obteniendo solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar solicitud
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

    // Verificar que la solicitud pertenece al usuario
    const solicitudExistente = await prisma.solicitud.findFirst({
      where: {
        id: params.id,
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
    });

    if (!solicitudExistente) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = solicitudUpdateSchema.parse(body);

    const updateData: any = {};
    if (validatedData.fecha) updateData.fecha = new Date(validatedData.fecha);
    if (validatedData.texto) updateData.texto = validatedData.texto;
    if (validatedData.valor !== undefined) updateData.valor = validatedData.valor;
    if (validatedData.estado) updateData.estado = validatedData.estado;

    const solicitud = await prisma.solicitud.update({
      where: { id: params.id },
      data: updateData,
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
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

    // Convertir valores Decimal a number
    const solicitudFormateada = {
      ...solicitud,
      valor: typeof solicitud.valor === 'object' ? parseFloat(solicitud.valor.toString()) : solicitud.valor,
    };

    return NextResponse.json(solicitudFormateada);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error actualizando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar solicitud
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

    // Verificar que la solicitud pertenece al usuario
    const solicitud = await prisma.solicitud.findFirst({
      where: {
        id: params.id,
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
    });

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    await prisma.solicitud.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Solicitud eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
