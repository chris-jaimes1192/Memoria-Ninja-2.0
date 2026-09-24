-- =====================================================================
--  BiblioSENA · Script completo PostgreSQL
--  Ficha 3172526 · SENA
--  Herramienta: pgAdmin 4 (Query Tool) — PostgreSQL 12 o superior
--
--  CONTENIDO:
--    [1] Limpieza previa (DROP, orden hijos -> padres)
--    [2] DDL: 6 tablas base en 3NF  (+ RETO 1: columna `estado`)
--    [3] DML: inserciones en orden jerárquico + UPDATE/DELETE con WHERE
--    [4] Consultas: INNER JOIN 5 tablas + GROUP BY/HAVING + RETO 2 y RETO 3
--    [5] PL/pgSQL: procedimientos + función/trigger de stock
--    [6] Datos de préstamo de prueba + llamadas de demostración (CALL)
--    [7] Verificación final de todas las consultas
--
--  Se cumple el orden de inserciones: Padres -> Hijas -> Intermedias/Transaccionales.
--  Los `CREATE OR REPLACE` permiten re-ejecutar el script sin errores.
-- =====================================================================


-- =====================================================================
-- [1] LIMPIEZA PREVIA
--     Se elimina en orden inverso a las dependencias para no violar las FK.
-- =====================================================================
DROP TRIGGER  IF EXISTS trg_actualizar_stock_prestamo ON prestamos;
DROP FUNCTION IF EXISTS fn_actualizar_stock_prestamo();
DROP PROCEDURE IF EXISTS sp_registrar_prestamo(INT, INT);
DROP PROCEDURE IF EXISTS sp_devolver_prestamo(INT);

DROP TABLE IF EXISTS prestamos     CASCADE;   -- transaccional (hija)
DROP TABLE IF EXISTS libros_autores CASCADE;  -- intermedia N:M
DROP TABLE IF EXISTS libros        CASCADE;   -- hija de editoriales/generos
DROP TABLE IF EXISTS autores       CASCADE;
DROP TABLE IF EXISTS generos       CASCADE;
DROP TABLE IF EXISTS editoriales   CASCADE;
DROP TABLE IF EXISTS usuarios      CASCADE;   -- tabla de apoyo (aprendices)


-- =====================================================================
-- [2] DDL — MODELO DE DATOS EN 3NF
-- =====================================================================

-- ---------------------------------------------------------------------
-- 2.1 EDITORIALES (padre)
-- ---------------------------------------------------------------------
CREATE TABLE editoriales (
    id_editorial SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL UNIQUE,
    pais         VARCHAR(50)  NOT NULL DEFAULT 'Colombia'
);


-- ---------------------------------------------------------------------
-- 2.2 GENEROS (padre)
-- ---------------------------------------------------------------------
CREATE TABLE generos (
    id_genero     SERIAL PRIMARY KEY,
    nombre_genero VARCHAR(50) NOT NULL UNIQUE
);


-- ---------------------------------------------------------------------
-- 2.3 AUTORES (padre)
-- ---------------------------------------------------------------------
CREATE TABLE autores (
    id_autor     SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    nacionalidad VARCHAR(50)
);


-- ---------------------------------------------------------------------
-- 2.4 LIBROS (hija de editoriales y generos)
--     CHECK: anio > 1500 · precio >= 0 · stock >= 0 (default 0)
-- ---------------------------------------------------------------------
CREATE TABLE libros (
    id_libro           SERIAL PRIMARY KEY,
    titulo             VARCHAR(150)  NOT NULL,
    anio_publicacion   INT           NOT NULL
        CONSTRAINT chk_anio_publicacion CHECK (anio_publicacion > 1500),
    precio             NUMERIC(10,2) NOT NULL
        CONSTRAINT chk_precio CHECK (precio >= 0),
    stock              INT           NOT NULL DEFAULT 0
        CONSTRAINT chk_stock CHECK (stock >= 0),
    id_editorial       INT           NOT NULL
        CONSTRAINT fk_libros_editorial REFERENCES editoriales(id_editorial)
        ON DELETE RESTRICT,                     -- no borrar editorial con libros
    id_genero          INT           NOT NULL
        CONSTRAINT fk_libros_genero REFERENCES generos(id_genero)
        ON DELETE RESTRICT
);


-- ---------------------------------------------------------------------
-- 2.5 LIBROS_AUTORES (tabla intermedia N:M)
--     PK compuesta (id_libro, id_autor) y ON DELETE CASCADE
-- ---------------------------------------------------------------------
CREATE TABLE libros_autores (
    id_libro INT NOT NULL
        CONSTRAINT fk_la_libro REFERENCES libros(id_libro)
        ON DELETE CASCADE,
    id_autor INT NOT NULL
        CONSTRAINT fk_la_autor REFERENCES autores(id_autor)
        ON DELETE CASCADE,
    PRIMARY KEY (id_libro, id_autor)
);


-- ---------------------------------------------------------------------
-- 2.6 USUARIOS (aprendices) — tabla de apoyo para `prestamos.id_usuario`
--     y para el RETO 2 (LEFT JOIN usuarios/aprendices).
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    correo     VARCHAR(100) UNIQUE,
    tipo       VARCHAR(20)  NOT NULL DEFAULT 'Aprendiz'
);


-- ---------------------------------------------------------------------
-- 2.7 PRESTAMOS (tabla transaccional)
-- ---------------------------------------------------------------------
CREATE TABLE prestamos (
    id_prestamo      SERIAL PRIMARY KEY,
    id_libro         INT  NOT NULL
        CONSTRAINT fk_prestamos_libro REFERENCES libros(id_libro)
        ON DELETE RESTRICT,                     -- no borrar libro con préstamos
    id_usuario       INT  NOT NULL
        CONSTRAINT fk_prestamos_usuario REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,
    fecha_prestamo   DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_devolucion DATE                            -- NULL = aún no devuelto
);

-- Índice recomendado para acelerar el JOIN en las consultas de préstamos
CREATE INDEX idx_prestamos_libro   ON prestamos(id_libro);
CREATE INDEX idx_prestamos_usuario ON prestamos(id_usuario);


-- =====================================================================
--  ██ RETO 1 (DDL & ALTER) ██
--  Agregar a `prestamos` el campo `estado` con default 'Activo'.
--  Se ejecuta DESPUÉS de la creación base de `prestamos`.
-- =====================================================================
ALTER TABLE prestamos
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'Activo';

-- Los registros existentes (si los hubiera) quedan como 'Activo' automáticamente
-- por el DEFAULT; esta línea lo aplica de forma explícita por seguridad:
UPDATE prestamos SET estado = 'Activo' WHERE estado = 'Activo';


-- =====================================================================
-- [3] DML — INSERCIONES EN ORDEN JERÁRQUICO
--    Padres (editoriales, generos, autores, usuarios) -> Hijas (libros)
--    -> Intermedias (libros_autores). Los `prestamos` de prueba se
--    insertan en la sección [6], DESPUÉS del trigger, para que el
--    descuento de stock quede siempre consistente.
-- =====================================================================

-- 3.1 PADRES
INSERT INTO editoriales (nombre, pais) VALUES
    ('Editorial Planeta',            'Colombia'),
    ('Norma',                        'Colombia'),
    ('Penguin Random House',         'España'),
    ('Panamericana Editorial',       'Colombia');

INSERT INTO generos (nombre_genero) VALUES
    ('Novela'),
    ('Fantasía'),
    ('Ciencia Ficción'),
    ('Historia');

INSERT INTO autores (nombre, nacionalidad) VALUES
    ('Gabriel García Márquez', 'Colombia'),
    ('J.K. Rowling',           'Reino Unido'),
    ('Isaac Asimov',            'Estados Unidos'),
    ('J.R.R. Tolkien',          'Reino Unido');

INSERT INTO usuarios (nombre, correo) VALUES
    ('Andrea Martínez', 'andrea.martinez@misena.edu.co'),
    ('Brayan Rodríguez','brayan.rodriguez@misena.edu.co'),
    ('Camila Torres',   'camila.torres@misena.edu.co');

-- 3.2 HIJAS
INSERT INTO libros (titulo, anio_publicacion, precio, stock, id_editorial, id_genero) VALUES
    ('Cien años de soledad',                    1967, 45000, 10, 1, 1),
    ('El amor en los tiempos del cólera',       1985, 42000, 12, 1, 1),
    ('Harry Potter y la piedra filosofal',      1997, 39000,  8, 3, 2),
    ('Harry Potter y la cámara secreta',        1998, 39000,  5, 3, 2),
    ('Fundación',                               1951, 35000,  6, 2, 3),
    ('El hobbit',                               1937, 48000,  1, 4, 2);

-- 3.3 INTERMEDIA (relación N:M libros-autores)
INSERT INTO libros_autores (id_libro, id_autor) VALUES
    (1, 1),  -- Cien años de soledad -> García Márquez
    (2, 1),  -- El amor en los tiempos del cólera -> García Márquez
    (3, 2),  -- HP piedra filosofal -> Rowling
    (4, 2),  -- HP cámara secreta -> Rowling
    (5, 3),  -- Fundación -> Asimov
    (6, 4);  -- El hobbit -> Tolkien

-- ---------------------------------------------------------------------
-- 3.4 UPDATE SEGURO (siempre con WHERE acotado)
-- ---------------------------------------------------------------------
-- Reposición de stock de un único libro identificado por su PK (la forma
-- más segura de acotar un UPDATE: afecta exactamente una fila):
UPDATE libros
SET    stock = stock + 5
WHERE  id_libro = 5;                  -- 'Fundación' (6 -> 11)

-- ---------------------------------------------------------------------
-- 3.5 DELETE SEGURO (cambia solo lo que cumple el WHERE)
--     Primero se quitan las dependencias (intermedia) y luego el padre.
--     Se usa un registro TEMPORAL auto-contenido para no alterar los
--     datos base que usan las consultas y demos posteriores.
-- ---------------------------------------------------------------------
INSERT INTO editoriales (nombre) VALUES ('Editorial Demo');
INSERT INTO autores (nombre, nacionalidad) VALUES ('Autor Demo', 'Desconocida');
INSERT INTO libros (titulo, anio_publicacion, precio, stock, id_editorial, id_genero)
SELECT 'Libro Demo', 2001, 10000, 0,
       (SELECT id_editorial FROM editoriales WHERE nombre = 'Editorial Demo'),
       (SELECT id_genero    FROM generos     WHERE nombre_genero = 'Historia');
INSERT INTO libros_autores (id_libro, id_autor)
SELECT l.id_libro, a.id_autor
FROM   libros l, autores a
WHERE  l.titulo = 'Libro Demo' AND a.nombre = 'Autor Demo';

-- Borrado en orden correcto: intermedia -> hijo -> padres
DELETE FROM libros_autores WHERE id_libro = (SELECT id_libro FROM libros WHERE titulo = 'Libro Demo');
DELETE FROM libros         WHERE titulo   = 'Libro Demo';
DELETE FROM autores        WHERE nombre   = 'Autor Demo';
DELETE FROM editoriales    WHERE nombre   = 'Editorial Demo';   -- seguro: WHERE por UNIQUE


-- =====================================================================
-- [4] CONSULTAS SQL
-- =====================================================================

-- ---------------------------------------------------------------------
-- 4.1 CONSULTA MAESTRA — INNER JOIN de 5 tablas
--     libros + editoriales + generos + libros_autores + autores
--     (si un libro tiene varios autores, aparece una fila por autor)
-- ---------------------------------------------------------------------
SELECT
    l.id_libro              AS "ID Libro",
    l.titulo                AS "Título",
    e.nombre                AS "Editorial",
    g.nombre_genero         AS "Género",
    a.nombre                AS "Autor",
    l.stock                 AS "Stock Disponible"
FROM libros l
INNER JOIN editoriales e   ON l.id_editorial = e.id_editorial
INNER JOIN generos g       ON l.id_genero    = g.id_genero
INNER JOIN libros_autores la ON l.id_libro   = la.id_libro
INNER JOIN autores a       ON la.id_autor    = a.id_autor
ORDER BY l.titulo;


-- ---------------------------------------------------------------------
-- 4.2 CONSULTA CON AGRUPACIÓN — Group By + Having
--     Cantidad de libros, stock total y precio promedio por género,
--     solo para géneros con MÁS de 1 libro.
-- ---------------------------------------------------------------------
SELECT
    g.nombre_genero                              AS "Género",
    COUNT(l.id_libro)                            AS "Cantidad Libros",
    SUM(l.stock)                                 AS "Stock Total",
    ROUND(AVG(l.precio), 2)                      AS "Precio Promedio"
FROM generos g
INNER JOIN libros l ON l.id_genero = g.id_genero
GROUP BY g.nombre_genero
HAVING COUNT(l.id_libro) > 1                      -- filtra géneros con <= 1 libro
ORDER BY "Cantidad Libros" DESC;


-- =====================================================================
--  ██ RETO 2 (LEFT JOIN) ██
--  Muestra TODOS los usuarios/aprendices (incluidos los que no tienen
--  préstamos: aparecen con NULL) y los libros que tienen en préstamo
--  actualmente (estado 'Activo').
-- =====================================================================
SELECT
    u.id_usuario      AS "ID Aprendiz",
    u.nombre          AS "Aprendiz",
    l.id_libro        AS "ID Libro",
    l.titulo          AS "Libro Prestado",
    p.fecha_prestamo  AS "Fecha Préstamo",
    p.estado          AS "Estado"
FROM usuarios u
LEFT JOIN prestamos p
       ON p.id_usuario = u.id_usuario
      AND p.estado     = 'Activo'          -- préstamo vigente
LEFT JOIN libros l
       ON l.id_libro   = p.id_libro
ORDER BY u.nombre, l.titulo;


-- =====================================================================
--  ██ RETO 3 (Agrupación de inventario) ██
--  Editorial con el MAYOR valor total acumulado en inventario.
-- =====================================================================
SELECT
    e.nombre                                AS "Editorial",
    SUM(l.precio * l.stock)                 AS "Valor Total de Inventario"
FROM editoriales e
INNER JOIN libros l ON l.id_editorial = e.id_editorial
GROUP BY e.id_editorial, e.nombre
ORDER BY "Valor Total de Inventario" DESC
LIMIT 1;


-- =====================================================================
-- [5] PL/pgSQL — PROCEDIMIENTOS ALMACENADOS Y TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5.1 PROCEDIMIENTO sp_registrar_prestamo
--     Recibe p_id_libro y p_id_usuario.
--     Valida que el libro exista y tenga stock > 0 (RAISE EXCEPTION)
--     y luego inserta el préstamo. El stock lo descuenta el TRIGGER.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_prestamo(
    p_id_libro  INT,
    p_id_usuario INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INT;
BEGIN
    -- 1) Validar existencia del libro
    IF NOT EXISTS (SELECT 1 FROM libros WHERE id_libro = p_id_libro) THEN
        RAISE EXCEPTION 'El libro con id % no existe.', p_id_libro;
    END IF;

    -- 2) Validar stock disponible
    SELECT stock INTO v_stock FROM libros WHERE id_libro = p_id_libro;
    IF v_stock <= 0 THEN
        RAISE EXCEPTION 'El libro con id % no tiene stock disponible (stock actual: %).',
                        p_id_libro, v_stock;
    END IF;

    -- 3) Insertar el préstamo (estado toma el DEFAULT 'Activo')
    INSERT INTO prestamos (id_libro, id_usuario)
    VALUES (p_id_libro, p_id_usuario);

    RAISE NOTICE 'Préstamo registrado: libro % -> usuario %.', p_id_libro, p_id_usuario;
END;
$$;


-- ---------------------------------------------------------------------
-- 5.2 FUNCIÓN + TRIGGER de stock (VERSIÓN BASE)
--     Descuenta 1 de stock al prestar un libro.
--     (En el RETO 5 se reemplaza esta función por la versión con alerta.)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_actualizar_stock_prestamo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE libros
    SET    stock = stock - 1
    WHERE  id_libro = NEW.id_libro;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_actualizar_stock_prestamo
    AFTER INSERT ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_stock_prestamo();   -- PG 11+: EXECUTE FUNCTION


-- =====================================================================
--  ██ RETO 4 (Procedimiento de devolución) ██
--  sp_devolver_prestamo(p_id_prestamo): registra fecha_devolucion =
--  CURRENT_DATE, marca estado 'Devuelto' y suma +1 al stock del libro.
-- =====================================================================
CREATE OR REPLACE PROCEDURE sp_devolver_prestamo(p_id_prestamo INT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_libro      INT;
    v_fecha_dev     DATE;
BEGIN
    -- Ubicar el préstamo y el libro asociado
    SELECT id_libro, fecha_devolucion
      INTO v_id_libro, v_fecha_dev
    FROM prestamos
    WHERE id_prestamo = p_id_prestamo;

    IF v_id_libro IS NULL THEN
        RAISE EXCEPTION 'El préstamo con id % no existe.', p_id_prestamo;
    END IF;

    -- Evita devoluciones dobles (no sumar stock dos veces)
    IF v_fecha_dev IS NOT NULL THEN
        RAISE EXCEPTION 'El préstamo % ya fue devuelto el %.', p_id_prestamo, v_fecha_dev;
    END IF;

    -- Actualizar la devolución
    UPDATE prestamos
    SET    fecha_devolucion = CURRENT_DATE,
           estado           = 'Devuelto'
    WHERE  id_prestamo = p_id_prestamo;

    -- Retornar el +1 al inventario
    UPDATE libros
    SET    stock = stock + 1
    WHERE  id_libro = v_id_libro;

    RAISE NOTICE 'Devolución registrada para el préstamo %.', p_id_prestamo;
END;
$$;


-- =====================================================================
--  ██ RETO 5 (Control de excepciones en trigger) ██
--  Reemplaza la función del trigger de stock: tras descontar, si el
--  stock llega a 0, lanza una alerta por consola con RAISE NOTICE.
--  Como se usa CREATE OR REPLACE, el trigger existente (sección 5.2)
--  queda enlazado a la NUEVA versión automáticamente.
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_actualizar_stock_prestamo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INT;
BEGIN
    -- Descuento normal del stock
    UPDATE libros
    SET    stock = stock - 1
    WHERE  id_libro = NEW.id_libro;

    -- Comprobar si el stock quedó en 0
    SELECT stock INTO v_stock FROM libros WHERE id_libro = NEW.id_libro;

    IF v_stock = 0 THEN
        RAISE NOTICE 'ALERTA: el libro con id % quedó sin stock (0 unidades) tras el préstamo.',
                     NEW.id_libro;
    END IF;

    RETURN NEW;
END;
$$;


-- =====================================================================
-- [6] DATOS DE PRÉSTAMO DE PRUEBA + DEMOSTRACIÓN (CALL)
--     Se insertan DESPUÉS del trigger para que el stock se descuente solo.
-- =====================================================================

-- Prestamos vigentes (usuario 1 -> libro 1 · usuario 2 -> libro 3)
CALL sp_registrar_prestamo(1, 1);
CALL sp_registrar_prestamo(3, 2);

-- Préstamo del libro 6 ('El hobbit': stock 1 -> 0).
-- Dispara el RAISE NOTICE del RETO 5:
CALL sp_registrar_prestamo(6, 1);

-- Este CALL (descomentado, ANTES de devolver) genera el ERROR por stock en 0:
-- CALL sp_registrar_prestamo(6, 2);

SELECT id_libro, titulo, stock
FROM   libros
WHERE  id_libro IN (1, 3, 5, 6)
ORDER  BY id_libro;

-- Devolución (RETO 4): suma +1 al stock y marca la fecha.
-- Localizamos el préstamo de 'El hobbit' sin depender del id exacto de SERIAL:
CALL sp_devolver_prestamo(
    (SELECT id_prestamo FROM prestamos WHERE id_libro = 6 ORDER BY id_prestamo DESC LIMIT 1)
);

-- Pruebas de excepciones (descomentar para ver los errores):
-- CALL sp_registrar_prestamo(999, 1);   -- ERROR: libro inexistente
-- CALL sp_devolver_prestamo(999);       -- ERROR: préstamo inexistente
-- Re-ejecutar la devolución anterior (mismo CALL de arriba): ERROR: préstamo ya devuelto


-- =====================================================================
-- [7] VERIFICACIÓN FINAL — re-ejecución de las consultas clave
-- =====================================================================

-- 7.1 Maestra (5 tablas)
SELECT
    l.id_libro, l.titulo, e.nombre AS editorial, g.nombre_genero AS genero,
    a.nombre AS autor, l.stock
FROM libros l
INNER JOIN editoriales e    ON l.id_editorial = e.id_editorial
INNER JOIN generos g        ON l.id_genero    = g.id_genero
INNER JOIN libros_autores la ON l.id_libro    = la.id_libro
INNER JOIN autores a        ON la.id_autor    = a.id_autor
ORDER BY l.titulo;

-- 7.2 Agrupación por género (solo >1 libro)
SELECT
    g.nombre_genero,
    COUNT(l.id_libro)   AS cantidad,
    SUM(l.stock)        AS stock_total,
    ROUND(AVG(l.precio), 2) AS precio_promedio
FROM generos g
INNER JOIN libros l ON l.id_genero = g.id_genero
GROUP BY g.nombre_genero
HAVING COUNT(l.id_libro) > 1;

-- 7.3 RETO 2: aprendices y préstamos vigentes (LEFT JOIN)
SELECT
    u.nombre AS aprendiz, l.titulo AS libro_prestado, p.fecha_prestamo, p.estado
FROM usuarios u
LEFT JOIN prestamos p ON p.id_usuario = u.id_usuario AND p.estado = 'Activo'
LEFT JOIN libros l    ON l.id_libro   = p.id_libro
ORDER BY u.nombre;

-- 7.4 RETO 3: editorial con mayor valor de inventario
SELECT
    e.nombre AS editorial,
    SUM(l.precio * l.stock) AS valor_total_inventario
FROM editoriales e
INNER JOIN libros l ON l.id_editorial = e.id_editorial
GROUP BY e.id_editorial, e.nombre
ORDER BY valor_total_inventario DESC
LIMIT 1;

-- 7.5 RETO 4: estado de préstamos (devoluciones registradas)
SELECT id_prestamo, id_libro, id_usuario, fecha_prestamo, fecha_devolucion, estado
FROM   prestamos
ORDER  BY id_prestamo;