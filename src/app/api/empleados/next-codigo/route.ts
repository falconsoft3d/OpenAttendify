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

    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');

    if (!empresaId) {
      return NextResponse.json({ error: 'EmpresaId requerido' }, { status: 400 });
    }

    // Verificar que la empresa pertenece al usuario
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: empresaId,
        usuarioId: payload.userId,
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Obtener todas las empresas del usuario ordenadas por fecha de creación
    const empresas = await prisma.empresa.findMany({
      where: { usuarioId: payload.userId },
      orderBy: { createdAt: 'asc' }
    });

    // Encontrar el índice de esta empresa (empezando desde 01)
    const empresaNumero = empresas.findIndex(e => e.id === empresaId) + 1;
    const empresaPrefix = empresaNumero.toString().padStart(2, '0');

    // Buscar el último empleado de la empresa
    const ultimoEmpleado = await prisma.empleado.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });

    let numeroEmpleado = 1;
    
    if (ultimoEmpleado && ultimoEmpleado.codigo) {
      // Extraer el número del código anterior (últimos 5 dígitos)
      const match = ultimoEmpleado.codigo.match(/(\d{5})$/);
      if (match) {
        numeroEmpleado = parseInt(match[1]) + 1;
      }
    }

    const numeroEmpleadoStr = numeroEmpleado.toString().padStart(5, '0');
    const codigo = `${empresaPrefix}${numeroEmpleadoStr}`;

    return NextResponse.json({ codigo });
  } catch (error) {
    console.error('Error obteniendo siguiente código:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
