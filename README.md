# Jorge Minnesota Logistics LLC - Contract System

## Descripción
Aplicación web moderna construida con Next.js y Tailwind CSS para gestionar contratos digitales de autorización de levantamiento de vehículos. Los clientes pueden firmar contratos digitalmente usando un número de teléfono para verificación, y los administradores pueden ver todos los contratos firmados en un dashboard elegante.

## 🚀 Características
- ✅ **Framework Moderno**: Next.js 15 con TypeScript
- ✅ **Diseño Responsivo**: Tailwind CSS con tema rojo/blanco personalizado
- ✅ **Verificación de Teléfono**: Sistema inteligente para usuarios nuevos/existentes
- ✅ **Firma Digital**: Canvas HTML5 para captura de firmas
- ✅ **Base de Datos**: SQLite en carpeta backend organizada
- ✅ **Dashboard Administrativo**: Interface moderna con estadísticas
- ✅ **API REST**: Endpoints optimizados con Next.js App Router
- ✅ **Turbopack**: Desarrollo ultrarrápido habilitado

## 🎨 Tema Visual
- **Colores Principales**: Rojo (#dc2626) y Blanco
- **Branding**: Jorge Minnesota Logistics LLC prominente
- **Diseño**: Moderno, limpio y profesional
- **Responsive**: Optimizado para móviles y escritorio

## 📁 Estructura del Proyecto
```
contract-nextjs/
├── src/
│   └── app/
│       ├── api/                    # API Routes
│       │   ├── contracts/          # CRUD contratos
│       │   └── check-phone/        # Verificación teléfono
│       ├── admin/                  # Dashboard administrativo
│       │   └── page.tsx
│       ├── page.tsx                # Formulario principal
│       └── layout.tsx              # Layout global
├── backend/
│   ├── database.js                 # Configuración SQLite
│   └── contracts.db                # Base de datos (se crea automáticamente)
├── tailwind.config.ts              # Configuración tema rojo
└── package.json
```

## 🛠️ Instalación y Uso

### Requisitos
- Node.js 18+ 
- npm

### Instrucciones
1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar desarrollo:**
   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación:**
   - **Formulario de contrato**: http://localhost:3000
   - **Dashboard administrativo**: http://localhost:3000/admin

## 🔗 API Endpoints

### `POST /api/contracts`
Crear un nuevo contrato
```json
{
  "phoneNumber": "555-123-4567",
  "lotNumber": "ABC12345",
  "fullName": "Juan Pérez",
  "address": "Calle Principal 123",
  "signatureData": "data:image/png;base64,..."
}
```

### `GET /api/contracts`
Obtener lista de todos los contratos

### `GET /api/check-phone/[phone]`
Verificar si un teléfono existe en la base de datos

### `GET /api/contracts/[id]/signature`
Obtener la firma de un contrato específico

## 💡 Flujo de Usuario

### Para Clientes:
1. **Acceder al enlace** compartido por WhatsApp
2. **Ingresar teléfono** → presionar "Verificar"
3. **Si es nuevo**: completar nombre y dirección
4. **Si existe**: proceder directamente al lote
5. **Ingresar número de lote** (8 dígitos)
6. **Firmar digitalmente** en el canvas
7. **Aceptar contrato** → guardado automático

### Para Administradores:
1. **Acceder al dashboard** en `/admin`
2. **Ver estadísticas** en tiempo real
3. **Revisar contratos** en tabla organizada
4. **Ver firmas** en modal elegante
5. **Auto-actualización** cada 30 segundos

## 🔧 Tecnologías Utilizadas
- **Next.js 15** - Framework React de producción
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **SQLite** - Base de datos embebida
- **Canvas API** - Captura de firmas digitales
- **Turbopack** - Bundler ultrarrápido

## 🚦 Scripts Disponibles
- `npm run dev` - Desarrollo con Turbopack
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm run lint` - Linting con ESLint

## ✨ Mejoras de la Migración
- **Performance**: Turbopack + Next.js 15 = desarrollo 10x más rápido
- **DX**: TypeScript + mejor estructura de carpetas
- **UI/UX**: Tailwind CSS + tema rojo/blanco profesional
- **Organización**: Backend separado + API routes limpias
- **Responsive**: Diseño completamente móvil-first
- **Estadísticas**: Dashboard con métricas en tiempo real

¡La aplicación está lista para producción y optimizada para la mejor experiencia de usuario! 🎉