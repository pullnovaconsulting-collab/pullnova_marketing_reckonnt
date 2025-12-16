-- =============================================
-- PULLNOVA Marketing - Esquema Completo de Base de Datos
-- =============================================
-- Este archivo contiene TODAS las tablas del sistema
-- Ejecutar una sola vez en una base de datos NUEVA
-- =============================================

-- ============================================
-- TABLA: usuarios
-- Usuarios del sistema con autenticación
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  rol ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: campanas
-- Campañas de marketing
-- ============================================
CREATE TABLE IF NOT EXISTS campanas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  objetivo TEXT,
  estado ENUM('borrador', 'activa', 'pausada', 'completada') DEFAULT 'borrador',
  fecha_inicio DATE,
  fecha_fin DATE,
  plataformas SET('instagram', 'facebook', 'linkedin'),
  kpi_principal ENUM('alcance', 'engagement', 'leads'),
  presupuesto DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: contenido
-- Contenido generado para publicaciones
-- ============================================
CREATE TABLE IF NOT EXISTS contenido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campana_id INT,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT,
  copy_texto TEXT,
  tipo ENUM('post', 'imagen', 'video', 'story', 'carrusel') DEFAULT 'post',
  plataforma ENUM('instagram', 'facebook', 'linkedin', 'twitter') DEFAULT 'instagram',
  estado ENUM('pendiente', 'aprobado', 'programado', 'publicado', 'rechazado') DEFAULT 'pendiente',
  fecha_publicacion DATETIME,
  prompt_usado TEXT,
  modelo_ia VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campana_id) REFERENCES campanas(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: config_marca
-- Configuración de la marca para generación IA
-- ============================================
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

-- ============================================
-- TABLA: cuentas_sociales
-- Cuentas de redes sociales conectadas (OAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS cuentas_sociales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plataforma ENUM('facebook', 'instagram', 'linkedin') NOT NULL,
  nombre_cuenta VARCHAR(150),
  page_id VARCHAR(150),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at DATETIME,
  estado ENUM('conectada', 'expirada', 'desconectada') DEFAULT 'desconectada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: imagenes
-- Imágenes generadas con IA (DALL-E)
-- ============================================
CREATE TABLE IF NOT EXISTS imagenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contenido_id INT,
  url_imagen TEXT,
  prompt_imagen TEXT,
  modelo_ia VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE
);

-- ============================================
-- TABLA: publicaciones_programadas
-- Programación de publicaciones automáticas
-- ============================================
CREATE TABLE IF NOT EXISTS publicaciones_programadas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contenido_id INT,
  cuenta_social_id INT,
  fecha_programada DATETIME,
  estado ENUM('pendiente', 'enviado', 'fallido', 'cancelado') DEFAULT 'pendiente',
  response_api TEXT,
  external_post_id VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
  FOREIGN KEY (cuenta_social_id) REFERENCES cuentas_sociales(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: prompts
-- Plantillas de prompts para generación IA
-- ============================================
CREATE TABLE IF NOT EXISTS prompts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('copy_post', 'calendario', 'imagen', 'otros') DEFAULT 'copy_post',
  plantilla TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================
-- TABLA: metricas_contenido
-- Métricas de cada publicación
-- ============================================
CREATE TABLE IF NOT EXISTS metricas_contenido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contenido_id INT NOT NULL,
  cuenta_social_id INT,
  external_post_id VARCHAR(150),
  
  -- Métricas de engagement
  likes INT DEFAULT 0,
  comentarios INT DEFAULT 0,
  compartidos INT DEFAULT 0,
  guardados INT DEFAULT 0,
  
  -- Métricas de alcance
  impresiones INT DEFAULT 0,
  alcance INT DEFAULT 0,
  clics INT DEFAULT 0,
  
  -- Métricas de video
  reproducciones INT DEFAULT 0,
  tiempo_reproduccion INT DEFAULT 0,
  
  -- Métricas calculadas
  tasa_engagement DECIMAL(5,2) DEFAULT 0,
  
  -- Metadatos
  fecha_medicion DATETIME DEFAULT CURRENT_TIMESTAMP,
  plataforma ENUM('instagram', 'facebook', 'linkedin') NOT NULL,
  
  -- Claves foráneas
  FOREIGN KEY (contenido_id) REFERENCES contenido(id) ON DELETE CASCADE,
  FOREIGN KEY (cuenta_social_id) REFERENCES cuentas_sociales(id) ON DELETE SET NULL,
  
  -- Índices
  INDEX idx_contenido (contenido_id),
  INDEX idx_fecha (fecha_medicion),
  INDEX idx_plataforma (plataforma)
);

-- ============================================
-- TABLA: metricas_resumen_diario
-- Resumen agregado por día para dashboard
-- ============================================
CREATE TABLE IF NOT EXISTS metricas_resumen_diario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  plataforma ENUM('instagram', 'facebook', 'linkedin', 'todas') NOT NULL,
  
  -- Contadores de publicaciones
  total_publicaciones INT DEFAULT 0,
  publicaciones_exitosas INT DEFAULT 0,
  publicaciones_fallidas INT DEFAULT 0,
  
  -- Engagement agregado
  total_likes INT DEFAULT 0,
  total_comentarios INT DEFAULT 0,
  total_compartidos INT DEFAULT 0,
  
  -- Alcance agregado
  total_impresiones INT DEFAULT 0,
  total_alcance INT DEFAULT 0,
  total_clics INT DEFAULT 0,
  
  -- Promedios
  engagement_promedio DECIMAL(5,2) DEFAULT 0,
  
  -- Seguidores
  seguidores_inicio INT DEFAULT 0,
  seguidores_fin INT DEFAULT 0,
  nuevos_seguidores INT DEFAULT 0,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Índice único
  UNIQUE KEY unique_fecha_plataforma (fecha, plataforma)
);

-- ============================================
-- TABLA: logs_workers
-- Registro de ejecución de workers
-- ============================================
CREATE TABLE IF NOT EXISTS logs_workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_name VARCHAR(50) NOT NULL,
  tipo ENUM('scheduler', 'metrics', 'limpieza') NOT NULL,
  estado ENUM('iniciado', 'completado', 'error') NOT NULL,
  mensaje TEXT,
  items_procesados INT DEFAULT 0,
  tiempo_ejecucion_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_worker (worker_name),
  INDEX idx_fecha (created_at)
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Usuario administrador por defecto
-- Contraseña: admin123 (hash bcrypt)
INSERT INTO usuarios (nombre, email, password_hash, rol, estado) VALUES 
  ('Admin PULLNOVA', 'admin@pullnova.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3/r5nC2JWt3.Oj7Jq7su', 'admin', 'activo')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- Configuración de marca por defecto
INSERT INTO config_marca (nombre_marca, descripcion, tono_voz, pilares_comunicacion, frecuencia_semanal, segmento_principal)
SELECT 'RECKONNT', 
       'Soluciones empresariales y contables',
       'Profesional, cercano, experto en contabilidad y tecnología',
       'Educación tributaria, Consejos para PyMEs, Novedades del SRI, Tecnología para negocios',
       4,
       'PyMEs ecuatorianas'
WHERE NOT EXISTS (SELECT 1 FROM config_marca);

-- Prompts de ejemplo
INSERT INTO prompts (nombre, tipo, plantilla) VALUES 
('Post educativo', 'copy_post', 'Escribe un post educativo para {{plataforma}} sobre {{tema}}. El tono debe ser {{tono_voz}}. Incluye un CTA para {{objetivo}}. Máximo {{longitud}} caracteres.'),
('Generador de ideas', 'copy_post', 'Genera 5 ideas de contenido para redes sociales sobre {{tema}} dirigido a {{segmento}}. Cada idea debe incluir: título, descripción breve, y plataforma recomendada.'),
('Imagen promocional', 'imagen', 'Crea una imagen {{estilo}} para promocionar {{producto_servicio}}. Colores: {{colores}}. Estilo: moderno y profesional. Sin texto.'),
('Calendario semanal', 'calendario', 'Genera un calendario de contenido para la semana sobre {{tema}}. Incluye: día, plataforma, tipo de contenido, y descripción breve.'),
('Copy para Instagram', 'copy_post', 'Escribe un post para Instagram sobre {{tema}}. Incluye emojis, hashtags relevantes y un CTA. Tono: {{tono_voz}}. Máximo 2200 caracteres.')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================
SELECT 'Base de datos inicializada correctamente' AS resultado;
SHOW TABLES;
