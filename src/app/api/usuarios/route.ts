import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Schema de validación para crear/actualizar usuario
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(['ADMIN', 'USUARIO']),
  avatarUrl: z.string().optional().or(z.literal('')),
  loginEmpleadosExterno: z.boolean().default(false),
});

// GET: Obtener todos los usuarios
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener todos los usuarios
    const usuarios = await prisma.usuario.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo usuario
export async function POST(request: NextRequest) {
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
    const validatedData = usuarioSchema.parse(body);

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = validatedData.password 
      ? await bcrypt.hash(validatedData.password, 10)
      : await bcrypt.hash('123456', 10); // Contraseña por defecto

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email: validatedData.email,
        nombre: validatedData.nombre,
        password: hashedPassword,
        rol: validatedData.rol,
        avatarUrl: validatedData.avatarUrl || null,
        loginEmpleadosExterno: validatedData.loginEmpleadosExterno,
      },
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

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
