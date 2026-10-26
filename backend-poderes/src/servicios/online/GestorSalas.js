const { Server } = require("socket.io");
const crypto = require("crypto");

const ALDEAS_MEZCLADAS = [
  "akatsuki",
  "arena",
  "niebla",
  "nube",
  "roca",
  "konoha/hyuga",
  "konoha/sarutobi",
  "konoha/uchiha",
  "konoha/uzumaki",
];
const ALIAS_ALDEAS = {
  hyuga: "konoha/hyuga",
  sarutobi: "konoha/sarutobi",
  uchiha: "konoha/uchiha",
  uzumaki: "konoha/uzumaki",
  konoha: "konoha/uchiha",
  otros: "akatsuki",
};
const VALORES_CARTA = ["1", "2", "3", "4", "5", "6", "7", "8"];
const USOS_PODER_INICIAL = 2;
const PODERES = ["sustitucion", "byakugan", "robo", "genjutsu", "sello", "bomba"];

class GestorSalas {
  constructor(httpServer, opciones = {}) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
          : ["http://localhost:3000", "http://127.0.0.1:3000"],
        credentials: true,
      },
    });
    this.salas = new Map();
    this.colaMatchmaking = [];
    this.tiempoReconexionMs = opciones.tiempoReconexionMs ?? 15000;
    this.retardoFalloMs = opciones.retardoFalloMs ?? 800;
    this.inicializar();
  }

  generarCodigo() {
    let codigo;
    do {
      codigo = crypto.randomInt(1_000_000_000, 10_000_000_000).toString();
    } while (this.salas.has(codigo));
    return codigo;
  }

  normalizarNombre(nombre) {
    const limpio = String(nombre || "").trim().slice(0, 24);
    return limpio || "Jugador";
  }

  generarMazo(config = {}) {
    const mezclarAldeas = config.mezclarAldeas !== false;
    const solicitadas = Number(config.pares) || 8;
    const pares = Math.min(Math.max(solicitadas, 8), 16);

    let combinaciones;
    if (mezclarAldeas) {
      combinaciones = [];
      for (const aldea of ALDEAS_MEZCLADAS) {
        for (const valor of VALORES_CARTA) combinaciones.push({ aldea, valor });
      }
    } else {
      const solicitada = ALIAS_ALDEAS[config.aldea] || config.aldea;
      const aldea = ALDEAS_MEZCLADAS.includes(solicitada) ? solicitada : "arena";
      combinaciones = VALORES_CARTA.map((valor) => ({ aldea, valor }));
    }

    combinaciones.sort(() => Math.random() - 0.5);
    const elegidas = combinaciones.slice(0, Math.min(pares, combinaciones.length));

    const cartas = [];
    elegidas.forEach(({ aldea, valor }, indice) => {
      const parId = `${aldea}-${valor}-${indice}`;
      cartas.push({ parId, valor, aldea, emparejada: false });
      cartas.push({ parId, valor, aldea, emparejada: false });
    });
    cartas.sort(() => Math.random() - 0.5);
    return cartas;
  }

  mazoPublico(sala) {
    return sala.mazo.map((carta) => {
      if (carta.emparejada) {
        return { valor: carta.valor, aldea: carta.aldea, emparejada: true };
      }
      return { emparejada: false };
    });
  }

  vistaEstado(sala) {
    return {
      codigo: sala.codigo,
      estado: sala.estado,
      config: sala.config,
      turno: sala.turno,
      jugadores: sala.jugadores.map((j) => ({ id: j.id, nombre: j.nombre, conectado: j.conectado })),
      mazo: this.mazoPublico(sala),
      cartasVolteadas: sala.cartasVolteadas.map((c) => ({
        index: c.index,
        valor: c.valor,
        aldea: c.aldea,
        jugadorId: c.jugadorId,
      })),
      movimientos: sala.movimientos,
      parejas: { ...sala.parejas },
      poderes: this.poderesPublicos(sala),
    };
  }

  poderesPublicos(sala) {
    const resultado = {};
    for (const jugador of sala.jugadores) {
      resultado[jugador.id] = { ...(sala.poderes[jugador.id] || {}) };
    }
    return resultado;
  }

  vistaPublica(sala) {
    return {
      codigo: sala.codigo,
      anfitrion: sala.anfitrion,
      jugadores: sala.jugadores.length,
      config: sala.config,
      publica: sala.publica,
      conContrasena: !!sala.contrasena,
    };
  }

  inicializarEstadoSala(sala) {
    if (!sala.mazo || sala.mazo.length === 0) sala.mazo = this.generarMazo(sala.config || {});
    sala.cartasVolteadas = [];
    sala.movimientos = 0;
    sala.bloqueada = false;
    sala.parejas = {};
    sala.poderes = {};
    for (const jugador of sala.jugadores) {
      sala.parejas[jugador.id] = 0;
      sala.poderes[jugador.id] = {};
      for (const poder of PODERES) sala.poderes[jugador.id][poder] = USOS_PODER_INICIAL;
    }
    if (!sala.turno) sala.turno = sala.jugadores[0].id;
    sala.estado = "jugando";
  }

  iniciarPartida(sala, codigo) {
    this.inicializarEstadoSala(sala);
    this.salas.set(codigo, sala);
    this.io.to(codigo).emit("partida-iniciada", this.vistaEstado(sala));
    this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
  }

  jugadorPorToken(sala, token) {
    return sala.jugadores.find((j) => j.id === token);
  }

  jugadorPorSocket(sala, socketId) {
    return sala.jugadores.find((j) => j.socketId === socketId);
  }

  otroJugador(sala, token) {
    return sala.jugadores.find((j) => j.id !== token);
  }

  limpiarTemporizadorAbandono(sala) {
    if (sala.temporizadorAbandono) {
      clearTimeout(sala.temporizadorAbandono);
      sala.temporizadorAbandono = null;
    }
  }

  terminarPartida(sala, ganadorId, motivo) {
    if (!sala || sala.estado === "terminada") return;
    this.limpiarTemporizadorAbandono(sala);
    sala.estado = "terminada";
    sala.motivo = motivo;
    const perdedor = sala.jugadores.find((j) => j.id !== ganadorId);
    const puntaje = ganadorId ? (sala.parejas[ganadorId] || 0) * 10 : 0;
    this.io.to(sala.codigo).emit("partida-terminada", {
      codigo: sala.codigo,
      ganadorId: ganadorId || null,
      perdedorId: ganadorId ? perdedor?.id || null : null,
      motivo,
      movimientos: sala.movimientos,
      parejas: { ...sala.parejas },
      puntaje,
    });
    clearTimeout(sala.temporizadorLimpieza);
    sala.temporizadorLimpieza = setTimeout(() => this.salas.delete(sala.codigo), 30000);
    sala.temporizadorLimpieza.unref?.();
  }

  ganadorPorParejas(sala) {
    const [a, b] = sala.jugadores;
    const parejasA = sala.parejas[a.id] || 0;
    const parejasB = sala.parejas[b.id] || 0;
    if (parejasA === parejasB) return null;
    return parejasA > parejasB ? a.id : b.id;
  }

  sacarDeSala(socket, motivo = "salida") {
    const codigo = socket.data.codigoSala;
    socket.data.codigoSala = null;
    if (!codigo) return;
    const sala = this.salas.get(codigo);
    if (!sala) return;
    socket.leave(codigo);
    const jugador = this.jugadorPorSocket(sala, socket.id);
    if (!jugador) return;

    if (sala.estado === "jugando") {
      this.terminarPartida(sala, this.otroJugador(sala, jugador.id)?.id || null, motivo);
      return;
    }

    sala.jugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
    if (sala.jugadores.length === 0) {
      this.salas.delete(codigo);
    } else {
      sala.estado = "esperando";
      this.io.to(codigo).emit("sala-actualizada", sala);
    }
    this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
  }

  inicializar() {
    this.io.on("connection", (socket) => {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || token.length < 8 || token.length > 128) {
        socket.emit("error-sesion", { error: "Token de jugador inválido" });
        socket.disconnect(true);
        return;
      }
      socket.data.token = token;

      socket.on("crear-sala", (datos = {}, callback = () => {}) => {
        try {
          this.sacarDeSala(socket, "salida");
          const config = { ...(datos.config || {}) };
          if (!config.mezclarAldeas) config.pares = 8;
          const codigo = this.generarCodigo();
          const nombre = this.normalizarNombre(datos.nombre);
          const sala = {
            codigo,
            jugadores: [{ id: token, socketId: socket.id, nombre, listo: true, conectado: true }],
            estado: "esperando",
            mazo: [],
            cartasVolteadas: [],
            movimientos: 0,
            parejas: {},
            poderes: {},
            turno: null,
            bloqueada: false,
            creador: token,
            anfitrion: nombre,
            creadoEn: Date.now(),
            publica: datos.publica !== false,
            contrasena: datos.contrasena || null,
            config,
            temporizadorAbandono: null,
          };
          this.salas.set(codigo, sala);
          socket.join(codigo);
          socket.data.codigoSala = codigo;
          callback({ exito: true, codigo, sala: this.vistaPublica(sala) });
          this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));
          this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
        } catch (error) {
          callback({ exito: false, error: "Error al crear sala" });
        }
      });

      socket.on("unirse-sala", (datos = {}, callback = () => {}) => {
        try {
          const codigo = String(datos.codigo || "").toUpperCase();
          const sala = this.salas.get(codigo);
          if (!sala) return callback({ exito: false, error: "Sala no encontrada" });
          if (sala.estado !== "esperando") return callback({ exito: false, error: "Partida ya iniciada" });
          if (sala.contrasena && sala.contrasena !== datos.contrasena) {
            return callback({ exito: false, error: "Contraseña incorrecta" });
          }

          const existente = this.jugadorPorToken(sala, token);
          if (existente) {
            existente.socketId = socket.id;
            existente.conectado = true;
            socket.join(codigo);
            socket.data.codigoSala = codigo;
            callback({ exito: true, codigo, sala: this.vistaPublica(sala), reincorporado: true });
            this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));
            return;
          }

          if (sala.jugadores.length >= 2) return callback({ exito: false, error: "Sala llena" });

          const nombre = this.normalizarNombre(datos.nombre);
          sala.jugadores.push({ id: token, socketId: socket.id, nombre, listo: true, conectado: true });
          socket.join(codigo);
          socket.data.codigoSala = codigo;
          this.salas.set(codigo, sala);
          callback({ exito: true, codigo, sala: this.vistaPublica(sala) });
          this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));

          if (sala.jugadores.length === 2) {
            this.iniciarPartida(sala, codigo);
          } else {
            this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
          }
        } catch (error) {
          callback({ exito: false, error: "Error al unirse a sala" });
        }
      });

      socket.on("marcar-listo", (datos, callback = () => {}) => {
        try {
          if (typeof datos === "function") callback = datos;
          const sala = this.salas.get(socket.data.codigoSala);
          if (!sala) return callback({ exito: false, error: "Sala no encontrada" });
          const jugador = this.jugadorPorSocket(sala, socket.id);
          if (jugador) jugador.listo = !jugador.listo;
          this.io.to(sala.codigo).emit("sala-actualizada", this.vistaPublica(sala));
          if (sala.jugadores.length === 2 && sala.jugadores.every((j) => j.listo)) {
            this.iniciarPartida(sala, sala.codigo);
          }
          callback({ exito: true, sala: this.vistaPublica(sala) });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("reincorporarse-sala", (datos = {}, callback = () => {}) => {
        try {
          const codigo = String(datos.codigo || "").toUpperCase();
          const sala = this.salas.get(codigo);
          if (!sala) return callback({ exito: false, error: "La sala ya no existe" });
          const jugador = this.jugadorPorToken(sala, token);
          if (!jugador) return callback({ exito: false, error: "No perteneces a esta sala" });

          this.limpiarTemporizadorAbandono(sala);
          jugador.socketId = socket.id;
          jugador.conectado = true;
          socket.join(codigo);
          socket.data.codigoSala = codigo;
          this.salas.set(codigo, sala);
          this.io.to(codigo).emit("jugador-reconectado", {
            codigo,
            jugadorId: jugador.id,
            nombre: jugador.nombre,
          });
          callback({ exito: true, estado: this.vistaEstado(sala) });
        } catch (error) {
          callback({ exito: false, error: "Error al reincorporarse" });
        }
      });

      socket.on("voltear-carta", (datos = {}) => {
        const sala = this.salas.get(socket.data.codigoSala);
        if (!sala || sala.estado !== "jugando") return;
        const index = Number(datos.index);
        const jugador = this.jugadorPorSocket(sala, socket.id);
        if (!jugador || sala.turno !== jugador.id) return;
        if (sala.bloqueada || !Number.isInteger(index) || !sala.mazo[index]) return;
        const carta = sala.mazo[index];
        if (carta.emparejada) return;
        if (sala.cartasVolteadas.length >= 2) return;
        if (sala.cartasVolteadas.some((c) => c.index === index)) return;

        sala.cartasVolteadas.push({
          index,
          valor: carta.valor,
          aldea: carta.aldea,
          jugadorId: jugador.id,
        });
        this.salas.set(sala.codigo, sala);
        this.io.to(sala.codigo).emit("carta-volteada", {
          jugadorId: jugador.id,
          index,
          valor: carta.valor,
          aldea: carta.aldea,
        });

        if (sala.cartasVolteadas.length === 2) {
          this.resolverPareja(sala);
        }
      });

      socket.on("activar-poder", (datos = {}) => {
        try {
          const sala = this.salas.get(socket.data.codigoSala);
          if (!sala || sala.estado !== "jugando") return;
          const jugador = this.jugadorPorSocket(sala, socket.id);
          if (!jugador) return;
          const poder = datos.poder;
          if (!sala.poderes[jugador.id] || !PODERES.includes(poder)) return;
          if (sala.poderes[jugador.id][poder] <= 0) return;
          sala.poderes[jugador.id][poder]--;
          this.salas.set(sala.codigo, sala);
          this.io.to(sala.codigo).emit("poder-activado", {
            jugadorId: jugador.id,
            poder,
            usosRestantes: sala.poderes[jugador.id][poder],
          });
        } catch (error) {}
      });

      socket.on("abandonar-sala", () => this.sacarDeSala(socket, "abandono"));

      socket.on("listar-salas", (datos, callback = () => {}) => {
        try {
          if (typeof datos === "function") callback = datos;
          callback({ exito: true, salas: this.obtenerListaSalasPublicas() });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("buscar-sala-por-codigo", (datos = {}, callback = () => {}) => {
        try {
          const codigo = String(datos.codigo || "").toUpperCase();
          const sala = this.salas.get(codigo);
          if (!sala) return callback({ exito: false, error: "Sala no encontrada" });
          if (sala.estado !== "esperando" || sala.jugadores.length >= 2) {
            return callback({ exito: false, error: "Sala no disponible" });
          }
          callback({ exito: true, sala: this.vistaPublica(sala) });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("buscar-partida", (datos = {}, callback = () => {}) => {
        try {
          const nombre = this.normalizarNombre(datos.nombre);
          this.colaMatchmaking = this.colaMatchmaking.filter((c) => c.token !== token);
          this.colaMatchmaking.push({ token, nombre, socketId: socket.id });

          if (this.colaMatchmaking.length < 2) {
            return callback({ exito: true, emparejado: false, esperando: true });
          }

          const p1 = this.colaMatchmaking.shift();
          const p2 = this.colaMatchmaking.shift();
          const socket1 = this.io.sockets.sockets.get(p1.socketId);
          const socket2 = this.io.sockets.sockets.get(p2.socketId);
          if (!socket1 || !socket2) {
            this.colaMatchmaking.unshift(p1);
            if (socket2) this.colaMatchmaking.push(p2);
            return callback({ exito: true, emparejado: false, esperando: true });
          }

          const codigo = this.generarCodigo();
          const sala = {
            codigo,
            jugadores: [
              { id: p1.token, socketId: p1.socketId, nombre: p1.nombre, listo: true, conectado: true },
              { id: p2.token, socketId: p2.socketId, nombre: p2.nombre, listo: true, conectado: true },
            ],
            estado: "esperando",
            mazo: [],
            cartasVolteadas: [],
            movimientos: 0,
            parejas: {},
            poderes: {},
            turno: null,
            bloqueada: false,
            creador: p1.token,
            anfitrion: p1.nombre,
            creadoEn: Date.now(),
            publica: false,
            contrasena: null,
            config: { mezclarAldeas: true, pares: 10 },
            temporizadorAbandono: null,
          };
          this.salas.set(codigo, sala);
          socket1.join(codigo);
          socket2.join(codigo);
          socket1.data.codigoSala = codigo;
          socket2.data.codigoSala = codigo;
          this.iniciarPartida(sala, codigo);
          callback({ exito: true, emparejado: true, codigo });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("cancelar-busqueda", () => {
        this.colaMatchmaking = this.colaMatchmaking.filter((c) => c.token !== token);
      });

      socket.on("disconnect", () => {
        this.colaMatchmaking = this.colaMatchmaking.filter((c) => c.socketId !== socket.id);
        const codigo = socket.data.codigoSala;
        const sala = codigo ? this.salas.get(codigo) : null;
        if (!sala) {
          this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
          return;
        }
        const jugador = this.jugadorPorSocket(sala, socket.id);
        if (!jugador) return;

        if (sala.estado === "jugando") {
          jugador.conectado = false;
          this.io.to(codigo).emit("jugador-desconectado", {
            codigo,
            jugadorId: jugador.id,
            nombre: jugador.nombre,
            segundos: Math.round(this.tiempoReconexionMs / 1000),
          });
          this.limpiarTemporizadorAbandono(sala);
          sala.temporizadorAbandono = setTimeout(() => {
            const actual = this.salas.get(codigo);
            if (!actual || actual.estado !== "jugando") return;
            const jugadorActual = this.jugadorPorToken(actual, jugador.id);
            if (jugadorActual && !jugadorActual.conectado) {
              this.terminarPartida(actual, this.otroJugador(actual, jugador.id)?.id || null, "abandono");
            }
          }, this.tiempoReconexionMs);
          sala.temporizadorAbandono.unref?.();
          return;
        }

        sala.jugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
        if (sala.jugadores.length === 0) {
          this.salas.delete(codigo);
        } else {
          sala.estado = "esperando";
          this.salas.set(codigo, sala);
          this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));
        }
        this.io.emit("lista-salas-actualizada", this.obtenerListaSalasPublicas());
      });
    });
  }

  resolverPareja(sala) {
    sala.movimientos++;
    const [c1, c2] = sala.cartasVolteadas;

    if (c1.valor === c2.valor && c1.aldea === c2.aldea) {
      sala.mazo[c1.index].emparejada = true;
      sala.mazo[c2.index].emparejada = true;
      sala.cartasVolteadas = [];
      sala.parejas[sala.turno] = (sala.parejas[sala.turno] || 0) + 1;
      this.salas.set(sala.codigo, sala);
      this.io.to(sala.codigo).emit("acierto", {
        index1: c1.index,
        index2: c2.index,
        turno: sala.turno,
        movimientos: sala.movimientos,
        parejas: { ...sala.parejas },
      });

      if (sala.mazo.every((carta) => carta.emparejada)) {
        const ganadorId = this.ganadorPorParejas(sala);
        this.terminarPartida(sala, ganadorId, "completada");
      }
      return;
    }

    sala.bloqueada = true;
    this.salas.set(sala.codigo, sala);
    this.io.to(sala.codigo).emit("fallo", { index1: c1.index, index2: c2.index });

    setTimeout(() => {
      const actual = this.salas.get(sala.codigo);
      if (!actual || actual.estado !== "jugando") return;
      actual.cartasVolteadas = [];
      actual.bloqueada = false;
      actual.turno = this.otroJugador(actual, actual.turno)?.id || actual.turno;
      this.salas.set(actual.codigo, actual);
      this.io.to(actual.codigo).emit("turno-cambiado", { turno: actual.turno });
    }, this.retardoFalloMs).unref?.();
  }

  obtenerListaSalasPublicas() {
    const lista = [];
    for (const sala of this.salas.values()) {
      if (sala.publica && sala.estado === "esperando" && sala.jugadores.length < 2) {
        lista.push(this.vistaPublica(sala));
      }
    }
    return lista;
  }

  cerrar() {
    for (const sala of this.salas.values()) {
      this.limpiarTemporizadorAbandono(sala);
      clearTimeout(sala.temporizadorLimpieza);
    }
    this.salas.clear();
    this.colaMatchmaking = [];
    this.io.close();
  }
}

module.exports = GestorSalas;
