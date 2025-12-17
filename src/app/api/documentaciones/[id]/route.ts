import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

// GET - Obtener una documentación específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Obtener la documentación
    const documentacion = await prisma.documentacion.findFirst({
      where: {
        id: params.id,
        usuarioId: usuarioId
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
          }
        },
        tipoDocumentacion: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    if (!documentacion) {
      return NextResponse.json(
        { error: 'Documentación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(documentacion);
  } catch (error: any) {
    console.error('Error al obtener documentación:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentación' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una documentación
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Verificar que la documentación existe y pertenece al usuario
    const documentacion = await prisma.documentacion.findFirst({
      where: {
        id: params.id,
        usuarioId: usuarioId
      }
    });

    if (!documentacion) {
      return NextResponse.json(
        { error: 'Documentación no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la documentación
    await prisma.documentacion.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Documentación eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar documentación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar documentación' },
      { status: 500 }
    );
  }
}
