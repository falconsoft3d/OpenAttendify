import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';

// GET - Obtener informaciones para el empleado
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;

    // Obtener empleado con su empresa y usuario
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Obtener informaciones del usuario de la empresa
    const informaciones = await prisma.informacion.findMany({
      where: {
        usuarioId: empleado.empresa.usuarioId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ informaciones }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener informaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener informaciones' },
      { status: 500 }
    );
  }
}
