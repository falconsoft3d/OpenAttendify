import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

export async function POST(request: NextRequest) {
  try {
    // Verificar token
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    let payload;
    try {
      const { payload: decoded } = await jwtVerify(token, SECRET_KEY);
      payload = decoded;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener el userId del token
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener la imagen del body
    const body = await request.json();
    const { avatarUrl } = body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return NextResponse.json(
        { error: 'URL de avatar inválida' },
        { status: 400 }
      );
    }

    // Validar que sea una URL válida o data URL
    if (!avatarUrl.startsWith('http://') && 
        !avatarUrl.startsWith('https://') && 
        !avatarUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'URL de avatar inválida. Debe ser una URL http/https o data URL' },
        { status: 400 }
      );
    }

    // Actualizar el usuario con la nueva imagen
    const updatedUser = await prisma.usuario.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      message: 'Avatar actualizado correctamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar avatar:', error);
    return NextResponse.json(
      { error: 'Error al actualizar avatar' },
      { status: 500 }
    );
  }
}
