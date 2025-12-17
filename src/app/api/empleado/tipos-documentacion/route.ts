import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';

const prisma = new PrismaClient();

// GET - Obtener los tipos de documentación que el empleado debe tener
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

    // Obtener todos los tipos de documentación activos del usuario
    const tiposDocumentacion = await prisma.tipoDocumentacion.findMany({
      where: {
        usuarioId: empleado.empresa.usuarioId,
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // Obtener las documentaciones actuales del empleado
    const documentacionesEmpleado = await prisma.documentacion.findMany({
      where: {
        empleadoId: empleadoId
      },
      select: {
        tipoDocumentacionId: true,
        fechaVencimiento: true,
        id: true
      }
    });

    // Crear un mapa para verificar qué tipos tiene el empleado
    const tiposConDocumento = tiposDocumentacion.map(tipo => {
      const documentos = documentacionesEmpleado.filter(
        doc => doc.tipoDocumentacionId === tipo.id
      );
      
      // Si tiene documentos de este tipo, encontrar el más reciente
      const documentoActual = documentos.length > 0 
        ? documentos.reduce((prev, current) => 
            new Date(current.fechaVencimiento) > new Date(prev.fechaVencimiento) 
              ? current 
              : prev
          )
        : null;

      return {
        id: tipo.id,
        nombre: tipo.nombre,
        tiene: documentos.length > 0,
        cantidadDocumentos: documentos.length,
        documentoActual: documentoActual ? {
          id: documentoActual.id,
          fechaVencimiento: documentoActual.fechaVencimiento
        } : null
      };
    });

    return NextResponse.json(tiposConDocumento);
  } catch (error: any) {
    console.error('Error al obtener tipos de documentación:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de documentación' },
      { status: 500 }
    );
  }
}
