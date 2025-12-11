-- =============================================
-- PULLNOVA Marketing - Migración de Base de Datos
-- Ejecutar este script en Railway MySQL
-- =============================================

-- ============================================
-- PASO 1: Modificar tabla usuarios
-- ============================================

-- Agregar columna password_hash si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) AFTER email;

-- Agregar columna estado si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS estado ENUM('activo','inactivo') DEFAULT 'activo' AFTER rol;

-- Agregar columna updated_at si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Actualizar usuarios existentes para que tengan un password hash temporal
-- IMPORTANTE: Los usuarios existentes deberán cambiar su contraseña
-- Este hash corresponde a la contraseña "temporal123"
UPDATE usuarios 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3/r5nC2JWt3.Oj7Jq7su'
WHERE password_hash IS NULL;

-- ============================================
-- PASO 2: Modificar tabla campanas
-- ============================================

-- Agregar nuevas columnas a campanas
ALTER TABLE campanas
ADD COLUMN IF NOT EXISTS objetivo TEXT AFTER descripcion,
ADD COLUMN IF NOT EXISTS plataformas SET('instagram','facebook','linkedin') AFTER fecha_fin,
ADD COLUMN IF NOT EXISTS kpi_principal ENUM('alcance','engagement','leads') AFTER plataformas;

-- ============================================
-- PASO 3: Modificar tabla contenido
-- ============================================

-- Agregar nuevas columnas a contenido
ALTER TABLE contenido
ADD COLUMN IF NOT EXISTS copy_texto TEXT AFTER contenido,
ADD COLUMN IF NOT EXISTS prompt_usado TEXT AFTER estado,
ADD COLUMN IF NOT EXISTS modelo_ia VARCHAR(50) AFTER prompt_usado,
ADD COLUMN IF NOT EXISTS created_by INT AFTER modelo_ia;

-- Agregar tipo 'carrusel' si no existe
ALTER TABLE contenido 
MODIFY COLUMN tipo ENUM('post', 'imagen', 'video', 'story', 'carrusel') DEFAULT 'post';

-- Agregar estado 'programado' si no existe
ALTER TABLE contenido 
MODIFY COLUMN estado ENUM('pendiente', 'aprobado', 'programado', 'publicado', 'rechazado') DEFAULT 'pendiente';

-- ============================================
-- PASO 4: Crear nuevas tablas
-- ============================================

-- Tabla: config_marca
CREATE TABLE IF NOT EXISTS config_marca (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_marca VARCHAR(150) DEFAULT 'RECKONNT',
  descripcion TEXT,
  tono_voz TEXT,
  pilares_comunicacion TEXT,
  frecuencia_semanal INT DEFAULT 3,
  segmento_principal VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto si no existe
INSERT INTO config_marca (nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal)
SELECT 'RECKONNT', 
       'Soluciones empresariales y contables',
       'Profesional, cercano, experto en contabilidad y tecnología',
       'Educación tributaria, Consejos para PyMEs, Novedades del SRI, Tecnología para negocios',
       4,
       'PyMEs ecuatorianas'
WHERE NOT EXISTS (SELECT 1 FROM config_marca);

-- Tabla: cuentas_sociales
CREATE TABLE IF NOT EXISTS cuentas_sociales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plataforma ENUM('facebook','instagram','linkedin') NOT NULL,
  nombre_cuenta VARCHAR(150),
  page_id VARCHAR(150),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at DATETIME,
  estado ENUM('conectada','expirada','desconectada') DEFAULT 'desconectada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: imagenes
CREATE TABLE IF NOT EXISTS imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contenido_id INT,
  url_imagen TEXT,
  prompt_imagen TEXT,
  modelo_ia VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE
);

-- Tabla: publicaciones_programadas
CREATE TABLE IF NOT EXISTS publicaciones_programadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contenido_id INT,
  cuenta_social_id INT,
  fecha_programada DATETIME,
  estado ENUM('pendiente','enviado','fallido') DEFAULT 'pendiente',
  response_api TEXT,
  external_post_id VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
  FOREIGN KEY (cuenta_social_id) REFERENCES cuentas_sociales(id) ON DELETE SET NULL
);

-- Tabla: prompts
CREATE TABLE IF NOT EXISTS prompts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('copy_post','calendario','imagen','otros') DEFAULT 'copy_post',
  plantilla TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================
-- PASO 5: Insertar prompts de ejemplo
-- ============================================

INSERT INTO prompts (nombre, tipo, plantilla) VALUES 
('Post educativo', 'copy_post', 'Escribe un post educativo para {{plataforma}} sobre {{tema}}. El tono debe ser {{tono_voz}}. Incluye un CTA para {{objetivo}}. Máximo {{longitud}} caracteres.'),
('Generador de ideas', 'copy_post', 'Genera 5 ideas de contenido para redes sociales sobre {{tema}} dirigido a {{segmento}}. Cada idea debe incluir: título, descripción breve, y plataforma recomendada.'),
('Imagen promocional', 'imagen', 'Crea una imagen {{estilo}} para promocionar {{producto_servicio}}. Colores: {{colores}}. Estilo: moderno y profesional. Sin texto.')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Mostrar estructura de tablas
SHOW TABLES;

SELECT 'Migración completada exitosamente' AS resultado;
