import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const integraciones = await prisma.integracion.findMany({
      where: {
        usuarioId: payload.userId,
      },
      select: {
        id: true,
        tipo: true,
        activo: true,
        configuracion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(integraciones, { status: 200 });
  } catch (error) {
    console.error('Error al obtener integraciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener integraciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { tipo, activo, configuracion } = body;

    if (!tipo || !configuracion) {
      return NextResponse.json(
        { error: 'Tipo y configuración son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una integración de este tipo
    const existente = await prisma.integracion.findUnique({
      where: {
        usuarioId_tipo: {
          usuarioId: payload.userId,
          tipo,
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Ya existe una integración de este tipo' },
        { status: 400 }
      );
    }

    const integracion = await prisma.integracion.create({
      data: {
        usuarioId: payload.userId,
        tipo,
        activo: activo ?? false,
        configuracion,
      },
    });

    return NextResponse.json(integracion, { status: 201 });
  } catch (error) {
    console.error('Error al crear integración:', error);
    return NextResponse.json(
      { error: 'Error al crear integración' },
      { status: 500 }
    );
  }
}
