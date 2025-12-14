import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const empleadoSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  dni: z.string().min(8, 'El DNI debe tener al menos 8 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  cargo: z.string().optional(),
  empresaId: z.string(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el empleado pertenece al usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: id,
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

    const body = await request.json();
    const validatedData = empleadoSchema.parse(body);

    // Si se proporciona un código, verificar que no esté en uso por otro empleado
    if (validatedData.codigo && validatedData.codigo !== empleado.codigo) {
      const codigoExistente = await prisma.empleado.findUnique({
        where: { codigo: validatedData.codigo },
      });

      if (codigoExistente) {
        return NextResponse.json(
          { error: 'El código ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Preparar datos para actualizar
    const updateData: any = { ...validatedData };

    // Si se proporciona una nueva contraseña, hashearla
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    } else {
      // Si no se proporciona contraseña, no actualizar ese campo
      delete updateData.password;
    }

    const updatedEmpleado = await prisma.empleado.update({
      where: { id: id },
      data: updateData,
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
    });

    return NextResponse.json(updatedEmpleado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error actualizando empleado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el empleado pertenece al usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: id,
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

    await prisma.empleado.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el empleado pertenece al usuario
    const empleado = await prisma.empleado.findFirst({
      where: {
        id: id,
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

    const body = await request.json();

    const updatedEmpleado = await prisma.empleado.update({
      where: { id: id },
      data: body,
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
    });

    return NextResponse.json(updatedEmpleado);
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
