# Fix: Error de Verificación de Firma JWT

## Problema
```
Error al obtener configuración: m: signature verification failed
code: 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'
```

## Causa
El error ocurría porque diferentes archivos usaban claves secretas por defecto **diferentes** para firmar y verificar tokens JWT:
- `jwt.ts` usaba: `'tu-clave-secreta-muy-segura'`
- `config/route.ts` usaba: `'tu-secreto-super-seguro-cambialo-en-produccion'`
- Otros archivos usaban: `'tu-secret-key-super-segura'`

Cuando el token se generaba con una clave y se verificaba con otra, fallaba la verificación.

## Solución Implementada

### 1. Centralización del JWT_SECRET
Se exportó `JWT_SECRET` desde `src/lib/jwt.ts` para usar una única fuente de verdad:

```typescript
// src/lib/jwt.ts
export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secret-key-super-segura-cambiala-en-produccion'
);
```

### 2. Actualización de Archivos
Se actualizaron **TODOS** los archivos que usaban JWT para importar y usar el `JWT_SECRET` centralizado:

**Archivos actualizados:**
- ✅ `src/lib/jwt.ts` - Exporta JWT_SECRET
- ✅ `src/middleware.ts`
- ✅ `src/app/api/auth/config/route.ts`
- ✅ `src/app/api/auth/api-keys/route.ts`
- ✅ `src/app/api/auth/api-keys/[id]/route.ts`
- ✅ `src/app/api/auth/generate-api-key/route.ts`
- ✅ `src/app/api/auth/upload-avatar/route.ts`
- ✅ `src/app/api/empleado/login/route.ts`
- ✅ `src/app/api/empleado/me/route.ts`
- ✅ `src/app/api/empleado/asistencia/route.ts`

## Configuración en Producción (AWS Lambda)

### ⚠️ CRÍTICO: Variable de Entorno
Para que funcione correctamente en producción, **DEBES** configurar la variable de entorno `JWT_SECRET` en AWS Lambda:

```bash
JWT_SECRET=openattendify-jwt-secret-key-2025-super-secure-production
```

### Pasos para Configurar en AWS Lambda:

1. **Via AWS Console:**
   - Ve a AWS Lambda → Tu función
   - Configuration → Environment variables
   - Añadir: `JWT_SECRET` = `openattendify-jwt-secret-key-2025-super-secure-production`

2. **Via AWS CLI:**
   ```bash
   aws lambda update-function-configuration \
     --function-name tu-funcion-name \
     --environment "Variables={JWT_SECRET=openattendify-jwt-secret-key-2025-super-secure-production}"
   ```

3. **Via Terraform/CDK/SST:**
   ```typescript
   environment: {
     JWT_SECRET: process.env.JWT_SECRET || "openattendify-jwt-secret-key-2025-super-secure-production"
   }
   ```

### Verificación
Después de configurar la variable de entorno:
1. Despliega la aplicación
2. Genera un nuevo token (login)
3. Prueba el endpoint `/api/auth/config` - debería funcionar sin errores

## Beneficios
✅ Consistencia: Todos los archivos usan la misma clave JWT
✅ Mantenibilidad: Un solo lugar para cambiar la configuración
✅ Seguridad: Fácil de actualizar la clave en producción
✅ Debugging: Errores más claros si falta la variable de entorno

## Notas Adicionales
- El valor por defecto es solo para desarrollo local
- En producción, **SIEMPRE** usa una clave fuerte y única
- Considera rotar la clave JWT periódicamente
- Si cambias JWT_SECRET, todos los tokens existentes se invalidarán
