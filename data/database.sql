-- Base de Datos del proyecto sistema de gestion de trabajos con deteccion de plagio

-- Creando la base de datos


-- CREATE DATABASE IF NOT EXISTS data_origin;    -- IF NOT EXISTS para preguntar si ya existe
-- USE data_origin;                              -- Indicando que se usará cosmetics como base de datos

-- Creando las tablas necesarias para este proyecto


CREATE TABLE IF NOT EXISTS data_one
    (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        cdi_estu VARCHAR(15) NOT NULL UNIQUE,
        name_estu VARCHAR(100) NOT NULL,
        title_project TEXT NOT NULL,
        lineamiento VARCHAR (100) NOT NULL,
        periodo VARCHAR (10) NOT NULL,  
        name_tutor VARCHAR (100) NOT NULL,
        contact_tutor VARCHAR (100) NOT NULL  
    );
    
CREATE TABLE IF NOT EXISTS resultados_antiplagio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_data INT NOT NULL,
    similitud FLOAT,
    clasificacion VARCHAR(50),
    nivel_riesgo ENUM('Alto', 'Medio', 'Bajo') NOT NULL,
    fecha_analisis DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT resultados_antiplagio_ibfk_1
        FOREIGN KEY (id_data) REFERENCES data_one(id)
        ON DELETE CASCADE
);