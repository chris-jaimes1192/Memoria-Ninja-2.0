# BiblioSENA — Sustentación de PostgreSQL (Ficha 3172526)

> Documento de apoyo para sustentar el script `BiblioSENA.sql`, ejecutable en **pgAdmin 4**. Explica el modelo de datos, dónde vive cada requisito del laboratorio y cómo se resolvieron los 5 retos, con los resultados esperados de los datos de prueba.

---

## 0. Resumen ejecutivo

| Ítem | Estado |
|---|---|
| Tablas base | 6 en 3NF (`editoriales`, `generos`, `autores`, `libros`, `libros_autores`, `prestamos`) |
| Tabla de apoyo | `usuarios` (aprendices) — requirida por `prestamos.id_usuario` y por el Reto 2 |
| Claves primarias | `SERIAL PK` en todas; **PK compuesta** en `libros_autores(id_libro, id_autor)` |
| Integridad | `FK`, `UNIQUE`, `NOT NULL`, `DEFAULT` y `CHECK` en todos los puntos que pide el laboratorio |
| Procedimientos | `sp_registrar_prestamo`, `sp_devolver_prestamo` |
| Función + disparador | `fn_actualizar_stock_prestamo()` → `trg_actualizar_stock_prestamo` (`AFTER INSERT`) |
| Consultas | Maestra (INNER JOIN 5 tablas), agrupación (GROUP BY/HAVING), LEFT JOIN, inventario |
| Ejecución | Todo el archivo corre de corrido en pgAdmin 4 (`.sql` idempotente: re-ejecutable) |

---

## 1. Modelo de datos (DDL)

### 1.1 Tablas y restricciones

| Tabla | Clave primaria | Claves foráneas | Constraints / defaults clave |
|---|---|---|---|
| `editoriales` | `id_editorial SERIAL PK` | — | `nombre UNIQUE`, `pais DEFAULT 'Colombia'` |
| `generos` | `id_genero SERIAL PK` | — | `nombre_genero UNIQUE` |
| `autores` | `id_autor SERIAL PK` | — | — |
| `libros` | `id_libro SERIAL PK` | → `editoriales`, → `generos` | `CHECK anio_publicacion > 1500`, `CHECK precio >= 0`, `CHECK stock >= 0`, `stock DEFAULT 0` |
| `libros_autores` | **compuesta** `(id_libro, id_autor)` | → `libros`, → `autores` | `ON DELETE CASCADE` en ambas FK (N:M) |
| `prestamos` | `id_prestamo SERIAL PK` | → `libros`, → `usuarios` | `fecha_prestamo DEFAULT CURRENT_DATE`, `fecha_devolucion NULL = sin devolver`, `estado DEFAULT 'Activo'` (Reto 1) |

**Decisión 3NF:** no hay redundancia — los datos descriptivos (editorial, género, autor) viven una sola vez en sus tablas padre; `libros` solo guarda sus FK; la relación N:M vive en `libros_autores`.

### 1.2 Por qué existe `usuarios`

El enunciado cita `prestamos.id_usuario INT` y en el Reto 2 pide cruzar *"usuarios/aprendices y los libros que tienen en préstamo"* (con `LEFT JOIN` no tiene sentido sin una tabla de usuarios). Se agregó `usuarios (id_usuario, nombre, correo, tipo DEFAULT 'Aprendiz')` como tabla de apoyo sin alterar las 6 tablas pedidas.

### 1.3 Restricción de borrado (CASCADE vs RESTRICT)

| Relación | Acción de borrado | Motivo |
|---|---|---|
| `libros_autores.id_libro` / `.id_autor` | **CASCADE** (lo pide el lab) | la relación N:M no debe sobrevivir a sus padres |
| `libros.id_editorial` / `.id_genero` | RESTRICT | una editorial no se borra si tiene libros |
| `prestamos.id_libro` | RESTRICT | un libro con préstamos no se borra |

---

## 2. DML — orden jerárquico de inserción

El script inserta siguiendo Padres → Hijas → Intermedias/Transaccionales:

1. **Padres:** `editoriales` → `generos` → `autores` → `usuarios`
2. **Hijas:** `libros` (necesita id de editorial y género)
3. **Intermedias:** `libros_autores` (necesita libros y autores)

> Los `prestamos` de prueba se insertan en la sección [6], **después del trigger**, para que el descuento de stock lo haga siempre el disparador y los datos queden consistentes.

`UPDATE` y `DELETE` seguros: todo con `WHERE` acotado (ej. `UPDATE libros ... WHERE id_libro = 5`). El ejemplo de DELETE usa un registro **temporal auto-contenido** (`INSERT` → `DELETE`) para demostrar el orden de borrado correcto (intermedia → hijo → padres) sin dañar los datos base.

---

## 3. Consultas SQL

### 3.1 Consulta maestra (INNER JOIN de 5 tablas)

Unifica `libros + editoriales + generos + libros_autores + autores`. Un libro con varios autores aparece una fila por autor.

```sql
SELECT l.id_libro, l.titulo, e.nombre AS "Editorial", g.nombre_genero AS "Género",
       a.nombre AS "Autor", l.stock AS "Stock Disponible"
FROM libros l
INNER JOIN editoriales e    ON l.id_editorial = e.id_editorial
INNER JOIN generos g        ON l.id_genero    = g.id_genero
INNER JOIN libros_autores la ON l.id_libro    = la.id_libro
INNER JOIN autores a        ON la.id_autor    = a.id_autor
ORDER BY l.titulo;
```

### 3.2 Agrupación con HAVING

Cantidad, stock total y precio promedio por género, solo géneros con más de 1 libro.

```sql
SELECT g.nombre_genero, COUNT(l.id_libro) AS cantidad,
       SUM(l.stock) AS stock_total, ROUND(AVG(l.precio), 2) AS precio_promedio
FROM generos g
INNER JOIN libros l ON l.id_genero = g.id_genero
GROUP BY g.nombre_genero
HAVING COUNT(l.id_libro) > 1;
```

**Resultado esperado** (tras los datos de prueba y demos):

| Género | Cantidad | Stock total | Precio promedio |
|---|---|---|---|
| Novela | 2 | 21 | 43500.00 |
| Fantasía | 3 | 13 | 42000.00 |
| Ciencia Ficción | ~~1~~ | — | — (filtrado por HAVING) |

---

## 4. Procedimientos y disparadores (PL/pgSQL)

### 4.1 `sp_registrar_prestamo(p_id_libro INT, p_id_usuario INT)`

| Paso | Validación | Resultado si falla |
|---|---|---|
| 1 | Existe el libro (`NOT EXISTS` sobre `libros`) | `RAISE EXCEPTION 'El libro ... no existe'` |
| 2 | `stock > 0` | `RAISE EXCEPTION '... no tiene stock disponible'` |
| 3 | Inserta en `prestamos` | — |

El descuento de stock **no** se hace dentro del procedimiento: lo hace el trigger (así cada préstamo actualiza stock aunque no pase por este SP).

### 4.2 Trigger de stock

```sql
CREATE TRIGGER trg_actualizar_stock_prestamo
    AFTER INSERT ON prestamos
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_stock_prestamo();
```

→ descuenta `−1` al stock del libro recién prestado (`NEW.id_libro`).

---

## 5. Retos resueltos

| Reto | Solución (dónde está en el script) |
|---|---|
| **1. Campo `estado`** | `ALTER TABLE prestamos ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'Activo';` — se aplica justo después del DDL de `prestamos`. |
| **2. LEFT JOIN usuarios/libros** | `usuarios LEFT JOIN prestamos ON ... AND p.estado = 'Activo' LEFT JOIN libros ...` → muestra TODOS los aprendices (los sin préstamo salen con `NULL`) y los libros en préstamo vigente. |
| **3. Editorial con mayor inventario** | `SUM(precio * stock)` agrupado por editorial, `ORDER BY ... DESC LIMIT 1`. |
| **4. `sp_devolver_prestamo`** | Valida que el préstamo exista y no esté ya devuelto (evita sumar stock dos veces); luego `SET fecha_devolucion = CURRENT_DATE, estado = 'Devuelto'` y `stock = stock + 1` del libro correspondiente. |
| **5. Alerta de stock en 0** | Se reemplaza la función con `CREATE OR REPLACE`: tras descontar, captura el stock con `SELECT ... INTO` y si `= 0` lanza `RAISE NOTICE 'ALERTA: ... quedó sin stock ...'`. Como se usa `CREATE OR REPLACE`, el trigger existente queda enlazado a la nueva versión sin tocar su definición. |

**Resultados esperados de los retos** con los datos de prueba:

- **Reto 1:** todo préstamo nace con `estado = 'Activo'` (visible en la consulta 7.5).
- **Reto 2:** Andrea → *Cien años de soledad* (Activo) · Brayan → *HP piedra filosofal* (Activo) · Camila → sin préstamo (`NULL`).
- **Reto 3:** **Editorial Planeta** — `45000*9 + 42000*12 = 909000`.
- **Reto 5:** al prestar *El hobbit* (stock 1) el mensaje `ALERTA: ... quedó sin stock (0 unidades)...` aparece en la pestaña *Messages* de pgAdmin.

---

## 6. Demostración de excepciones

En la sección [6] del script quedan comentados los `CALL` que lanzan errores a propósito (descomentarlos para verlos):

| Llamada comentada | Error esperado |
|---|---|
| `CALL sp_registrar_prestamo(999, 1);` | Libro inexistente |
| `CALL sp_registrar_prestamo(6, 2);` | Sin stock (ejecutar antes de la devolución del hobbit) |
| `CALL sp_devolver_prestamo(999);` | Préstamo inexistente |
| Re-ejecutar la devolución del hobbit | Préstamo ya devuelto (protege contra doble suma de stock) |

---

## 7. Cómo ejecutar

1. Abrir **pgAdmin 4** → conectar a la base deseada (ej. `biblio_sena`).
2. **Query Tool** (`Herramientas → Query Tool`) → abrir `BiblioSENA.sql`.
3. Ejecutar todo (F5). Las secciones [1] a [7] corren en orden y el script es **re-ejecutable** (los `DROP ... IF EXISTS` iniciales limpian el esquema).
4. Revisar pestañas:
   - **Data Output** → resultados de las consultas finales (sección [7]).
   - **Messages** → los `RAISE NOTICE` (préstamo registrado, alerta de stock en 0, devolución registrada).

**Compatibilidad:** PostgreSQL 12+ (`CREATE PROCEDURE`, `CALL`, `EXECUTE FUNCTION`). En versiones anteriores a la 11 se usaría `EXECUTE PROCEDURE` y funciones en vez de procedimientos.