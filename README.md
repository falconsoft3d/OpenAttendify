# OpenAttendify 📊

Sistema completo de gestión de asistencias de empleados construido con Next.js 14, Prisma y PostgreSQL.

## 🚀 Características

- **Autenticación segura** con JWT
- **Gestión de empresas** - Administra múltiples empresas
- **Gestión de empleados** - Control completo de tu equipo
- **Registro de asistencias** - Entrada y salida de empleados
- **Dashboard intuitivo** - Visualiza estadísticas en tiempo real
- **Diseño responsive** - Funciona en todos los dispositivos
- **TypeScript** - Código robusto y mantenible

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Prisma** - ORM moderno para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación segura
- **Tailwind CSS** - Estilos modernos
- **Bcrypt** - Hash de contraseñas
- **Zod** - Validación de datos

## 📦 Instalación

### Prerequisitos

- Node.js 18+ instalado
- PostgreSQL instalado y corriendo
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
cd OpenAttendify
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/openattendify"

# JWT Secret (genera uno seguro)
JWT_SECRET="tu-clave-secreta-muy-segura-cambiar-en-produccion"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="otra-clave-secreta-para-nextauth"
```

4. **Crear la base de datos en PostgreSQL**

```bash
# Conéctate a PostgreSQL
psql -U postgres

# Crea la base de datos
CREATE DATABASE openattendify;

# Sal de psql
\q
```

5. **Ejecutar migraciones de Prisma**

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Sincronizar el esquema con la base de datos
npm run prisma:push
```

6. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

7. **Abrir en el navegador**

Visita [http://localhost:3000](http://localhost:3000)

## 🎯 Uso

### 1. Registro de Usuario

1. Ve a `/registro`
2. Completa el formulario con tu información
3. Serás redirigido automáticamente al dashboard

### 2. Crear Empresa

1. En el dashboard, ve a "Empresas"
2. Click en "Nueva Empresa"
3. Completa los datos de la empresa
4. Guarda

### 3. Agregar Empleados

1. Ve a "Empleados"
2. Click en "Nuevo Empleado"
3. Completa la información del empleado
4. Selecciona la empresa correspondiente
5. Guarda

### 4. Registrar Asistencias

1. Ve a "Asistencias"
2. Click en "Registrar Asistencia"
3. Selecciona el empleado
4. Ingresa la fecha y hora de entrada
5. Opcionalmente ingresa la hora de salida
6. Guarda

## 📁 Estructura del Proyecto

```
OpenAttendify/
├── prisma/
│   └── schema.prisma          # Esquema de la base de datos
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación (login, registro, logout)
│   │   │   ├── empresas/      # CRUD de empresas
│   │   │   ├── empleados/     # CRUD de empleados
│   │   │   ├── asistencias/   # CRUD de asistencias
│   │   │   └── dashboard/     # Estadísticas
│   │   ├── dashboard/         # Páginas del dashboard
│   │   │   ├── empresas/
│   │   │   ├── empleados/
│   │   │   └── asistencias/
│   │   ├── login/             # Página de login
│   │   ├── registro/          # Página de registro
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Landing page
│   ├── lib/
│   │   ├── prisma.ts          # Cliente de Prisma
│   │   └── jwt.ts             # Utilidades JWT
│   └── middleware.ts          # Middleware de autenticación
├── .env                       # Variables de entorno
├── package.json
└── README.md
```

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt antes de almacenarse
- JWT para autenticación stateless
- Middleware protege rutas privadas
- Validación de datos con Zod
- Cookies httpOnly para tokens

## 🗄️ Modelo de Datos

### Usuario
- id, email, password, nombre, rol

### Empresa
- id, nombre, ruc, dirección, teléfono, email
- Relación con Usuario

### Empleado
- id, nombre, apellido, dni, email, teléfono, cargo, activo
- Relación con Empresa

### Asistencia
- id, fecha, horaEntrada, horaSalida, tipoRegistro, observaciones
- Relación con Empleado

## 📝 Scripts Disponibles

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción
npm run lint         # Ejecuta el linter
npm run prisma:generate  # Genera el cliente de Prisma
npm run prisma:push      # Sincroniza el esquema con la DB
npm run prisma:studio    # Abre Prisma Studio
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube el código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno
4. Conecta una base de datos PostgreSQL (ej: Supabase, Neon)
5. Despliega

### Variables de entorno para producción

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="clave-segura-produccion"
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="otra-clave-segura"
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👤 Autor

Desarrollado con ❤️ para gestionar asistencias de forma moderna y eficiente.

## 🐛 Reporte de Bugs

Si encuentras algún bug, por favor abre un issue en GitHub.

## 📞 Soporte

Para soporte, abre un issue en el repositorio de GitHub.

---

⭐️ Si te gusta este proyecto, dale una estrella en GitHub!
