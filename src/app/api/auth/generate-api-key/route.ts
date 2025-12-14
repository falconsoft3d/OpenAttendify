import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'tu-secret-key-super-segura');

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const usuarioId = payload.userId as string;

    // Obtener nombre de la key del body
    const body = await request.json();
    const nombre = body.nombre || 'API Key';

    // Generar API Key única (32 caracteres hex)
    const apiKey = `oatt_${crypto.randomBytes(32).toString('hex')}`;

    // Crear nueva API Key
    const newKey = await prisma.apiKey.create({
      data: {
        usuarioId,
        nombre,
        key: apiKey,
      },
    });

    return NextResponse.json(
      { 
        message: 'API Key generada exitosamente',
        apiKey: {
          id: newKey.id,
          nombre: newKey.nombre,
          key: newKey.key,
          createdAt: newKey.createdAt,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al generar API Key:', error);
    return NextResponse.json(
      { error: 'Error al generar API Key' },
      { status: 500 }
    );
  }
}
