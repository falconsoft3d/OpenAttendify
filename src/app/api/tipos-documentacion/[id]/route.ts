import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validación
const tipoDocumentacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  activo: z.boolean().optional(),
});

// GET - Obtener un tipo de documentación específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Obtener el tipo de documentación
    const tipo = await prisma.tipoDocumentacion.findFirst({
      where: {
        id: params.id,
        usuarioId: usuarioId
      }
    });

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de documentación no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(tipo);
  } catch (error: any) {
    console.error('Error al obtener tipo de documentación:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipo de documentación' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un tipo de documentación
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Verificar que el tipo existe y pertenece al usuario
    const tipoExistente = await prisma.tipoDocumentacion.findFirst({
      where: {
        id: params.id,
        usuarioId: usuarioId
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { error: 'Tipo de documentación no encontrado' },
        { status: 404 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const validatedData = tipoDocumentacionSchema.parse(body);

    // Actualizar el tipo de documentación
    const tipo = await prisma.tipoDocumentacion.update({
      where: { id: params.id },
      data: {
        nombre: validatedData.nombre,
        activo: validatedData.activo,
      }
    });

    return NextResponse.json(tipo);
  } catch (error: any) {
    console.error('Error al actualizar tipo de documentación:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar tipo de documentación' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un tipo de documentación
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const usuarioId = payload.userId as string;

    // Verificar que el tipo existe y pertenece al usuario
    const tipo = await prisma.tipoDocumentacion.findFirst({
      where: {
        id: params.id,
        usuarioId: usuarioId
      }
    });

    if (!tipo) {
      return NextResponse.json(
        { error: 'Tipo de documentación no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el tipo de documentación
    await prisma.tipoDocumentacion.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Tipo de documentación eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar tipo de documentación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tipo de documentación' },
      { status: 500 }
    );
  }
}
