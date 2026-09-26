const express = require('express');
const cors = require('cors');
const pool = require('./backend/conexion');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor de Memoria Ninja funcionando');
});

app.get('/jugadores', async (req, res) => {

    try {

        const resultado = await pool.query(
            'SELECT * FROM jugadores'
        );

        res.json(resultado.rows);

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

        res.json(resultado.rows[0]);

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