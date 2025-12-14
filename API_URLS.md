# OpenAttendify - Resumen de URLs de la API

## Base URLs

- **Desarrollo:** `http://localhost:3000`
- **Producción:** `https://tu-dominio.com`

---

## 🔑 Autenticación

Todas las peticiones requieren el header:
```
X-API-Key: oatt_tu-api-key-aqui
```

---

## 📍 Endpoints Disponibles

### 1. Login de Empleado (Aplicaciones Externas)

**URL:** `POST /api/auth/external/empleado`

**Descripción:** Autentica un empleado usando su código/DNI y contraseña desde una aplicación externa.

**Requiere:** 
- API Key válida
- Configuración "Permitir login de empleados desde apps externas" activada

**Body:**
```json
{
  "codigo": "10001",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "empleado": { ... }
}
```

---

### 2. Registrar Asistencia

**URL:** `POST /api/asistencias`

**Descripción:** Registra una entrada o salida de un empleado.

**Requiere:** API Key válida

**Body:**
```json
{
  "empleadoId": "clx123abc",
  "tipo": "entrada"
}
```

**Tipos válidos:** `"entrada"` o `"salida"`

**Respuesta:**
```json
{
  "id": "clx789xyz",
  "empleadoId": "clx123abc",
  "tipo": "entrada",
  "fecha": "2024-12-14T10:30:00.000Z",
  ...
}
```

---

### 3. Consultar Asistencias

**URL:** `GET /api/asistencias`

**Descripción:** Obtiene el historial de asistencias de un empleado.

**Requiere:** API Key válida

**Query Parameters:**
- `empleadoId` (requerido): ID del empleado
- `fechaInicio` (opcional): Fecha de inicio (YYYY-MM-DD)
- `fechaFin` (opcional): Fecha de fin (YYYY-MM-DD)

**Ejemplo:**
```
GET /api/asistencias?empleadoId=clx123abc&fechaInicio=2024-12-01&fechaFin=2024-12-31
```

**Respuesta:**
```json
[
  {
    "id": "clx789xyz",
    "empleadoId": "clx123abc",
    "tipo": "entrada",
    "fecha": "2024-12-14T10:30:00.000Z",
    "empleado": {
      "codigo": "10001",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  },
  ...
]
```

---

## 🛠 Endpoints de Configuración (Solo para Administradores)

### 4. Generar API Key

**URL:** `POST /api/auth/generate-api-key`

**Descripción:** Genera una nueva API Key.

**Requiere:** Sesión de administrador activa

**Body:**
```json
{
  "nombre": "Mi App Móvil"
}
```

---

### 5. Listar API Keys

**URL:** `GET /api/auth/api-keys`

**Descripción:** Lista todas las API Keys del usuario.

**Requiere:** Sesión de administrador activa

---

### 6. Actualizar API Key

**URL:** `PATCH /api/auth/api-keys/{id}`

**Descripción:** Activa/desactiva o renombra una API Key.

**Requiere:** Sesión de administrador activa

**Body:**
```json
{
  "activa": false
}
```

---

### 7. Eliminar API Key

**URL:** `DELETE /api/auth/api-keys/{id}`

**Descripción:** Elimina una API Key.

**Requiere:** Sesión de administrador activa

---

### 8. Obtener Configuración

**URL:** `GET /api/auth/config`

**Descripción:** Obtiene la configuración de login externo de empleados.

**Requiere:** Sesión de administrador activa

**Respuesta:**
```json
{
  "loginEmpleadosExterno": true
}
```

---

### 9. Actualizar Configuración

**URL:** `PATCH /api/auth/config`

**Descripción:** Activa/desactiva el login de empleados desde apps externas.

**Requiere:** Sesión de administrador activa

**Body:**
```json
{
  "loginEmpleadosExterno": true
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| `200` | Éxito |
| `201` | Recurso creado exitosamente |
| `400` | Petición inválida (datos faltantes o incorrectos) |
| `401` | No autorizado (API Key inválida, faltante o inactiva) |
| `403` | Prohibido (login externo deshabilitado o sin permisos) |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## 📝 Notas Importantes

1. **API Keys:** Comienzan con el prefijo `oatt_` y tienen 64 caracteres hexadecimales
2. **Seguridad:** Nunca expongas las API Keys en código del cliente
3. **HTTPS:** Usa siempre HTTPS en producción
4. **Tokens JWT:** Los tokens de empleado expiran después de 7 días
5. **Odoo:** Si está configurado, las asistencias se sincronizan automáticamente

---

## 🔗 Recursos Adicionales

- **Documentación Completa:** Ver `API_DOCUMENTATION.md` para ejemplos detallados
- **Panel de Integraciones:** `Dashboard → Integraciones` para gestionar API Keys
- **Repositorio:** [GitHub](https://github.com/tu-usuario/openattendify)

---

**Versión:** 1.0  
**Última actualización:** Diciembre 2024
