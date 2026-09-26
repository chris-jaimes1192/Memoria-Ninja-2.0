const express = require('express');
const cors = require('cors');
const pool = require('./backend/conexion');

const app = express();

app.use(cors());
app.use(express.json());

// La tabla usa nombres en español (nombre, password) pero la entidad
// Usuario del frontend construye su estado con `usuario` y `pass`.
// Esta función traduce una fila de la BD al contrato de la API para que
// Usuario.desdeJSON() reciba las claves que espera.
const aUsuario = (fila) => ({
    id: fila.id,
    usuario: fila.nombre,
    nacimiento: fila.nacimiento,
    correo: fila.correo,
    pass: fila.password
});

app.get('/', (req, res) => {
    res.send('Servidor de Memoria Ninja funcionando');
});

app.get('/jugadores', async (req, res) => {

    try {

        const resultado = await pool.query(
            'SELECT * FROM jugadores'
        );

        res.json(resultado.rows.map(aUsuario));

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

app.post('/jugadores', async (req, res) => {

    try {

        const {
            nombre,
            password,
            nacimiento,
            correo
        } = req.body;

        const resultado = await pool.query(
            `INSERT INTO jugadores
            (nombre, password, nacimiento, correo)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                nombre,
                password,
                nacimiento,
                correo
            ]
        );

        res.json(aUsuario(resultado.rows[0]));

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

app.listen(3000, () => {

    console.log(
        'Servidor iniciado en http://localhost:3000'
    );

});