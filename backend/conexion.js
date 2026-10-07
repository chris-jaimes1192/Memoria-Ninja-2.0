const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'memoria_ninja',
    password: '110408789Ae',
    port: 5432
});

pool.connect()
    .then(() => {
        console.log('Conectado correctamente a PostgreSQL');
    })
    .catch((error) => {
        console.log('Error al conectar con PostgreSQL:');
        console.log(error.message);
    });

module.exports = pool;