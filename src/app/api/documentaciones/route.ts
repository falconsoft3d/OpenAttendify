import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validación
const documentacionSchema = z.object({
  empleadoId: z.string().min(1, 'El empleado es requerido'),
  nombreArchivo: z.string().min(1, 'El nombre del archivo es requerido'),
  archivoBase64: z.string().min(1, 'El archivo es requerido'),
  mimeType: z.string().min(1, 'El tipo de archivo es requerido'),
  fechaVencimiento: z.string().transform(str => new Date(str)),
  tipoDocumentacionId: z.string().optional(),
});

// GET - Obtener todas las documentaciones del usuario
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

    // Obtener las documentaciones con información del empleado
    const documentaciones = await prisma.documentacion.findMany({
      where: {
        usuarioId: usuarioId
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
          }
        },
        tipoDocumentacion: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documentaciones);
  } catch (error: any) {
    console.error('Error al obtener documentaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva documentación
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
    const validatedData = documentacionSchema.parse(body);

    // Verificar que el empleado pertenece a una empresa del usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: validatedData.empleadoId,
        empresa: {
          usuarioId: usuarioId
        }
      }
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Crear la documentación
    const documentacion = await prisma.documentacion.create({
      data: {
        empleadoId: validatedData.empleadoId,
        nombreArchivo: validatedData.nombreArchivo,
        archivoBase64: validatedData.archivoBase64,
        mimeType: validatedData.mimeType,
        fechaVencimiento: validatedData.fechaVencimiento,
        tipoDocumentacionId: validatedData.tipoDocumentacionId,
        usuarioId: usuarioId,
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
          }
        },
        tipoDocumentacion: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    return NextResponse.json(documentacion, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear documentación:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear documentación' },
      { status: 500 }
    );
  }
}
