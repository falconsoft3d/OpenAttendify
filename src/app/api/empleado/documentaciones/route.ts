import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validación
const documentacionSchema = z.object({
  nombreArchivo: z.string().min(1, 'El nombre del archivo es requerido'),
  archivoBase64: z.string().min(1, 'El archivo es requerido'),
  mimeType: z.string().min(1, 'El tipo de archivo es requerido'),
  fechaVencimiento: z.string().transform(str => new Date(str)),
  tipoDocumentacionId: z.string().optional(),
});

// GET - Obtener las documentaciones del empleado autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación del empleado
    const token = request.cookies.get('empleado_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const empleadoId = payload.empleadoId as string;

    // Obtener las documentaciones del empleado con información del tipo
    const documentaciones = await prisma.documentacion.findMany({
      where: {
        empleadoId: empleadoId
      },
      include: {
        tipoDocumentacion: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: {
        fechaVencimiento: 'asc'
      }
    });

    // Convertir a formato simple sin el base64 para reducir tamaño de respuesta
    const documentacionesSimplificadas = documentaciones.map(doc => ({
      id: doc.id,
      nombreArchivo: doc.nombreArchivo,
      mimeType: doc.mimeType,
      fechaVencimiento: doc.fechaVencimiento,
      createdAt: doc.createdAt,
      tipoDocumentacion: doc.tipoDocumentacion,
      tipoDocumentacionId: doc.tipoDocumentacionId,
    }));

    return NextResponse.json(documentacionesSimplificadas);
  } catch (error: any) {
    console.error('Error al obtener documentaciones del empleado:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva documentación (empleado sube su propio documento)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación del empleado
    const token = request.cookies.get('empleado_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    const empleadoId = payload.empleadoId as string;

    // Obtener el empleado y su empresa para saber qué usuario administra
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        empresa: {
          select: {
            usuarioId: true
          }
        }
      }
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Obtener datos del body
    const body = await request.json();
    const validatedData = documentacionSchema.parse(body);

    // Si se especifica un tipo, verificar que sea del usuario correcto
    if (validatedData.tipoDocumentacionId) {
      const tipo = await prisma.tipoDocumentacion.findFirst({
        where: {
          id: validatedData.tipoDocumentacionId,
          usuarioId: empleado.empresa.usuarioId,
          activo: true
        }
      });

      if (!tipo) {
        return NextResponse.json(
          { error: 'Tipo de documentación no válido' },
          { status: 400 }
        );
      }
    }

    // Crear la documentación
    const documentacion = await prisma.documentacion.create({
      data: {
        empleadoId: empleadoId,
        nombreArchivo: validatedData.nombreArchivo,
        archivoBase64: validatedData.archivoBase64,
        mimeType: validatedData.mimeType,
        fechaVencimiento: validatedData.fechaVencimiento,
        tipoDocumentacionId: validatedData.tipoDocumentacionId,
        usuarioId: empleado.empresa.usuarioId,
      },
      include: {
        tipoDocumentacion: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    // Devolver sin el base64 para reducir tamaño
    const { archivoBase64, ...documentacionSinBase64 } = documentacion;

    return NextResponse.json(documentacionSinBase64, { status: 201 });
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
