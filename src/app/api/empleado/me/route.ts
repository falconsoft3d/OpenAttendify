import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';

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

    // Obtener información actualizada del empleado
    const empleado = await prisma.empleado.findUnique({
      where: { id: payload.empleadoId as string },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        cargo: true,
        activo: true,
        avatarUrl: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            usuarioId: true,
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

    if (!empleado.activo) {
      return NextResponse.json(
        { error: 'Tu cuenta está inactiva' },
        { status: 401 }
      );
    }

    // Obtener configuración del usuario de la empresa
    const configuracion = await prisma.configuracion.findUnique({
      where: { usuarioId: empleado.empresa.usuarioId }
    });

    return NextResponse.json({ 
      empleado: {
        ...empleado,
        empresa: {
          id: empleado.empresa.id,
          nombre: empleado.empresa.nombre,
        }
      },
      configuracion: configuracion || { usarProyectosAsistencia: false }
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error en /api/empleado/me:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}
