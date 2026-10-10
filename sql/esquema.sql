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
-- Contiene las 4 tablas: usuarios, partidas, historial_partidas, jugadores
-- ==========================================================

-- ---------- 1) usuarios (cuentas del backend-poderes) ----------
CREATE TABLE IF NOT EXISTS usuarios (
    id            TEXT PRIMARY KEY,
    usuario       TEXT NOT NULL UNIQUE,
    correo        TEXT NOT NULL UNIQUE,
    nacimiento    TEXT,
    password_hash TEXT NOT NULL,
    creado_en     TIMESTAMP NOT NULL DEFAULT now()
);

-- Perfil de juego (migración idempotente): cuenta nueva = 500 XP, resto en 0.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS xp          INTEGER NOT NULL DEFAULT 500;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS victorias   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS derrotas    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS racha       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS puntaje_max INTEGER NOT NULL DEFAULT 0;

-- ---------- 2) partidas (estado del juego serializado como JSON) ----------
CREATE TABLE IF NOT EXISTS partidas (
    id             TEXT PRIMARY KEY,
    estado_json    TEXT NOT NULL,
    creada_en      TIMESTAMP NOT NULL DEFAULT now(),
    actualizada_en TIMESTAMP NOT NULL DEFAULT now()
);

-- ---------- 3) historial_partidas (resultados; FK -> usuarios) ----------
CREATE TABLE IF NOT EXISTS historial_partidas (
    id         TEXT NOT NULL,
    id_usuario TEXT NOT NULL,
    id_partida TEXT,
    zona       TEXT,
    puntaje    INTEGER,
    modo       TEXT,
    ganador    TEXT,
    jugada_en  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT historial_partidas_pkey PRIMARY KEY (id),
    CONSTRAINT fk_historial_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
);

CREATE INDEX IF NOT EXISTS idx_historial_usuario
    ON historial_partidas (id_usuario, jugada_en DESC);

-- ---------- 4) jugadores (sistema antiguo; aislada) ----------
CREATE TABLE IF NOT EXISTS jugadores (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    nacimiento  DATE,
    correo      VARCHAR(120) UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    experiencia INTEGER DEFAULT 0
);

-- ---------- Función + trigger de partidas ----------
CREATE OR REPLACE FUNCTION fn_partidas_actualizar_fecha()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizada_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partidas_actualizar_fecha ON partidas;
CREATE TRIGGER trg_partidas_actualizar_fecha
    BEFORE UPDATE ON partidas
    FOR EACH ROW
    EXECUTE FUNCTION fn_partidas_actualizar_fecha();

-- ==========================================================
-- VISTAS (solo leen; no guardan datos)
-- ==========================================================

-- 1) Partidas más recientes
CREATE OR REPLACE VIEW vw_partidas_recientes AS
SELECT
    id,
    creada_en,
    actualizada_en
FROM partidas
ORDER BY actualizada_en DESC, creada_en DESC;

-- 2) Historial detallado (con nombre de usuario)
CREATE OR REPLACE VIEW vw_historial_detallado AS
SELECT
    h.id,
    h.id_usuario,
    u.usuario,
    h.id_partida,
    h.zona,
    h.puntaje,
    h.modo,
    h.ganador,
    h.jugada_en
FROM historial_partidas h
LEFT JOIN usuarios u ON u.id = h.id_usuario
ORDER BY h.jugada_en DESC;

-- 3) Ranking por mejor puntaje
CREATE OR REPLACE VIEW vw_ranking_mejor_puntaje AS
SELECT
    u.id AS id_usuario,
    u.usuario,
    MAX(h.puntaje) AS mejor_puntaje,
    COUNT(h.id) AS total_partidas,
    MAX(h.jugada_en) AS ultima_jugada
FROM historial_partidas h
INNER JOIN usuarios u ON u.id = h.id_usuario
GROUP BY u.id, u.usuario
ORDER BY mejor_puntaje DESC NULLS LAST, total_partidas DESC;

-- 4) Usuarios con resumen de historial
CREATE OR REPLACE VIEW vw_usuarios_resumen AS
SELECT
    u.id,
    u.usuario,
    u.correo,
    u.nacimiento,
    u.creado_en,
    COUNT(h.id) AS total_partidas,
    MAX(h.puntaje) FILTER (WHERE h.puntaje IS NOT NULL) AS max_puntaje,
    MAX(h.jugada_en) AS ultima_partida
FROM usuarios u
LEFT JOIN historial_partidas h ON h.id_usuario = u.id
GROUP BY u.id, u.usuario, u.correo, u.nacimiento, u.creado_en
ORDER BY total_partidas DESC, u.usuario ASC;

-- ==========================================================
-- PROCEDIMIENTOS ALMACENADOS (escriben en las tablas)
-- ==========================================================

-- 1) Registra el resultado de una partida de un usuario.
CREATE OR REPLACE PROCEDURE sp_registrar_partida(
    p_id_usuario TEXT,
    p_zona       TEXT,
    p_puntaje    INTEGER,
    p_modo       TEXT,
    p_ganador    TEXT
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    INSERT INTO historial_partidas (id, id_usuario, zona, puntaje, modo, ganador)
    VALUES (gen_random_uuid()::TEXT, p_id_usuario, p_zona, p_puntaje, p_modo, p_ganador);
END;
$BODY$;

-- 2) Crea una partida y registra su resultado en UNA sola operación
--    (atómica: o se hace todo, o no se hace nada).
CREATE OR REPLACE PROCEDURE sp_crear_partida_completa(
    p_id_partida  TEXT,
    p_estado_json TEXT,
    p_id_usuario  TEXT,
    p_zona        TEXT,
    p_puntaje     INTEGER,
    p_modo        TEXT,
    p_ganador     TEXT
)
LANGUAGE plpgsql
AS $BODY$
BEGIN
    INSERT INTO historial_partidas (id, id_usuario, id_partida, zona, puntaje, modo, ganador)
    VALUES (gen_random_uuid()::TEXT, p_id_usuario, p_id_partida, p_zona, p_puntaje, p_modo, p_ganador);

    INSERT INTO partidas (id, estado_json) VALUES (p_id_partida, p_estado_json);
END;
$BODY$;
