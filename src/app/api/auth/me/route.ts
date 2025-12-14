import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      console.log('❌ /api/auth/me - No hay token');
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      console.log('❌ /api/auth/me - Token inválido');
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    console.log('✅ /api/auth/me - ', payload.email);

    // Obtener información actualizada del usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        avatarUrl: true,
      },
    });

    if (!usuario) {
      console.log('❌ /api/auth/me - Usuario no encontrado');
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ /api/auth/me - Usuario encontrado:', usuario.email);
    return NextResponse.json({ user: usuario }, { status: 200 });
  } catch (error) {
    console.error('❌ Error en /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
