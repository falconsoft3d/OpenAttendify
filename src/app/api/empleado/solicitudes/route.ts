import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/jwt';
import { z } from 'zod';

const solicitudSchema = z.object({
  fecha: z.string(),
  texto: z.string().min(1, 'El texto es requerido'),
  valor: z.union([z.number(), z.string()]).transform((val) => {
    if (val === '' || val === null || val === undefined) return 0;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) {
      throw new Error('El valor debe ser un número mayor o igual a cero');
    }
    return num;
  }).optional(),
});

// GET - Obtener solicitudes del empleado
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;

    // Obtener solicitudes del empleado
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        empleadoId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convertir valores Decimal a number
    const solicitudesFormateadas = solicitudes.map(sol => ({
      ...sol,
      valor: typeof sol.valor === 'object' ? parseFloat(sol.valor.toString()) : sol.valor,
    }));

    return NextResponse.json({ solicitudes: solicitudesFormateadas }, { status: 200 });
  } catch (error) {
    console.error('❌ Error al obtener solicitudes:', error);
    return NextResponse.json(
      { error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('empleado_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== 'empleado') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const empleadoId = payload.empleadoId as string;

    // Obtener empleado con su empresa
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId },
      include: {
        empresa: {
          include: {
            usuario: true,
          },
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = solicitudSchema.parse(body);

    // Generar secuencia
    const ultimaSolicitud = await prisma.solicitud.findFirst({
      where: {
        empleado: {
          empresa: {
            usuarioId: empleado.empresa.usuarioId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let numeroSecuencia = 1;
    if (ultimaSolicitud && ultimaSolicitud.secuencia) {
      const match = ultimaSolicitud.secuencia.match(/SOL-(\d{5})$/);
      if (match) {
        numeroSecuencia = parseInt(match[1]) + 1;
      }
    }

    const secuencia = `SOL-${numeroSecuencia.toString().padStart(5, '0')}`;

    // Crear solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        secuencia,
        empleadoId,
        fecha: new Date(validatedData.fecha),
        texto: validatedData.texto,
        valor: validatedData.valor ?? 0,
        estado: 'SOLICITADO',
      },
    });

    return NextResponse.json(solicitud, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error de validación:', error.errors);
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.errors.map(err => ({
            campo: err.path.join('.'),
            mensaje: err.message
          }))
        },
        { status: 400 }
      );
    }
    console.error('❌ Error al crear solicitud:', error);
    return NextResponse.json(
      { error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}
