import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo-en-produccion'
);

export async function POST(request: NextRequest) {
  try {
    // Verificar API Key en el header
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key requerida. Incluya el header X-API-Key' },
        { status: 401 }
      );
    }

    // Verificar que la API Key existe y está activa
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        usuario: {
          select: {
            id: true,
            loginEmpleadosExterno: true
          }
        }
      }
    });

    if (!apiKeyRecord || !apiKeyRecord.activa) {
      return NextResponse.json(
        { error: 'API Key inválida o inactiva' },
        { status: 401 }
      );
    }

    // Verificar que el usuario tiene habilitado el login de empleados externo
    if (!apiKeyRecord.usuario.loginEmpleadosExterno) {
      return NextResponse.json(
        { error: 'Login de empleados desde apps externas no está habilitado. Active esta opción en el panel de integraciones.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { codigo, password } = body;

    if (!codigo || !password) {
      return NextResponse.json(
        { error: 'Código y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar empleado por código o DNI
    const empleado = await prisma.empleado.findFirst({
      where: {
        OR: [
          { codigo: codigo },
          { dni: codigo }
        ],
        activo: true
      },
      include: {
        empresa: {
          select: {
            id: true,
            nombre: true,
            usuarioId: true
          }
        }
      }
    });

    if (!empleado) {
      return NextResponse.json(
        { error: 'Empleado no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Verificar que el empleado pertenece al usuario dueño de la API Key
    if (empleado.empresa.usuarioId !== apiKeyRecord.usuarioId) {
      return NextResponse.json(
        { error: 'No autorizado para acceder a este empleado' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    if (!empleado.password) {
      return NextResponse.json(
        { error: 'Este empleado no tiene contraseña configurada' },
        { status: 400 }
      );
    }

    const passwordValida = await bcrypt.compare(password, empleado.password);

    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Actualizar último uso de la API Key
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { ultimoUso: new Date() }
    });

    // Generar token JWT para el empleado
    const token = await new SignJWT({
      empleadoId: empleado.id,
      codigo: empleado.codigo,
      empresaId: empleado.empresa.id,
      type: 'empleado'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      empleado: {
        id: empleado.id,
        codigo: empleado.codigo,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        dni: empleado.dni,
        email: empleado.email,
        cargo: empleado.cargo,
        empresa: {
          id: empleado.empresa.id,
          nombre: empleado.empresa.nombre
        }
      }
    });
  } catch (error) {
    console.error('Error en login de empleado externo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
