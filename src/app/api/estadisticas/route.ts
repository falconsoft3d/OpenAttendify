import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('📊 Consultando estadísticas...');
    
    // Obtener estadísticas
    const [allVistas, totalUsuarios, usuariosPorPais] = await Promise.all([
      // Total de vistas del home
      prisma.vistaHome.findMany(),

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

    const vistasHome = allVistas.length;

    console.log('📈 Vistas Home:', vistasHome);
    console.log('👥 Total Usuarios:', totalUsuarios);
    console.log('🌍 Usuarios por país:', usuariosPorPais);

    const response = {
      vistasHome,
      totalUsuarios,
      topPaises: usuariosPorPais.map((item) => ({
        pais: item.pais,
        total: item._count.pais,
      })),
    };

    console.log('✅ Respuesta completa:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ error: 'Error obteniendo estadísticas' }, { status: 500 });
  }
}
