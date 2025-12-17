import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';

// GET - Obtener proyectos activos de la empresa del empleado
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

    // Obtener la empresa del empleado
    const empleado = await prisma.empleado.findUnique({
      where: { id: payload.empleadoId as string },
      select: {
        empresaId: true,
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Obtener proyectos activos de la empresa
    const proyectos = await prisma.proyecto.findMany({
      where: {
        empresaId: empleado.empresaId,
        activo: true,
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
      },
      orderBy: {
        codigo: 'asc',
      },
    });

    return NextResponse.json({ proyectos }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener proyectos:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}
