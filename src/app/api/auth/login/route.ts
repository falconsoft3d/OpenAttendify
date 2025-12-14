import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Request body recibido:', { email: body.email, remember: body.remember });
    
    // Validar datos
    const validatedData = loginSchema.parse(body);
    console.log('✅ Datos validados correctamente');

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
    });

    console.log('🔍 Usuario encontrado:', usuario ? 'Sí' : 'No');

    if (!usuario) {
      console.log('❌ Usuario no existe en la base de datos');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    console.log('🔐 Verificando contraseña...');
    const passwordMatch = await bcrypt.compare(validatedData.password, usuario.password);
    console.log('🔐 Contraseña coincide:', passwordMatch);

    if (!passwordMatch) {
      console.log('❌ Contraseña incorrecta');
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Crear token
    const token = await signToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    console.log('✅ Login exitoso para:', usuario.email);
    console.log('🔑 Token generado');

    // Guardar sesión en la base de datos para respaldo
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (validatedData.remember ? 30 : 7));
    
    await prisma.sesion.create({
      data: {
        usuarioId: usuario.id,
        email: usuario.email,
        token,
        remember: validatedData.remember || false,
        expiresAt,
      },
    });
    
    console.log('💾 Sesión guardada en base de datos');

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
        },
      },
      { status: 200 }
    );

    // Establecer cookie con el token
    // Si remember es true: 30 días, si no: 7 días
    const maxAge = validatedData.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // Forzar false para desarrollo local
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    console.log('🍪 Cookie establecida con configuración:', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge,
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

    console.error('❌ Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
