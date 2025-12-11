# PULLNOVA Marketing - Backend

Sistema de marketing automatizado con IA para gestión de redes sociales.

## 🚀 Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone [url_del_repo]
cd pullnova_marketing_reckonnt
```

### 2. Instalar dependencias
```bash
npm run install:all
# Backend
cd server
npm install

# Frontend (opcional)
cd ../client
npm install
```

### 3. Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.example server/.env

# Edita server/.env con tus credenciales
```

**Variables requeridas:**
| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `MYSQL_*` | Credenciales MySQL | Railway Dashboard > MySQL |
| `JWT_SECRET` | Secret para tokens | Generar uno seguro |
| `GEMINI_API_KEY` | API de Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |

**Variables opcionales (Fase 3):**
| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `META_*` | OAuth Facebook/IG | [Meta Developers](https://developers.facebook.com/apps) |
| `LINKEDIN_*` | OAuth LinkedIn | [LinkedIn Developers](https://www.linkedin.com/developers/apps) |

### 4. Ejecutar la migración de base de datos
En Railway MySQL, ejecuta el contenido de `database/migration_v1.sql`.

### 5. Iniciar el servidor
```bash
cd server
npm run dev
```

El servidor estará en: http://localhost:3000

---

## 📁 Estructura del Proyecto

```
pullnova_marketing_reckonnt/
├── client/                 # Frontend React (Vite)
├── server/                 # Backend Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuración DB
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middlewares/    # Auth, roles
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Servicios externos (Gemini, Meta, LinkedIn)
│   │   └── utils/          # Utilidades
│   └── tests/              # Tests
├── database/               # Scripts SQL
└── .env.example            # Plantilla de variables
```

---

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Perfil actual

### Campañas (requiere auth)
- `GET /api/campanas` - Listar
- `POST /api/campanas` - Crear (editor+)
- `PUT /api/campanas/:id` - Actualizar (editor+)
- `DELETE /api/campanas/:id` - Eliminar (admin)

### Contenido (requiere auth)
- `GET /api/contenido` - Listar
- `POST /api/contenido` - Crear (editor+)
- `PUT /api/contenido/:id` - Actualizar (editor+)

### IA - Gemini (requiere auth + editor)
- `GET /api/ia/status` - Estado del servicio
- `POST /api/ia/generar-copy` - Generar texto marketing
- `POST /api/ia/generar-ideas` - Generar ideas calendario

### Redes Sociales (requiere auth + editor)
- `GET /api/social/status` - Estado de conexiones
- `GET /api/social/meta/auth` - Iniciar OAuth Meta
- `GET /api/social/linkedin/auth` - Iniciar OAuth LinkedIn
- `POST /api/social/publicar/:id` - Publicar contenido

---

## 🧪 Testing

```bash
cd server
npm test                 # Todos los tests
npm run test:unit        # Solo unitarios
npm run test:integration # Solo integración
```

---

## 👥 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `viewer` | Solo lectura |
| `editor` | Crear y editar contenido |
| `admin` | Todo + gestión usuarios |

---

## 📝 Notas para el Equipo

1. **NUNCA subir `.env`** - Contiene secretos
2. **Variables de equipo** - Compartir por canal seguro (no Git)
3. **Base de datos** - Todos usan la misma de Railway
4. **API Keys** - Cada desarrollador puede usar su propia key de Gemini

---

## 🔧 Tecnologías

- **Backend**: Node.js, Express, MySQL
- **Frontend**: React, Vite
- **IA**: Google Gemini API
- **Auth**: JWT
- **Deploy**: Railway