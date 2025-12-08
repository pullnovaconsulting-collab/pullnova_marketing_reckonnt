# PULLNOVA Marketing

Sistema de Asistencia de Marketing con IA - RECKONNT

## 🏗️ Estructura del Proyecto

```
pullnova_marketing_reckonnt/
├── client/                 # Frontend React (Vite)
│   ├── src/
│   └── package.json
├── server/                 # Backend Express
│   ├── src/
│   └── package.json
├── database/               # Scripts SQL
│   └── init.sql
├── railway.json            # Configuración Railway
└── package.json            # Scripts raíz
```

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm run install:all
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y configura las credenciales:
```bash
cp .env.example server/.env
```

### 3. Crear tablas en la base de datos
Ejecuta el script `database/init.sql` en tu base de datos MySQL de Railway.

## 💻 Desarrollo

### Ejecutar frontend y backend simultáneamente:
```bash
npm run dev
```

### O ejecutarlos por separado:
```bash
# Backend (puerto 3000)
npm run dev:server

# Frontend (puerto 5173)
npm run dev:client
```

## 🌐 Deploy en Railway

1. **Conecta tu repositorio** a Railway (ya lo tienes)
2. **Configura las variables de entorno** en Railway Dashboard:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
3. **Push a GitHub** - Railway desplegará automáticamente

## 📡 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado de conexión y lista de tablas |
| GET | `/api/stats` | Estadísticas (conteo de usuarios, campañas, contenido) |
| GET | `/api/data` | Datos de ejemplo de cada tabla |

## 🛠️ Tecnologías

- **Frontend**: React 19 + Vite
- **Backend**: Express.js
- **Base de datos**: MySQL (Railway)
- **Deploy**: Railway

---

Desarrollado por RECKONNT © 2024