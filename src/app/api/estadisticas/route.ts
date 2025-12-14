import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obtener estadísticas
    const [vistasHome, totalUsuarios, usuariosPorPais] = await Promise.all([
      // Total de vistas del home
      prisma.vistaHome.count(),

      // Total de usuarios registrados
      prisma.usuario.count(),

      // Top 10 países
      prisma.usuario.groupBy({
        by: ['pais'],
        _count: {
          pais: true,
        },
        where: {
          pais: {
            not: null,
          },
        },
        orderBy: {
          _count: {
            pais: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      vistasHome,
      totalUsuarios,
      topPaises: usuariosPorPais.map((item) => ({
        pais: item.pais,
        total: item._count.pais,
      })),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
