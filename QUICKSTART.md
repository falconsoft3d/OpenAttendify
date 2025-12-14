# Guía de Inicio Rápido - OpenAttendify

## Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar PostgreSQL

Asegúrate de tener PostgreSQL instalado. En macOS puedes instalarlo con Homebrew:
```bash
brew install postgresql@15
brew services start postgresql@15
```

Crea la base de datos:
```bash
createdb openattendify
```

### 3. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de PostgreSQL:
```
DATABASE_URL="postgresql://tu_usuario:tu_contraseña@localhost:5432/openattendify"
JWT_SECRET="cambia-esto-por-una-clave-segura-de-al-menos-32-caracteres"
```

### 4. Inicializar Prisma

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Aplicar el esquema a la base de datos
npm run prisma:push
```

### 5. Iniciar el Servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Flujo de Trabajo

1. **Registra tu cuenta** en `/registro`
2. **Crea una empresa** en el dashboard
3. **Agrega empleados** a tu empresa
4. **Registra asistencias** de tus empleados

## Comandos Útiles

```bash
# Ver la base de datos con Prisma Studio
npm run prisma:studio

# Limpiar y reconstruir
rm -rf .next node_modules
npm install
npm run prisma:generate

# Resetear base de datos (¡cuidado! borra todos los datos)
npx prisma db push --force-reset
```

## Solución de Problemas

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL esté corriendo: `brew services list`
- Verifica las credenciales en tu archivo `.env`

### Error con Prisma
- Regenera el cliente: `npm run prisma:generate`
- Verifica que la base de datos exista

### Puerto 3000 ocupado
- Cambia el puerto: `PORT=3001 npm run dev`

## Estructura de Autenticación

El sistema usa JWT almacenado en cookies httpOnly:
- Las rutas `/dashboard/*` requieren autenticación
- El token expira en 7 días
- El middleware verifica automáticamente el token

## Próximos Pasos

- Personaliza los estilos en `tailwind.config.ts`
- Agrega más tipos de registro (biométrico, QR, etc.)
- Implementa reportes avanzados
- Agrega notificaciones por email

¡Disfruta usando OpenAttendify! 🎉
