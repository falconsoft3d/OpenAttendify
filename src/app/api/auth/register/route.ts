import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  pais: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos
    const validatedData = registerSchema.parse(body);

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
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Generar código único para el empleado
    const ultimoEmpleado = await prisma.empleado.findFirst({
      orderBy: { codigo: 'desc' },
    });
    
    let nuevoCodigo = '10001'; // Código inicial
    if (ultimoEmpleado) {
      const ultimoNumero = parseInt(ultimoEmpleado.codigo);
      nuevoCodigo = (ultimoNumero + 1).toString();
    }

    // Generar DNI temporal único basado en timestamp y random
    const dniTemporal = `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Crear usuario, empresa y empleado en una transacción
    const usuario = await prisma.usuario.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        nombre: validatedData.nombre,
        pais: validatedData.pais || null,
        rol: 'ADMIN', // Por defecto los usuarios son admins
        empresas: {
          create: {
            nombre: `Empresa de ${validatedData.nombre}`,
            email: validatedData.email,
            empleados: {
              create: {
                codigo: nuevoCodigo,
                nombre: validatedData.nombre,
                apellido: '', // Se puede actualizar después
                dni: dniTemporal, // DNI temporal único
                password: hashedPassword, // Misma contraseña del usuario
                email: validatedData.email,
                cargo: 'Administrador',
                activo: true,
              },
            },
          },
        },
      },
      include: {
        empresas: {
          include: {
            empleados: true,
          },
        },
      },
    });

    // Crear token
    const token = await signToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    console.log('✅ Usuario registrado:', usuario.email);
    console.log('✅ Empresa creada:', usuario.empresas[0]?.nombre);
    console.log('✅ Empleado creado con código:', usuario.empresas[0]?.empleados[0]?.codigo);

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
        empresa: usuario.empresas[0] ? {
          id: usuario.empresas[0].id,
          nombre: usuario.empresas[0].nombre,
        } : null,
        empleado: usuario.empresas[0]?.empleados[0] ? {
          id: usuario.empresas[0].empleados[0].id,
          codigo: usuario.empresas[0].empleados[0].codigo,
          nombre: usuario.empresas[0].empleados[0].nombre,
        } : null,
      },
      { status: 201 }
    );

    // Establecer cookie con el token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
