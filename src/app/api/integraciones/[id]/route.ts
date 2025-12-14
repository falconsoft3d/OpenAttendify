import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que la integración pertenece al usuario
    const integracion = await prisma.integracion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!integracion) {
      return NextResponse.json(
        { error: 'Integración no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { activo, configuracion } = body;

    const updated = await prisma.integracion.update({
      where: { id: params.id },
      data: {
        activo: activo ?? integracion.activo,
        configuracion: configuracion ?? integracion.configuracion,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar integración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar integración' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que la integración pertenece al usuario
    const integracion = await prisma.integracion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!integracion) {
      return NextResponse.json(
        { error: 'Integración no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { activo } = body;

    const updated = await prisma.integracion.update({
      where: { id: params.id },
      data: {
        activo: activo ?? integracion.activo,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar estado de integración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado de integración' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que la integración pertenece al usuario
    const integracion = await prisma.integracion.findFirst({
      where: {
        id: params.id,
        usuarioId: payload.userId,
      },
    });

    if (!integracion) {
      return NextResponse.json(
        { error: 'Integración no encontrada' },
        { status: 404 }
      );
    }

    await prisma.integracion.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Integración eliminada' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar integración:', error);
    return NextResponse.json(
      { error: 'Error al eliminar integración' },
      { status: 500 }
    );
  }
}
