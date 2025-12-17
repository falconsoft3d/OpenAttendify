import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET - Obtener configuración del usuario
export async function GET(request: NextRequest) {
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

    // Buscar o crear configuración
    let configuracion = await prisma.configuracion.findUnique({
      where: { usuarioId: payload.userId }
    });

    // Si no existe, crear una con valores por defecto
    if (!configuracion) {
      configuracion = await prisma.configuracion.create({
        data: {
          usuarioId: payload.userId,
          usarProyectosAsistencia: false,
        }
      });
    }

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración
export async function PUT(request: NextRequest) {
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

    // Actualizar o crear configuración
    const configuracion = await prisma.configuracion.upsert({
      where: { usuarioId: payload.userId },
      update: {
        usarProyectosAsistencia: body.usarProyectosAsistencia ?? false,
      },
      create: {
        usuarioId: payload.userId,
        usarProyectosAsistencia: body.usarProyectosAsistencia ?? false,
      }
    });

    return NextResponse.json(configuracion);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
