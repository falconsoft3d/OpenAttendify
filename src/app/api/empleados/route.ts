import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const empleadoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  dni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  empresaId: z.string().min(1, 'Debe seleccionar una empresa'),
});

// Función para generar el siguiente código de empleado
async function generateEmpleadoCodigo(empresaId: string): Promise<string> {
  // Buscar el último empleado de la empresa
  const ultimoEmpleado = await prisma.empleado.findFirst({
    where: { empresaId },
    orderBy: { codigo: 'desc' },
  });

  if (!ultimoEmpleado) {
    return '10001'; // Primer empleado de la empresa
  }

  // Incrementar el código
  const ultimoCodigo = parseInt(ultimoEmpleado.codigo);
  const nuevoCodigo = ultimoCodigo + 1;
  return nuevoCodigo.toString();
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const empleados = await prisma.empleado.findMany({
      where: {
        empresa: {
          usuarioId: payload.userId,
        },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        apellido: true,
        dni: true,
        email: true,
        telefono: true,
        cargo: true,
        fechaIngreso: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
        // No incluir password
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(empleados);
  } catch (error) {
    console.error('Error obteniendo empleados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = empleadoSchema.parse(body);

    // Verificar que la empresa pertenece al usuario
    const empresa = await prisma.empresa.findFirst({
      where: {
        id: validatedData.empresaId,
        usuarioId: payload.userId,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el DNI no exista
    const existingEmpleado = await prisma.empleado.findUnique({
      where: { dni: validatedData.dni },
    });

    if (existingEmpleado) {
      return NextResponse.json(
        { error: 'El DNI ya está registrado' },
        { status: 400 }
      );
    }

    // Generar código de empleado
    const codigo = await generateEmpleadoCodigo(validatedData.empresaId);

    // Hashear la contraseña (ahora es requerida)
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const empleado = await prisma.empleado.create({
      data: {
        nombre: validatedData.nombre,
        apellido: validatedData.apellido,
        dni: validatedData.dni,
        email: validatedData.email || null,
        telefono: validatedData.telefono || null,
        cargo: validatedData.cargo || null,
        empresaId: validatedData.empresaId,
        codigo,
        password: hashedPassword,
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // No devolver la contraseña en la respuesta
    const { password, ...empleadoSinPassword } = empleado;

    return NextResponse.json(empleadoSinPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creando empleado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
