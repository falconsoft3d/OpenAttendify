# 🔗 Guía Rápida de Integración con OpenAttendify

Esta guía te ayudará a integrar tu aplicación externa con OpenAttendify para gestionar asistencias de empleados.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Ejemplo Completo](#ejemplo-completo)
3. [Documentación Detallada](#documentación-detallada)

---

## 🚀 Configuración Inicial

### Paso 1: Genera tu API Key

1. Inicia sesión en OpenAttendify como administrador
2. Ve a **Dashboard → Integraciones**
3. Haz clic en **"Nueva API Key"**
4. Dale un nombre descriptivo (ej: "App Móvil Android")
5. Copia la API Key generada (comienza con `oatt_`)

### Paso 2: Activa el Login de Empleados

En la misma página de Integraciones:
- Activa el toggle **"Permitir login de empleados desde aplicaciones externas"**

### Paso 3: Configura tu Aplicación

Agrega la API Key en tu aplicación (como variable de entorno):

```bash
API_KEY=oatt_tu-api-key-aqui
BASE_URL=https://tu-dominio.com  # o http://localhost:3000 en desarrollo
```

---

## 💡 Ejemplo Completo

### JavaScript/TypeScript

```javascript
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

// 1. Login de empleado
async function loginEmpleado(codigo, password) {
  const response = await fetch(`${BASE_URL}/api/auth/external/empleado`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({ codigo, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data; // { token, empleado: { id, nombre, ... } }
  }
  
  throw new Error(data.error);
}

// 2. Registrar entrada
async function registrarEntrada(empleadoId) {
  const response = await fetch(`${BASE_URL}/api/asistencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      empleadoId,
      tipo: 'entrada'
    })
  });
  
  return await response.json();
}

// 3. Registrar salida
async function registrarSalida(empleadoId) {
  const response = await fetch(`${BASE_URL}/api/asistencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      empleadoId,
      tipo: 'salida'
    })
  });
  
  return await response.json();
}

// 4. Consultar asistencias
async function consultarAsistencias(empleadoId, fechaInicio, fechaFin) {
  const params = new URLSearchParams({
    empleadoId,
    ...(fechaInicio && { fechaInicio }),
    ...(fechaFin && { fechaFin })
  });
  
  const response = await fetch(
    `${BASE_URL}/api/asistencias?${params}`,
    {
      headers: {
        'X-API-Key': API_KEY
      }
    }
  );
  
  return await response.json();
}

// Uso ejemplo
async function ejemplo() {
  try {
    // Login
    const { empleado } = await loginEmpleado('10001', 'miPassword123');
    console.log('Empleado logueado:', empleado.nombre);
    
    // Registrar entrada
    const entrada = await registrarEntrada(empleado.id);
    console.log('Entrada registrada:', entrada);
    
    // Consultar asistencias del mes
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const asistencias = await consultarAsistencias(empleado.id, primerDia, ultimoDia);
    console.log('Asistencias del mes:', asistencias.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Python

```python
import requests
import os
from datetime import datetime, timedelta

API_KEY = os.getenv('API_KEY')
BASE_URL = os.getenv('BASE_URL', 'http://localhost:3000')

def login_empleado(codigo, password):
    """Login de empleado"""
    response = requests.post(
        f'{BASE_URL}/api/auth/external/empleado',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        json={'codigo': codigo, 'password': password}
    )
    
    data = response.json()
    if data.get('success'):
        return data
    
    raise Exception(data.get('error', 'Error desconocido'))

def registrar_entrada(empleado_id):
    """Registrar entrada de empleado"""
    response = requests.post(
        f'{BASE_URL}/api/asistencias',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        json={'empleadoId': empleado_id, 'tipo': 'entrada'}
    )
    return response.json()

def registrar_salida(empleado_id):
    """Registrar salida de empleado"""
    response = requests.post(
        f'{BASE_URL}/api/asistencias',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        json={'empleadoId': empleado_id, 'tipo': 'salida'}
    )
    return response.json()

def consultar_asistencias(empleado_id, fecha_inicio=None, fecha_fin=None):
    """Consultar asistencias de un empleado"""
    params = {'empleadoId': empleado_id}
    if fecha_inicio:
        params['fechaInicio'] = fecha_inicio
    if fecha_fin:
        params['fechaFin'] = fecha_fin
    
    response = requests.get(
        f'{BASE_URL}/api/asistencias',
        headers={'X-API-Key': API_KEY},
        params=params
    )
    return response.json()

# Uso ejemplo
if __name__ == '__main__':
    try:
        # Login
        data = login_empleado('10001', 'miPassword123')
        empleado = data['empleado']
        print(f"Empleado logueado: {empleado['nombre']}")
        
        # Registrar entrada
        entrada = registrar_entrada(empleado['id'])
        print(f"Entrada registrada: {entrada['id']}")
        
        # Consultar asistencias del mes
        hoy = datetime.now()
        primer_dia = hoy.replace(day=1).strftime('%Y-%m-%d')
        ultimo_dia = (hoy.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        ultimo_dia = ultimo_dia.strftime('%Y-%m-%d')
        
        asistencias = consultar_asistencias(empleado['id'], primer_dia, ultimo_dia)
        print(f"Asistencias del mes: {len(asistencias)}")
        
    except Exception as e:
        print(f"Error: {e}")
```

### cURL (Línea de Comandos)

```bash
# Login de empleado
curl -X POST http://localhost:3000/api/auth/external/empleado \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oatt_tu-api-key" \
  -d '{
    "codigo": "10001",
    "password": "miPassword123"
  }'

# Registrar entrada
curl -X POST http://localhost:3000/api/asistencias \
  -H "Content-Type: application/json" \
  -H "X-API-Key: oatt_tu-api-key" \
  -d '{
    "empleadoId": "clx123abc",
    "tipo": "entrada"
  }'

# Consultar asistencias
curl -X GET "http://localhost:3000/api/asistencias?empleadoId=clx123abc" \
  -H "X-API-Key: oatt_tu-api-key"
```

---

## 📚 Documentación Detallada

Para información más detallada, consulta:

- **[API_URLS.md](./API_URLS.md)** - Resumen rápido de todos los endpoints
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Documentación completa con ejemplos

---

## ⚠️ Seguridad

- ✅ **SÍ:** Usa las API Keys en el backend/servidor
- ✅ **SÍ:** Almacena las API Keys como variables de entorno
- ✅ **SÍ:** Usa HTTPS en producción
- ❌ **NO:** Incluyas las API Keys en el código del cliente (frontend)
- ❌ **NO:** Subas las API Keys a repositorios públicos
- ❌ **NO:** Compartas las API Keys públicamente

---

## 🔧 Solución de Problemas

### Error 401: API Key inválida

- Verifica que la API Key esté correcta
- Asegúrate de que la API Key esté activa en el panel
- Verifica que el header se llame exactamente `X-API-Key`

### Error 403: Login externo deshabilitado

- Ve a Dashboard → Integraciones
- Activa el toggle "Permitir login de empleados desde aplicaciones externas"

### Error 404: Empleado no encontrado

- Verifica que el código/DNI del empleado sea correcto
- Asegúrate de que el empleado esté activo en el sistema
- Verifica que el empleado tenga contraseña configurada

---

## 📞 Soporte

¿Tienes dudas? Contacta al administrador del sistema.

**OpenAttendify** - Sistema de Control de Asistencias  
Versión 1.0 - Diciembre 2024
