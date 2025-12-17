import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const proyectoSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  empresaId: z.string().min(1, 'Debe seleccionar una empresa'),
});

// GET - Obtener todos los proyectos
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

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresaId');
    const activo = searchParams.get('activo');

    // Construir filtros
    const where: any = {};

    // Filtrar por empresas del usuario
    const empresasUsuario = await prisma.empresa.findMany({
      where: { usuarioId: payload.userId },
      select: { id: true }
    });

    const empresaIds = empresasUsuario.map(e => e.id);
    where.empresaId = { in: empresaIds };

    // Filtrar por empresa específica
    if (empresaId) {
      where.empresaId = empresaId;
    }

    // Filtrar por activo
    if (activo !== null && activo !== 'todos') {
      where.activo = activo === 'true';
    }

    const proyectos = await prisma.proyecto.findMany({
      where,
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(proyectos);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo proyecto
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
    const validatedData = proyectoSchema.parse(body);

    // Verificar que la empresa pertenezca al usuario
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: validatedData.empresaId,
        usuarioId: payload.userId,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada o no autorizada' },
        { status: 403 }
      );
    }

    // Verificar que el código no exista
    const codigoExiste = await prisma.proyecto.findUnique({
      where: { codigo: validatedData.codigo },
    });

    if (codigoExiste) {
      return NextResponse.json(
        { error: 'Ya existe un proyecto con este código' },
        { status: 400 }
      );
    }

    const proyecto = await prisma.proyecto.create({
      data: {
        codigo: validatedData.codigo,
        nombre: validatedData.nombre,
        empresaId: validatedData.empresaId,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          }
        }
      }
    });

    return NextResponse.json(proyecto, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
