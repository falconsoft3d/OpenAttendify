import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validación
const tipoDocumentacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  activo: z.boolean().optional().default(true),
});

// GET - Obtener todos los tipos de documentación del usuario
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Obtener los tipos de documentación
    const tipos = await prisma.tipoDocumentacion.findMany({
      where: {
        usuarioId: usuarioId
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(tipos);
  } catch (error: any) {
    console.error('Error al obtener tipos de documentación:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de documentación' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo tipo de documentación
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Obtener datos del body
    const body = await request.json();
    const validatedData = tipoDocumentacionSchema.parse(body);

    // Crear el tipo de documentación
    const tipo = await prisma.tipoDocumentacion.create({
      data: {
        nombre: validatedData.nombre,
        activo: validatedData.activo,
        usuarioId: usuarioId,
      }
    });

    return NextResponse.json(tipo, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear tipo de documentación:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear tipo de documentación' },
      { status: 500 }
    );
  }
}
