const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

class DatabasePostgres {
  constructor(config = {}) {
    const poolConfig = {
      host: config.host || process.env.PGHOST || "localhost",
      port: config.port || process.env.PGPORT || 5432,
      database: config.database || process.env.PGDATABASE,
      user: config.user || process.env.PGUSER,
      password: config.password || process.env.PGPASSWORD,
    };

    const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;
    if (databaseUrl) {
      this.pool = new Pool({ connectionString: databaseUrl, ssl: config.ssl });
    } else {
      this.pool = new Pool(poolConfig);
    }

    this.ubicacion = "postgres";
    this.motor = "postgres";
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    const schemaPath = path.join(__dirname, "schema-postgres.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      await this.pool.query(schema);
    }
    this._initialized = true;
  }

  get db() {
    return this;
  }

  query(text, params) {
    return this.pool.query(text, params);
  }

  prepare(sql) {
    // Los repositorios usan "?" y "rowid" (estilo SQLite).
    // PostgreSQL exige $1,$2,... y su columna equivalente es "ctid"
    // La traducción ocurre en UN solo lugar: esta capa de infraestructura.
    let indice = 0;
    const sqlPostgres = sql
      .replace(/\?/g, () => `$${++indice}`)
      .replace(/\browid\b/gi, "ctid");

    return {
      run: async (...args) => {
        const res = await this.pool.query(sqlPostgres, args);
        return { changes: res.rowCount, lastInsertRowid: res.rows?.[0]?.id };
      },
      get: async (...args) => {
        const res = await this.pool.query(sqlPostgres, args);
        return res.rows[0] || undefined;
      },
      all: async (...args) => {
        const res = await this.pool.query(sqlPostgres, args);
        return res.rows;
      },
    };
  }

  close() {
    return this.pool.end();
  }
}

module.exports = DatabasePostgres;
