-- =============================================
-- PULLNOVA Marketing - Esquema de Base de Datos
-- =============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  rol ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de campañas de marketing
CREATE TABLE IF NOT EXISTS campanas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado ENUM('borrador', 'activa', 'pausada', 'completada') DEFAULT 'borrador',
  fecha_inicio DATE,
  fecha_fin DATE,
  presupuesto DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de contenido generado
CREATE TABLE IF NOT EXISTS contenido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campana_id INT,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT,
  tipo ENUM('post', 'imagen', 'video', 'story') DEFAULT 'post',
  plataforma ENUM('instagram', 'facebook', 'linkedin', 'twitter') DEFAULT 'instagram',
  estado ENUM('pendiente', 'aprobado', 'publicado', 'rechazado') DEFAULT 'pendiente',
  fecha_publicacion DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campana_id) REFERENCES campanas(id) ON DELETE SET NULL
);

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, email, rol) VALUES 
  ('Admin PULLNOVA', 'admin@pullnova.com', 'admin'),
  ('María García', 'maria.garcia@pullnova.com', 'editor'),
  ('Carlos López', 'carlos.lopez@pullnova.com', 'viewer');

-- Insertar campañas de ejemplo
INSERT INTO campanas (nombre, descripcion, estado, fecha_inicio, fecha_fin, presupuesto) VALUES 
  ('Campaña Navidad 2024', 'Campaña navideña para promocionar productos de temporada', 'activa', '2024-12-01', '2024-12-31', 5000.00),
  ('Lanzamiento Producto X', 'Campaña de lanzamiento para el nuevo producto', 'borrador', '2025-01-15', '2025-02-15', 10000.00),
  ('Promoción Verano', 'Descuentos y ofertas de verano', 'pausada', '2024-06-01', '2024-08-31', 3000.00);

-- Insertar contenido de ejemplo
INSERT INTO contenido (campana_id, titulo, contenido, tipo, plataforma, estado) VALUES 
  (1, 'Post Navideño #1', '¡Felices fiestas! Descubre nuestras ofertas especiales 🎄', 'post', 'instagram', 'publicado'),
  (1, 'Video Promocional Navidad', 'Video de 30 segundos para historias', 'video', 'instagram', 'aprobado'),
  (2, 'Teaser Producto X', 'Algo grande viene pronto... 🚀', 'post', 'facebook', 'pendiente'),
  (1, 'Carrusel de Productos', 'Los 5 productos más vendidos esta temporada', 'imagen', 'linkedin', 'publicado');
