import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schema de validación para actualizar usuario
const updateUsuarioSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(['ADMIN', 'USUARIO']).optional(),
  avatarUrl: z.string().optional().or(z.literal('')),
  loginEmpleadosExterno: z.boolean().optional(),
});

// GET: Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        avatarUrl: true,
        loginEmpleadosExterno: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            empresas: true,
          }
        }
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUsuarioSchema.parse(body);

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está actualizando el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailInUse = await prisma.usuario.findUnique({
        where: { email: validatedData.email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      ...(validatedData.email && { email: validatedData.email }),
      ...(validatedData.nombre && { nombre: validatedData.nombre }),
      ...(validatedData.rol && { rol: validatedData.rol }),
      ...(validatedData.loginEmpleadosExterno !== undefined && { 
        loginEmpleadosExterno: validatedData.loginEmpleadosExterno 
      }),
    };

    // Actualizar avatarUrl si se proporciona
    if (validatedData.avatarUrl !== undefined) {
      updateData.avatarUrl = validatedData.avatarUrl || null;
    }

    // Hash de la contraseña si se proporciona
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        avatarUrl: true,
        loginEmpleadosExterno: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(usuario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el usuario no se esté eliminando a sí mismo
    if (decoded.userId === params.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const existingUser = await prisma.usuario.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar usuario
    await prisma.usuario.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
