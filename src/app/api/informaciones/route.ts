import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const informacionSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  clasificacion: z.enum(['INFORMATIVA', 'ALERTA', 'OTRAS']),
});

// Función para generar la siguiente secuencia
async function generateSecuencia(usuarioId: string): Promise<string> {
  const ultimaInformacion = await prisma.informacion.findFirst({
    where: { usuarioId },
    orderBy: { createdAt: 'desc' },
  });

  let numeroSecuencia = 1;
  
  if (ultimaInformacion && ultimaInformacion.secuencia) {
    const match = ultimaInformacion.secuencia.match(/INF-(\d{3})$/);
    if (match) {
      numeroSecuencia = parseInt(match[1]) + 1;
    }
  }

  return `INF-${numeroSecuencia.toString().padStart(3, '0')}`;
}

// GET - Obtener todas las informaciones
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
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

    const informaciones = await prisma.informacion.findMany({
      where: { usuarioId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ informaciones });
  } catch (error) {
    console.error('Error obteniendo informaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva información
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
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
    const validatedData = informacionSchema.parse(body);

    // Generar secuencia
    const secuencia = await generateSecuencia(payload.userId);

    // Crear información
    const informacion = await prisma.informacion.create({
      data: {
        secuencia,
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        clasificacion: validatedData.clasificacion,
        usuarioId: payload.userId,
      },
    });

    return NextResponse.json(informacion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creando información:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
