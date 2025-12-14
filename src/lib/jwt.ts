import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-clave-secreta-muy-segura'
);

export interface TokenPayload {
  userId: string;
  email: string;
  rol: string;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  console.log('🔐 Generando token con payload:', payload);
  
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  console.log('✅ Token generado (primeros 20 chars):', token.substring(0, 20));
  
  return token;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('❌ Error al verificar token:', error instanceof Error ? error.message : error);
    return null;
  }
}
