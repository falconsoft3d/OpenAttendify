import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const solicitudSchema = z.object({
  empleadoId: z.string().min(1, 'Debe seleccionar un empleado'),
  fecha: z.string(),
  texto: z.string().min(1, 'El texto es requerido'),
  valor: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) {
      throw new Error('El valor debe ser un número mayor o igual a cero');
    }
    return num;
  }),
  estado: z.enum(['SOLICITADO', 'APROBADO', 'RECHAZADO']).optional(),
});

// Función para generar la siguiente secuencia
async function generateSecuencia(usuarioId: string): Promise<string> {
  // Obtener todas las solicitudes de las empresas del usuario
  const ultimaSolicitud = await prisma.solicitud.findFirst({
    where: {
      empleado: {
        empresa: {
          usuarioId,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let numeroSecuencia = 1;
  
  if (ultimaSolicitud && ultimaSolicitud.secuencia) {
    // Extraer el número de la secuencia (SOL-00001 -> 1)
    const match = ultimaSolicitud.secuencia.match(/SOL-(\d{5})$/);
    if (match) {
      numeroSecuencia = parseInt(match[1]) + 1;
    }
  }

  return `SOL-${numeroSecuencia.toString().padStart(5, '0')}`;
}

// GET - Obtener todas las solicitudes
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

    const solicitudes = await prisma.solicitud.findMany({
      where: {
        empleado: {
          empresa: {
            usuarioId: payload.userId,
          },
        },
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    // Convertir valores Decimal a number
    const solicitudesFormateadas = solicitudes.map(sol => ({
      ...sol,
      valor: typeof sol.valor === 'object' ? parseFloat(sol.valor.toString()) : sol.valor,
    }));

    return NextResponse.json({ solicitudes: solicitudesFormateadas });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva solicitud
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
    console.log('📝 Body recibido:', JSON.stringify(body, null, 2));
    
    const validatedData = solicitudSchema.parse(body);
    console.log('✅ Datos validados:', JSON.stringify(validatedData, null, 2));

    // Verificar que el empleado pertenece al usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: validatedData.empleadoId,
        empresa: {
          usuarioId: payload.userId,
        },
      },
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado' },
        { status: 404 }
      );
    }

    // Generar secuencia
    const secuencia = await generateSecuencia(payload.userId);

    // Crear solicitud
    const solicitud = await prisma.solicitud.create({
      data: {
        secuencia,
        empleadoId: validatedData.empleadoId,
        fecha: new Date(validatedData.fecha),
        texto: validatedData.texto,
        valor: validatedData.valor,
        estado: validatedData.estado || 'SOLICITADO',
      },
      include: {
        empleado: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            apellido: true,
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    // Convertir valores Decimal a number
    const solicitudFormateada = {
      ...solicitud,
      valor: typeof solicitud.valor === 'object' ? parseFloat(solicitud.valor.toString()) : solicitud.valor,
    };

    return NextResponse.json(solicitudFormateada, { status: 201 });
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
    console.error('Error creando solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
