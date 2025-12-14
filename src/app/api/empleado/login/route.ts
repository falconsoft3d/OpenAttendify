import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { JWT_SECRET } from '@/lib/jwt';

async function createEmpleadoToken(empleadoId: string, codigo: string): Promise<string> {
  const token = await new SignJWT({ empleadoId, codigo, type: 'empleado' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, password } = body;

    if (!codigo || !password) {
      return NextResponse.json(
        { error: 'Código y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar empleado por código
    const empleado = await prisma.empleado.findUnique({
      where: { codigo },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Código o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar si el empleado está activo
    if (!empleado.activo) {
      return NextResponse.json(
        { error: 'Tu cuenta está inactiva. Contacta a tu supervisor' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    if (!empleado.password) {
      return NextResponse.json(
        { error: 'No tienes contraseña configurada. Contacta a tu supervisor' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, empleado.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Código o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Crear token
    const token = await createEmpleadoToken(empleado.id, empleado.codigo);

    console.log('✅ Empleado autenticado:', empleado.codigo, empleado.nombre);

    const response = NextResponse.json(
      {
        success: true,
        empleado: {
          id: empleado.id,
          codigo: empleado.codigo,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          cargo: empleado.cargo,
          empresa: empleado.empresa.nombre,
        },
      },
      { status: 200 }
    );

    // Establecer cookie con el token
    response.cookies.set('empleado_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ Error en login de empleado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
