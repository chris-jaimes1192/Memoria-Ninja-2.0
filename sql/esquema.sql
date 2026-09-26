-- ==========================================================
-- MEMORIA NINJA
-- ESQUEMA DE BASE DE DATOS (PostgreSQL)
--
-- Uso (Query Tool de pgAdmin4 o consola psql), apuntando a la
-- base configurada en backend/conexion.js:
--
--   psql -U postgres -d memoria_ninja -f sql/esquema.sql
--
-- El script es idempotente: se puede ejecutar varias veces.
-- ==========================================================

CREATE TABLE IF NOT EXISTS jugadores (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    nacimiento DATE,
    correo     VARCHAR(120) UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Las restricciones UNIQUE de arriba ya crean el índice que usan el
-- login (por nombre) y la verificación de correo (por correo), así que
-- no hace falta declarar índices adicionales aquí.
