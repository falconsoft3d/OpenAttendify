import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'tu-secret-key-super-segura');

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log('🛡️ Middleware ejecutándose para:', path);

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
    console.log('✅ Ruta pública, permitiendo acceso');
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
      const { payload } = await jwtVerify(empleadoToken, SECRET_KEY);
      
      if (payload.type !== 'empleado') {
        throw new Error('Token inválido');
      }

      console.log('✅ Acceso permitido al portal de empleado:', payload.codigo);
      return NextResponse.next();
    } catch (error) {
      console.log('❌ Token de empleado inválido, redirigiendo a login');
      const response = path.startsWith('/api/')
        ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        : NextResponse.redirect(new URL('/empleado/login', request.url));
      response.cookies.delete('empleado_token');
      return response;
    }
  }

  // Verificar el token en las rutas protegidas
  const token = request.cookies.get('token')?.value || '';
  console.log('🍪 Todas las cookies:', request.cookies.getAll());
  console.log('🍪 Token encontrado:', token ? `Sí (${token.substring(0, 20)}...)` : 'No');

  // Si no hay token, redirigir al login
  if (!token) {
    console.log('❌ No hay token, redirigiendo a login desde:', path);
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar si el token es válido
  const payload = await verifyToken(token);
  console.log('🔐 Token válido:', payload ? `Sí (user: ${payload.email})` : 'No');
  
  if (!payload) {
    console.log('❌ Token inválido, redirigiendo a login y eliminando cookie');
    const response = path.startsWith('/api/') 
      ? NextResponse.json({ error: 'Token inválido' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  console.log('✅ Acceso permitido al dashboard para:', payload.email);
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
