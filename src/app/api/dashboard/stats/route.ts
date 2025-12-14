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

    // Obtener total de empresas
    const totalEmpresas = await prisma.empresa.count({
      where: { usuarioId: payload.userId },
    });

    // Obtener total de empleados
    const totalEmpleados = await prisma.empleado.count({
      where: {
        empresa: {
          usuarioId: payload.userId,
        },
      },
    });

    // Obtener asistencias de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const asistenciasHoy = await prisma.asistencia.count({
      where: {
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
        checkIn: {
          gte: hoy,
          lt: manana,
        },
      },
    });

    return NextResponse.json({
      totalEmpresas,
      totalEmpleados,
      asistenciasHoy,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
