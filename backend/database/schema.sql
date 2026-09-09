-- Sistema de calificacion de cursos
-- Esquema compatible con login, roles, calificaciones y comentarios.

CREATE DATABASE IF NOT EXISTS sistema_calificacion_cursos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_calificacion_cursos;

CREATE TABLE IF NOT EXISTS Persona (
  id_persona INT AUTO_INCREMENT PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  correo_electronico VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL UNIQUE,
  registro_academico VARCHAR(20) NULL UNIQUE,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'profesor', 'estudiante') NOT NULL DEFAULT 'estudiante',
  CONSTRAINT fk_usuario_persona FOREIGN KEY (id_persona)
    REFERENCES Persona(id_persona) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Catedratico (
  id_catedratico INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL UNIQUE,
  id_usuario INT NULL UNIQUE,
  CONSTRAINT fk_catedratico_persona FOREIGN KEY (id_persona)
    REFERENCES Persona(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_catedratico_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Curso (
  id_curso INT AUTO_INCREMENT PRIMARY KEY,
  codigo_curso VARCHAR(20) NOT NULL UNIQUE,
  nombre_curso VARCHAR(150) NOT NULL,
  creditos INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Curso_Catedratico (
  id_curso INT NOT NULL,
  id_catedratico INT NOT NULL,
  PRIMARY KEY (id_curso, id_catedratico),
  CONSTRAINT fk_curso_catedratico_curso FOREIGN KEY (id_curso)
    REFERENCES Curso(id_curso) ON DELETE CASCADE,
  CONSTRAINT fk_curso_catedratico_catedratico FOREIGN KEY (id_catedratico)
    REFERENCES Catedratico(id_catedratico) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Calificacion (
  id_calificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_curso INT NOT NULL,
  nota DECIMAL(5,2) NOT NULL,
  periodo VARCHAR(30) NOT NULL,
  comentario TEXT NULL,
  CONSTRAINT chk_calificacion_nota CHECK (nota >= 0 AND nota <= 100),
  CONSTRAINT fk_calificacion_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_calificacion_curso FOREIGN KEY (id_curso)
    REFERENCES Curso(id_curso) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Publicacion (
  id_publicacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  tipo_entidad ENUM('curso', 'catedratico') NOT NULL,
  id_curso INT NULL,
  id_catedratico INT NULL,
  titulo VARCHAR(150) NULL,
  contenido TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_publicacion_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_publicacion_curso FOREIGN KEY (id_curso)
    REFERENCES Curso(id_curso) ON DELETE CASCADE,
  CONSTRAINT fk_publicacion_catedratico FOREIGN KEY (id_catedratico)
    REFERENCES Catedratico(id_catedratico) ON DELETE CASCADE,
  CONSTRAINT chk_publicacion_entidad CHECK (
    (tipo_entidad = 'curso' AND id_curso IS NOT NULL AND id_catedratico IS NULL)
    OR
    (tipo_entidad = 'catedratico' AND id_catedratico IS NOT NULL AND id_curso IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS Comentario (
  id_comentario INT AUTO_INCREMENT PRIMARY KEY,
  id_publicacion INT NOT NULL,
  id_usuario INT NOT NULL,
  contenido TEXT NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comentario_publicacion FOREIGN KEY (id_publicacion)
    REFERENCES Publicacion(id_publicacion) ON DELETE CASCADE,
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Curso_Aprobado (
  id_usuario INT NOT NULL,
  id_curso INT NOT NULL,
  fecha_aprobacion DATE NULL,
  PRIMARY KEY (id_usuario, id_curso),
  CONSTRAINT fk_cursoaprobado_usuario FOREIGN KEY (id_usuario)
    REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_cursoaprobado_curso FOREIGN KEY (id_curso)
    REFERENCES Curso(id_curso) ON DELETE CASCADE
);

CREATE INDEX idx_schema_persona_nombres ON Persona(nombres);
CREATE INDEX idx_schema_curso_nombre ON Curso(nombre_curso);
CREATE INDEX idx_schema_publicacion_fecha ON Publicacion(fecha_creacion);
CREATE INDEX idx_schema_publicacion_curso ON Publicacion(id_curso);
CREATE INDEX idx_schema_publicacion_catedratico ON Publicacion(id_catedratico);
CREATE INDEX idx_schema_calificacion_usuario ON Calificacion(id_usuario);
CREATE INDEX idx_schema_calificacion_curso ON Calificacion(id_curso);
