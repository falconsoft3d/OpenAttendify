import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password } = body;

    // Validaciones
    if (!password) {
      return NextResponse.json(
        { error: 'Debes proporcionar tu contraseña' },
        { status: 400 }
      );
    }

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.userId },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 400 }
      );
    }

    // Eliminar usuario (esto eliminará en cascada todas las empresas, empleados y asistencias)
    await prisma.usuario.delete({
      where: { id: usuario.id },
    });

    console.log('✅ Cuenta eliminada:', usuario.email);

    // Eliminar cookie de autenticación
    const response = NextResponse.json(
      { message: 'Cuenta eliminada exitosamente' },
      { status: 200 }
    );

    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('❌ Error al eliminar cuenta:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la cuenta' },
      { status: 500 }
    );
  }
}
