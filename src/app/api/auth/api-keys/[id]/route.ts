import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'tu-secret-key-super-segura');

// Eliminar API Key
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

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const usuarioId = payload.userId as string;

    // Verificar que la key pertenece al usuario
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        usuarioId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la key
    await prisma.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'API Key eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar API Key:', error);
    return NextResponse.json(
      { error: 'Error al eliminar API Key' },
      { status: 500 }
    );
  }
}

// Actualizar API Key (activar/desactivar)
export async function PATCH(
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

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const usuarioId = payload.userId as string;

    const body = await request.json();

    // Verificar que la key pertenece al usuario
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        usuarioId,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar la key
    const updated = await prisma.apiKey.update({
      where: { id: params.id },
      data: {
        activa: body.activa,
        nombre: body.nombre,
      },
    });

    return NextResponse.json(
      { message: 'API Key actualizada exitosamente', apiKey: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al actualizar API Key:', error);
    return NextResponse.json(
      { error: 'Error al actualizar API Key' },
      { status: 500 }
    );
  }
}
