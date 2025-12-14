import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'No autenticado' 
      }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ 
        success: false,
        error: 'Token inválido' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { url, puerto, database, usuario, contrasena, companiaId } = body;

    if (!url || !puerto || !database || !usuario || !contrasena || !companiaId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Faltan datos de configuración' 
        },
        { status: 400 }
      );
    }

    // Construir la URL completa de Odoo
    const odooUrl = `${url}:${puerto}`;
    console.log('🔍 Probando conexión a Odoo:', odooUrl);

    // Probar la conexión con Odoo usando JSON-RPC
    try {
      // 1. Autenticar usuario usando JSON-RPC
      const authResponse = await fetch(`${odooUrl}/jsonrpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            service: 'common',
            method: 'authenticate',
            args: [database, usuario, contrasena, {}],
          },
          id: 1,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!authResponse.ok) {
        return NextResponse.json(
          { 
            success: false, 
            error: `No se pudo conectar a Odoo. Código: ${authResponse.status}. Verifica la URL y el puerto.` 
          },
          { status: 200 }
        );
      }

      const authData = await authResponse.json();

      if (authData.error || !authData.result) {
        console.log('❌ Error de autenticación:', authData.error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Credenciales inválidas. Verifica el usuario, contraseña y base de datos.' 
          },
          { status: 200 }
        );
      }

      const uid = authData.result;
      console.log('✅ Autenticación exitosa, UID:', uid);

      // 2. Verificar ID de compañía
      const companyId = parseInt(companiaId);
      if (isNaN(companyId)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'ID de compañía inválido' 
          },
          { status: 200 }
        );
      }

      // Conexión exitosa
      console.log('✅ Conexión exitosa con Odoo');
      return NextResponse.json(
        { 
          success: true, 
          message: '✅ Conexión exitosa con Odoo',
          details: {
            version: 'JSON-RPC',
            userId: uid,
            userName: usuario,
            companyId: companyId,
          }
        },
        { status: 200 }
      );

    } catch (fetchError: any) {
      console.error('❌ Error de fetch:', fetchError);
      
      // Timeout
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tiempo de espera agotado (10s). El servidor Odoo no responde o la URL es incorrecta.' 
          },
          { status: 200 }
        );
      }

      // Conexión rechazada
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Conexión rechazada. Verifica que Odoo esté ejecutándose en la URL y puerto especificados.' 
          },
          { status: 200 }
        );
      }

      // Servidor no encontrado
      if (fetchError.code === 'ENOTFOUND' || fetchError.cause?.code === 'ENOTFOUND') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Servidor no encontrado. Verifica la URL del servidor Odoo.' 
          },
          { status: 200 }
        );
      }

      // Error genérico de red
      return NextResponse.json(
        { 
          success: false, 
          error: `Error de conexión: ${fetchError.message || 'No se pudo conectar al servidor Odoo'}. Verifica que la URL sea correcta y el servidor esté accesible.` 
        },
        { status: 200 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error general al probar conexión Odoo:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Error inesperado: ${error.message || 'Error desconocido'}` 
      },
      { status: 200 }
    );
  }
}
