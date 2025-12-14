import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { loginEmpleadosExterno: true }
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ loginEmpleadosExterno: usuario.loginEmpleadosExterno });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const body = await request.json();
    const { loginEmpleadosExterno } = body;

    if (typeof loginEmpleadosExterno !== 'boolean') {
      return NextResponse.json(
        { error: 'loginEmpleadosExterno debe ser boolean' },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: { loginEmpleadosExterno },
      select: { loginEmpleadosExterno: true }
    });

    return NextResponse.json({ loginEmpleadosExterno: usuario.loginEmpleadosExterno });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
