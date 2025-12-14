# Documentación de la API de OpenAttendify

Esta documentación describe cómo usar la API REST de OpenAttendify para integrar aplicaciones externas.

## 📋 Índice de Contenidos

1. [Autenticación](#autenticación)
2. [Endpoints Disponibles](#endpoints-disponibles)
   - [Login de Empleado (Apps Externas)](#1-login-de-empleado-apps-externas)
   - [Login de Empleado (Sistema Interno)](#2-login-de-empleado-sistema-interno)
   - [Registrar Asistencia](#3-registrar-asistencia)
   - [Consultar Asistencias](#4-consultar-asistencias)
3. [Códigos de Error](#códigos-de-error)
4. [Ejemplos Completos](#ejemplos-completos)

## Autenticación

Todas las peticiones a la API requieren una **API Key** que se genera en el panel de integraciones.

La API Key debe enviarse en el header `X-API-Key` de cada petición:

```
X-API-Key: oatt_tu-api-key-aquí
```

## Obtener tu API Key

1. Inicia sesión en OpenAttendify como administrador
2. Ve a **Dashboard → Integraciones**
3. En la sección "API Keys para Aplicaciones Externas":
   - Haz clic en "Nueva API Key"
   - Dale un nombre descriptivo (ej: "App Móvil", "Sistema RH")
   - Copia la API Key generada (comienza con `oatt_`)
4. **Importante:** Activa la opción "Permitir login de empleados desde aplicaciones externas" si deseas que los empleados puedan autenticarse

## 🔒 Seguridad

- **Nunca** compartas tus API Keys públicamente
- **Nunca** incluyas las API Keys en el código del cliente
- Usa las API Keys solo en el servidor o backend
- Puedes desactivar o eliminar una API Key en cualquier momento
- Las API Keys inactivas no funcionarán

---

## Endpoints Disponibles

### 1. Login de Empleado (Apps Externas)

Autentica un empleado usando su código/DNI y contraseña. **Este endpoint requiere que la configuración "Permitir login de empleados desde aplicaciones externas" esté activada.**

**Endpoint:** `POST /api/auth/external/empleado`

**Base URL:** `https://tu-dominio.com` o `http://localhost:3000` (desarrollo)

**URL Completa:** `POST https://tu-dominio.com/api/auth/external/empleado`

**Headers:**
```
Content-Type: application/json
X-API-Key: oatt_tu-api-key
```

**Body:**
```json
{
  "codigo": "10001",      // Código o DNI del empleado
  "password": "contraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "empleado": {
    "id": "clx123abc",
    "codigo": "10001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "dni": "12345678",
    "email": "juan@ejemplo.com",
    "cargo": "Desarrollador",
    "empresa": {
      "id": "clx456def",
      "nombre": "Mi Empresa"
    }
  }
}
```

**Respuestas de error:**
- `401`: API Key inválida o faltante
- `403`: Login externo no habilitado o empleado no autorizado
- `404`: Empleado no encontrado
- `400`: Empleado sin contraseña configurada o datos faltantes

**Ejemplo cURL:**
```bash
curl -X POST https://tu-dominio.com/api/auth/external/empleado \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oatt_tu-api-key" \
  -d '{
    "codigo": "10001",
    "password": "contraseña123"
  }'
```

**Ejemplo JavaScript/TypeScript:**
```javascript
const response = await fetch('https://tu-dominio.com/api/auth/external/empleado', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    codigo: '10001',
    password: 'contraseña123'
  })
});

const data = await response.json();

if (data.success) {
  // Guardar el token para futuras peticiones
  const token = data.token;
  const empleado = data.empleado;
  console.log('Login exitoso:', empleado);
}
```

---

### 2. Login de Empleado (Sistema Interno)

Endpoint interno del sistema usado por la aplicación web (no requiere API Key externa, solo para referencia).

**Endpoint:** `POST /api/auth/empleado/login`

**Nota:** Este endpoint no usa API Key, se usa internamente en la aplicación web.

---

### 3. Registrar Asistencia

Registra una entrada o salida de un empleado.

**Endpoint:** `POST /api/asistencias`

**Base URL:** `https://tu-dominio.com` o `http://localhost:3000` (desarrollo)

**URL Completa:** `POST https://tu-dominio.com/api/asistencias`

**Headers:**
```
Content-Type: application/json
X-API-Key: oatt_tu-api-key
```

**Body:**
```json
{
  "empleadoId": "clx123abc",   // ID del empleado (obtenido del login)
  "tipo": "entrada"             // "entrada" o "salida"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": "clx789xyz",
  "empleadoId": "clx123abc",
  "tipo": "entrada",
  "fecha": "2024-12-14T10:30:00.000Z",
  "ubicacion": null,
  "notas": null,
  "odooAttendanceId": 123,      // Si hay integración con Odoo
  "odooError": null,
  "createdAt": "2024-12-14T10:30:00.000Z"
}
```

**Respuestas de error:**
- `400`: Datos inválidos o empleado ya tiene check-in activo
- `401`: API Key inválida
- `404`: Empleado no encontrado
- `500`: Error al sincronizar con Odoo (si está configurado)

**Ejemplo cURL:**
```bash
curl -X POST https://tu-dominio.com/api/asistencias \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oatt_tu-api-key" \
  -d '{
    "empleadoId": "clx123abc",
    "tipo": "entrada"
  }'
```

**Ejemplo JavaScript/TypeScript:**
```javascript
const response = await fetch('https://tu-dominio.com/api/asistencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    empleadoId: 'clx123abc',
    tipo: 'entrada'
  })
});

const asistencia = await response.json();
console.log('Asistencia registrada:', asistencia);
```

---

### 4. Consultar Asistencias

Obtiene el historial de asistencias de un empleado.

**Endpoint:** `GET /api/asistencias?empleadoId={id}&fechaInicio={fecha}&fechaFin={fecha}`

**Base URL:** `https://tu-dominio.com` o `http://localhost:3000` (desarrollo)

**URL Completa:** `GET https://tu-dominio.com/api/asistencias?empleadoId=clx123abc`

**Headers:**
```
X-API-Key: oatt_tu-api-key
```

**Query Parameters:**
- `empleadoId` (requerido): ID del empleado
- `fechaInicio` (opcional): Fecha de inicio en formato ISO (ej: 2024-12-01)
- `fechaFin` (opcional): Fecha de fin en formato ISO (ej: 2024-12-31)

**Respuesta exitosa (200):**
```json
[
  {
    "id": "clx789xyz",
    "empleadoId": "clx123abc",
    "tipo": "entrada",
    "fecha": "2024-12-14T10:30:00.000Z",
    "ubicacion": null,
    "notas": null,
    "odooAttendanceId": 123,
    "odooError": null,
    "createdAt": "2024-12-14T10:30:00.000Z",
    "empleado": {
      "codigo": "10001",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  },
  {
    "id": "clx789xyy",
    "empleadoId": "clx123abc",
    "tipo": "salida",
    "fecha": "2024-12-14T18:30:00.000Z",
    "ubicacion": null,
    "notas": null,
    "odooAttendanceId": 123,
    "odooError": null,
    "createdAt": "2024-12-14T18:30:00.000Z",
    "empleado": {
      "codigo": "10001",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
]
```

**Respuestas de error:**
- `400`: Parámetros inválidos
- `401`: API Key inválida
- `404`: Empleado no encontrado

**Ejemplo cURL:**
```bash
# Todas las asistencias del empleado
curl -X GET "https://tu-dominio.com/api/asistencias?empleadoId=clx123abc" \
  -H "X-API-Key: oatt_tu-api-key"

# Asistencias con rango de fechas
curl -X GET "https://tu-dominio.com/api/asistencias?empleadoId=clx123abc&fechaInicio=2024-12-01&fechaFin=2024-12-31" \
  -H "X-API-Key: oatt_tu-api-key"
```

**Ejemplo JavaScript/TypeScript:**
```javascript
const empleadoId = 'clx123abc';
const fechaInicio = '2024-12-01';
const fechaFin = '2024-12-31';

const response = await fetch(
  `https://tu-dominio.com/api/asistencias?empleadoId=${empleadoId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
  {
    headers: {
      'X-API-Key': 'oatt_tu-api-key'
    }
  }
);

const asistencias = await response.json();
console.log('Asistencias:', asistencias);
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `400` | Petición inválida - Datos faltantes o incorrectos |
| `401` | No autorizado - API Key inválida, faltante o inactiva |
| `403` | Prohibido - Login externo deshabilitado o acceso no autorizado |
| `404` | No encontrado - Empleado o recurso no existe |
| `500` | Error del servidor - Error interno o problema con Odoo |

---

## Ejemplos Completos

### Flujo Completo: Login + Registrar Entrada + Consultar

**1. Login de empleado:**
```javascript
// Login
const loginResponse = await fetch('https://tu-dominio.com/api/auth/external/empleado', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    codigo: '10001',
    password: 'contraseña123'
  })
});

const loginData = await loginResponse.json();
const empleadoId = loginData.empleado.id;
const token = loginData.token; // Guardar para futuras peticiones si lo necesitas
```

**2. Registrar entrada:**
```javascript
// Registrar entrada
const entradaResponse = await fetch('https://tu-dominio.com/api/asistencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    empleadoId: empleadoId,
    tipo: 'entrada'
  })
});

const entradaData = await entradaResponse.json();
console.log('Entrada registrada:', entradaData);
```

**3. Registrar salida (al final del día):**
```javascript
// Registrar salida
const salidaResponse = await fetch('https://tu-dominio.com/api/asistencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'oatt_tu-api-key'
  },
  body: JSON.stringify({
    empleadoId: empleadoId,
    tipo: 'salida'
  })
});

const salidaData = await salidaResponse.json();
console.log('Salida registrada:', salidaData);
```

**4. Consultar historial:**
```javascript
// Consultar asistencias del mes
const hoy = new Date();
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

const consultaResponse = await fetch(
  `https://tu-dominio.com/api/asistencias?empleadoId=${empleadoId}&fechaInicio=${primerDia}&fechaFin=${ultimoDia}`,
  {
    headers: {
      'X-API-Key': 'oatt_tu-api-key'
    }
  }
);

const asistencias = await consultaResponse.json();
console.log('Asistencias del mes:', asistencias);
```

---

## URLs Disponibles (Resumen)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/external/empleado` | Login de empleado desde app externa |
| `POST` | `/api/asistencias` | Registrar entrada/salida |
| `GET` | `/api/asistencias?empleadoId={id}` | Consultar asistencias |

**Base URL de desarrollo:** `http://localhost:3000`  
**Base URL de producción:** `https://tu-dominio.com`

---

## Notas de Seguridad

1. **API Keys:** 
   - Mantén tus API Keys seguras y nunca las incluyas en código del cliente
   - Usa variables de entorno en el servidor
   - Puedes desactivar o eliminar keys comprometidas en cualquier momento

2. **Login de Empleados:**
   - El login externo debe estar explícitamente activado en el panel de integraciones
   - Los empleados deben tener contraseña configurada
   - Los tokens JWT expiran después de 7 días

3. **HTTPS:**
   - Siempre usa HTTPS en producción
   - Nunca envíes API Keys por canales no seguros

4. **Rate Limiting:**
   - Implementa rate limiting en tu aplicación para evitar abuso
   - Monitorea el "último uso" de tus API Keys en el panel de integraciones

---

## Soporte

Para más información o soporte, contacta al administrador del sistema.

**Versión de la documentación:** 1.0  
**Última actualización:** Diciembre 2024
      "odooError": null,
      "createdAt": "2025-12-14T12:30:00.000Z"
## Soporte

Para más información o soporte, contacta al administrador del sistema.

**Versión de la documentación:** 1.0  
**Última actualización:** Diciembre 2024
