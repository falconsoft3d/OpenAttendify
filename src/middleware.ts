import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, JWT_SECRET } from '@/lib/jwt';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const isPublicPath = path === '/' || 
                       path === '/login' || 
                       path === '/registro' ||
                       path.startsWith('/api/auth/login') ||
                       path.startsWith('/api/auth/register') ||
                       path.startsWith('/api/auth/logout');

  // Rutas públicas del portal de empleados
  const isEmpleadoPublicPath = path === '/empleado/login' ||
                               path.startsWith('/api/empleado/login') ||
                               path.startsWith('/api/empleado/logout');

  // Si es una ruta pública, permitir acceso
  if (isPublicPath || isEmpleadoPublicPath) {
    return NextResponse.next();
  }

  // Rutas del portal de empleados (requieren token de empleado)
  // Verificación específica para evitar conflicto con /api/empleados (admin API)
  const isEmpleadoPath = path.startsWith('/empleado/') || 
                         path === '/empleado' ||
                         path.startsWith('/api/empleado/');

  if (isEmpleadoPath) {
    const empleadoToken = request.cookies.get('empleado_token')?.value;
    
    if (!empleadoToken) {
      console.log('❌ No hay token de empleado, redirigiendo a login');
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/empleado/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(empleadoToken, JWT_SECRET);
      
      if (payload.type !== 'empleado') {
        throw new Error('Token inválido');
      }

      
      return NextResponse.next();
    } catch (error) {
      
      const response = path.startsWith('/api/')
        ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        : NextResponse.redirect(new URL('/empleado/login', request.url));
      response.cookies.delete('empleado_token');
      return response;
    }
  }

  // Verificar el token en las rutas protegidas
  const token = request.cookies.get('token')?.value || '';
  // Si no hay token, redirigir al login
  if (!token) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar si el token es válido
  const payload = await verifyToken(token);
  
  if (!payload) {
    const response = path.startsWith('/api/') 
      ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  
  // Si todo está bien, continuar
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/empleado/:path*',
    '/api/:path*',
  ],
};
