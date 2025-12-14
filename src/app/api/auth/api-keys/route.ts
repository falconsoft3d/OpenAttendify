import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';

// Listar API Keys del usuario
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const usuarioId = payload.userId as string;

    const apiKeys = await prisma.apiKey.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        key: true,
        activa: true,
        ultimoUso: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener API Keys:', error);
    return NextResponse.json(
      { error: 'Error al obtener API Keys' },
      { status: 500 }
    );
  }
}
