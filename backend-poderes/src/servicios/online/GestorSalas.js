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
const MODOS = new Set(["1v1", "2v2"]);

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
    this.colasMatchmaking = { "1v1": [], "2v2": [] };
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

  normalizarModo(modo) {
    return MODOS.has(modo) ? modo : "1v1";
  }

  normalizarConfig(config = {}) {
    const modo = this.normalizarModo(config.modo);
    const mezclarAldeas = config.mezclarAldeas !== false;
    const solicitadas = Number(config.pares) || 8;
    const pares = mezclarAldeas ? Math.min(Math.max(solicitadas, 8), 16) : 8;
    return { ...config, modo, mezclarAldeas, pares };
  }

  capacidadDeSala(sala) {
    return sala.config?.modo === "2v2" ? 4 : 2;
  }

  equipoDeAsiento(asiento) {
    return Number(asiento) < 2 ? "A" : "B";
  }

  otroEquipo(equipo) {
    return equipo === "A" ? "B" : "A";
  }

  equipoDeJugador(sala, token) {
    return sala.jugadores.find((j) => j.id === token)?.equipo || null;
  }

  jugadoresDeEquipo(sala, equipo) {
    return sala.jugadores.filter((j) => j.equipo === equipo);
  }

  jugadoresDisponiblesDeEquipo(sala, equipo) {
    return this.jugadoresDeEquipo(sala, equipo).filter((j) => j.conectado && !j.abandonado);
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

  equiposPublicos(sala) {
    const equipos = { A: [], B: [] };
    for (const jugador of sala.jugadores) {
      const equipo = jugador.equipo === "B" ? "B" : "A";
      equipos[equipo].push({
        id: jugador.id,
        nombre: jugador.nombre,
        asiento: jugador.asiento,
        conectado: !!jugador.conectado,
        abandonado: !!jugador.abandonado,
      });
    }
    return equipos;
  }

  vistaEstado(sala) {
    return {
      codigo: sala.codigo,
      idPartida: sala.idPartida || null,
      estado: sala.estado,
      config: sala.config,
      modo: sala.config?.modo || "1v1",
      capacidad: this.capacidadDeSala(sala),
      turno: sala.turno,
      turnoEquipo: sala.turnoEquipo || null,
      jugadores: sala.jugadores.map((j) => ({
        id: j.id,
        nombre: j.nombre,
        asiento: j.asiento,
        equipo: j.equipo,
        conectado: j.conectado,
        abandonado: !!j.abandonado,
      })),
      equipos: this.equiposPublicos(sala),
      mazo: this.mazoPublico(sala),
      cartasVolteadas: sala.cartasVolteadas.map((c) => ({
        index: c.index,
        valor: c.valor,
        aldea: c.aldea,
        jugadorId: c.jugadorId,
        equipo: c.equipo || null,
      })),
      movimientos: sala.movimientos,
      parejas: { ...sala.parejas },
      parejasEquipos: { A: sala.parejasEquipos?.A || 0, B: sala.parejasEquipos?.B || 0 },
      poderes: this.poderesPublicos(sala),
      chakra: sala.chakra ? { ...sala.chakra } : {},
      sustitucionArmada: sala.defensas?.sustitucion ? { ...sala.defensas.sustitucion } : {},
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
    const capacidad = this.capacidadDeSala(sala);
    return {
      codigo: sala.codigo,
      anfitrion: sala.anfitrion,
      jugadores: sala.jugadores.length,
      capacidad,
      faltan: Math.max(0, capacidad - sala.jugadores.length),
      modo: sala.config?.modo || "1v1",
      config: sala.config,
      publica: sala.publica,
      conContrasena: !!sala.contrasena,
      equipos: this.equiposPublicos(sala),
    };
  }

  inicializarEstadoSala(sala) {
    sala.jugadores.forEach((jugador, indice) => {
      if (!Number.isInteger(jugador.asiento)) jugador.asiento = indice;
      if (!jugador.equipo) jugador.equipo = this.equipoDeAsiento(jugador.asiento);
      jugador.abandonado = false;
    });

    sala.mazo = this.generarMazo(sala.config || {});
    sala.cartasVolteadas = [];
    sala.movimientos = 0;
    sala.bloqueada = false;
    sala.parejas = {};
    sala.parejasEquipos = { A: 0, B: 0 };
    sala.poderes = {};
    sala.chakra = {};
    sala.defensas = { sustitucion: {} };
    sala.poderEnProceso = null;
    for (const jugador of sala.jugadores) {
      sala.parejas[jugador.id] = 0;
      sala.poderes[jugador.id] = {};
      sala.chakra[jugador.id] = 100;
      sala.defensas.sustitucion[jugador.id] = { activa: false };
      for (const poder of PODERES) sala.poderes[jugador.id][poder] = USOS_PODER_INICIAL;
    }
    sala.turno = sala.jugadores[0]?.id || null;
    sala.turnoEquipo = sala.jugadores[0]?.equipo || null;
    sala.idPartida = crypto.randomUUID();
    sala.motivo = null;
    sala.estado = "jugando";
    this.limpiarTemporizadorLimpieza(sala);
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

  limpiarTemporizadorAbandono(sala, jugador = null) {
    if (jugador) {
      if (jugador.temporizadorAbandono) {
        clearTimeout(jugador.temporizadorAbandono);
        jugador.temporizadorAbandono = null;
      }
      return;
    }
    for (const actual of sala.jugadores) {
      if (actual.temporizadorAbandono) {
        clearTimeout(actual.temporizadorAbandono);
        actual.temporizadorAbandono = null;
      }
    }
    if (sala.temporizadorAbandono) {
      clearTimeout(sala.temporizadorAbandono);
      sala.temporizadorAbandono = null;
    }
  }

  limpiarTemporizadorLimpieza(sala) {
    if (sala.temporizadorLimpieza) {
      clearTimeout(sala.temporizadorLimpieza);
      sala.temporizadorLimpieza = null;
    }
  }

  terminarPartida(sala, ganador, motivo) {
    if (!sala || sala.estado === "terminada") return;
    this.limpiarTemporizadorAbandono(sala);
    sala.estado = "terminada";
    sala.motivo = motivo;

    const es2v2 = sala.config?.modo === "2v2";
    let ganadorId = null;
    let perdedorId = null;
    let ganadorEquipo = null;
    let perdedorEquipo = null;

    if (es2v2) {
      ganadorEquipo = ganador === "A" || ganador === "B" ? ganador : this.equipoDeJugador(sala, ganador);
      perdedorEquipo = ganadorEquipo ? this.otroEquipo(ganadorEquipo) : null;
      ganadorId = ganadorEquipo ? this.jugadoresDeEquipo(sala, ganadorEquipo)[0]?.id || null : null;
      perdedorId = perdedorEquipo ? this.jugadoresDeEquipo(sala, perdedorEquipo)[0]?.id || null : null;
    } else {
      ganadorId = ganador || null;
      perdedorId = ganadorId ? this.otroJugador(sala, ganadorId)?.id || null : null;
      ganadorEquipo = ganadorId ? this.equipoDeJugador(sala, ganadorId) : null;
      perdedorEquipo = perdedorId ? this.equipoDeJugador(sala, perdedorId) : null;
    }

    const parejasEquipos = { A: sala.parejasEquipos?.A || 0, B: sala.parejasEquipos?.B || 0 };
    const puntaje = es2v2
      ? ganadorEquipo
        ? parejasEquipos[ganadorEquipo] * 10
        : 0
      : ganadorId
        ? (sala.parejas[ganadorId] || 0) * 10
        : 0;

    this.io.to(sala.codigo).emit("partida-terminada", {
      codigo: sala.codigo,
      idPartida: sala.idPartida,
      modo: sala.config?.modo || "1v1",
      ganadorId,
      perdedorId,
      ganadorEquipo,
      perdedorEquipo,
      motivo,
      movimientos: sala.movimientos,
      parejas: { ...sala.parejas },
      parejasEquipos,
      puntaje,
      jugadores: sala.jugadores.map((j) => ({
        id: j.id,
        nombre: j.nombre,
        equipo: j.equipo,
        asiento: j.asiento,
      })),
      config: sala.config,
    });

    this.limpiarTemporizadorLimpieza(sala);
    sala.temporizadorLimpieza = setTimeout(() => this.salas.delete(sala.codigo), 30000);
    sala.temporizadorLimpieza.unref?.();
  }

  ganadorPorParejas(sala) {
    if (sala.config?.modo === "2v2") {
      const parejasA = sala.parejasEquipos?.A || 0;
      const parejasB = sala.parejasEquipos?.B || 0;
      if (parejasA === parejasB) return null;
      return parejasA > parejasB ? "A" : "B";
    }

    const [a, b] = sala.jugadores;
    if (!a || !b) return null;
    const parejasA = sala.parejas[a.id] || 0;
    const parejasB = sala.parejas[b.id] || 0;
    if (parejasA === parejasB) return null;
    return parejasA > parejasB ? a.id : b.id;
  }

  siguienteTurno(sala) {
    if (sala.config?.modo === "2v2") {
      const equipo = this.otroEquipo(sala.turnoEquipo);
      const disponibles = this.jugadoresDisponiblesDeEquipo(sala, equipo);
      const siguiente = disponibles[0] || this.jugadoresDeEquipo(sala, equipo)[0] || null;
      sala.turnoEquipo = siguiente?.equipo || equipo;
      sala.turno = siguiente?.id || null;
      return;
    }

    const siguiente = this.otroJugador(sala, sala.turno);
    sala.turno = siguiente?.id || null;
    sala.turnoEquipo = siguiente?.equipo || null;
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
      if (sala.config?.modo === "2v2") {
        this.terminarPartida(sala, this.otroEquipo(jugador.equipo), motivo);
      } else {
        this.terminarPartida(sala, this.otroJugador(sala, jugador.id)?.id || null, motivo);
      }
      return;
    }

    sala.jugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
    if (sala.jugadores.length === 0) {
      this.limpiarTemporizadorLimpieza(sala);
      this.salas.delete(codigo);
    } else {
      if (sala.creador === jugador.id) sala.creador = sala.jugadores[0].id;
      if (sala.estado !== "terminada") sala.estado = "esperando";
      this.salas.set(codigo, sala);
      this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));
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
          const config = this.normalizarConfig(datos.config || {});
          const codigo = this.generarCodigo();
          const nombre = this.normalizarNombre(datos.nombre);
          const sala = {
            codigo,
            jugadores: [
              {
                id: token,
                socketId: socket.id,
                nombre,
                listo: true,
                conectado: true,
                asiento: 0,
                equipo: "A",
                abandonado: false,
              },
            ],
            estado: "esperando",
            mazo: [],
            cartasVolteadas: [],
            movimientos: 0,
            parejas: {},
            parejasEquipos: { A: 0, B: 0 },
            poderes: {},
            turno: null,
            turnoEquipo: null,
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
            existente.abandonado = false;
            socket.join(codigo);
            socket.data.codigoSala = codigo;
            callback({ exito: true, codigo, sala: this.vistaPublica(sala), reincorporado: true });
            this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));
            return;
          }

          if (sala.jugadores.length >= this.capacidadDeSala(sala)) {
            return callback({ exito: false, error: "Sala llena" });
          }

          const asiento = sala.jugadores.length;
          const nombre = this.normalizarNombre(datos.nombre);
          sala.jugadores.push({
            id: token,
            socketId: socket.id,
            nombre,
            listo: true,
            conectado: true,
            asiento,
            equipo: this.equipoDeAsiento(asiento),
            abandonado: false,
          });
          socket.join(codigo);
          socket.data.codigoSala = codigo;
          this.salas.set(codigo, sala);
          callback({ exito: true, codigo, sala: this.vistaPublica(sala) });
          this.io.to(codigo).emit("sala-actualizada", this.vistaPublica(sala));

          if (sala.jugadores.length === this.capacidadDeSala(sala)) {
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
          if (
            sala.jugadores.length === this.capacidadDeSala(sala) &&
            sala.jugadores.every((j) => j.listo)
          ) {
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

          this.limpiarTemporizadorAbandono(sala, jugador);
          jugador.socketId = socket.id;
          jugador.conectado = true;
          jugador.abandonado = false;
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
        if (sala.poderEnProceso) return;
        const index = Number(datos.index);
        const jugador = this.jugadorPorSocket(sala, socket.id);
        if (!jugador || jugador.abandonado) return;

        const es2v2 = sala.config?.modo === "2v2";
        const tieneTurno = es2v2
          ? jugador.equipo === sala.turnoEquipo
          : sala.turno === jugador.id;
        if (!tieneTurno) return;
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
          equipo: jugador.equipo,
        });
        this.salas.set(sala.codigo, sala);
        this.io.to(sala.codigo).emit("carta-volteada", {
          jugadorId: jugador.id,
          equipo: jugador.equipo,
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
          if (!jugador || jugador.abandonado) return;
          const poderId = datos.poderId || datos.poder;
          if (!poderId || !PODERES.includes(poderId)) {
            socket.emit("poder-rechazado", { motivo: "invalido", mensaje: "Poder inválido" });
            return;
          }
          if (!sala.poderes[jugador.id]) sala.poderes[jugador.id] = {};
          for (const p of PODERES) {
            if (typeof sala.poderes[jugador.id][p] !== "number") sala.poderes[jugador.id][p] = USOS_PODER_INICIAL;
          }
          if (typeof sala.chakra[jugador.id] !== "number") sala.chakra[jugador.id] = 100;
          if (!sala.defensas) sala.defensas = { sustitucion: {} };
          if (!sala.defensas.sustitucion) sala.defensas.sustitucion = {};
          if (!sala.defensas.sustitucion[jugador.id]) sala.defensas.sustitucion[jugador.id] = { activa: false };

          const es2v2 = sala.config?.modo === "2v2";
          const tieneTurno = es2v2 ? jugador.equipo === sala.turnoEquipo : sala.turno === jugador.id;
          if (!tieneTurno) {
            socket.emit("poder-rechazado", { motivo: "sin_turno", mensaje: "No es tu turno" });
            return;
          }
          if (sala.poderEnProceso) {
            socket.emit("poder-rechazado", { motivo: "en_proceso", mensaje: "Hay un poder en proceso" });
            return;
          }
          if (sala.poderes[jugador.id][poderId] <= 0) {
            socket.emit("poder-rechazado", { motivo: "sin_usos", mensaje: "Sin usos" });
            return;
          }

          const costos = { sustitucion: 25, byakugan: 30, robo: 30, genjutsu: 35, sello: 40, bomba: 50 };
          const costo = costos[poderId] || 0;
          if (costo > 0 && sala.chakra[jugador.id] < costo) {
            socket.emit("poder-rechazado", { motivo: "sin_chakra", mensaje: "Chakra insuficiente" });
            return;
          }

          sala.poderes[jugador.id][poderId]--;
          if (costo > 0) sala.chakra[jugador.id] -= costo;

          sala.poderEnProceso = { jugadorId: jugador.id, poderId, equipo: jugador.equipo, hasta: Date.now() + 900 };
          this.salas.set(sala.codigo, sala);

          this.io.to(sala.codigo).emit("poder-activado", {
            jugadorId: jugador.id,
            nombre: jugador.nombre,
            equipo: jugador.equipo,
            poderId,
            usosRestantes: sala.poderes[jugador.id][poderId],
            chakra: sala.chakra[jugador.id],
          });

          if (poderId === "sustitucion") {
            sala.defensas.sustitucion[jugador.id] = { activa: true, desde: Date.now() };
            this.salas.set(sala.codigo, sala);
            this.io.to(sala.codigo).emit("poder-efecto", {
              tipo: "defensa",
              poderId,
              jugadorId: jugador.id,
              equipo: jugador.equipo,
              defensa: "sustitucion",
              activa: true,
            });
            setTimeout(() => {
              const actual = this.salas.get(sala.codigo);
              if (!actual) return;
              if (actual.defensas?.sustitucion?.[jugador.id]?.activa) {
                actual.defensas.sustitucion[jugador.id] = { activa: false };
                this.salas.set(actual.codigo, actual);
                this.io.to(actual.codigo).emit("poder-efecto", {
                  tipo: "defensa_expira",
                  poderId: "sustitucion",
                  jugadorId: jugador.id,
                  equipo: jugador.equipo,
                  defensa: "sustitucion",
                  activa: false,
                });
              }
            }, 8000).unref?.();
          } else if (poderId === "bomba") {
            const rivalJugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
            const objetivo = es2v2
              ? sala.jugadores.find((j) => j.equipo !== jugador.equipo && !j.abandonado)
              : rivalJugadores[0];
            if (objetivo) {
              let danio = 20;
              let consumidoSustitucion = false;
              if (sala.defensas?.sustitucion?.[objetivo.id]?.activa) {
                danio = 10;
                consumidoSustitucion = true;
                sala.defensas.sustitucion[objetivo.id] = { activa: false };
              }
              this.salas.set(sala.codigo, sala);
              this.io.to(sala.codigo).emit("poder-efecto", {
                tipo: "danio",
                poderId,
                jugadorId: jugador.id,
                equipo: jugador.equipo,
                objetivoId: objetivo.id,
                objetivoEquipo: objetivo.equipo,
                danio,
                consumidoSustitucion,
              });
            }
          } else if (poderId === "robo") {
            const rivalJugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
            const objetivo = es2v2
              ? sala.jugadores.find((j) => j.equipo !== jugador.equipo && !j.abandonado)
              : rivalJugadores[0];
            if (objetivo) {
              if (sala.defensas?.sustitucion?.[objetivo.id]?.activa) {
                sala.defensas.sustitucion[objetivo.id] = { activa: false };
                this.salas.set(sala.codigo, sala);
                this.io.to(sala.codigo).emit("poder-efecto", {
                  tipo: "evadido",
                  poderId,
                  jugadorId: jugador.id,
                  equipo: jugador.equipo,
                  objetivoId: objetivo.id,
                  objetivoEquipo: objetivo.equipo,
                  consumidoSustitucion: true,
                });
              } else {
                const robado = Math.min(20, typeof sala.chakra[objetivo.id] === "number" ? sala.chakra[objetivo.id] : 0);
                if (robado > 0) {
                  sala.chakra[objetivo.id] -= robado;
                  sala.chakra[jugador.id] = (sala.chakra[jugador.id] || 0) + robado;
                }
                this.salas.set(sala.codigo, sala);
                this.io.to(sala.codigo).emit("poder-efecto", {
                  tipo: "robo",
                  poderId,
                  jugadorId: jugador.id,
                  equipo: jugador.equipo,
                  objetivoId: objetivo.id,
                  objetivoEquipo: objetivo.equipo,
                  robado,
                  chakraAtacante: sala.chakra[jugador.id],
                  chakraObjetivo: sala.chakra[objetivo.id],
                });
              }
            }
          } else {
            this.io.to(sala.codigo).emit("poder-efecto", {
              tipo: "generico",
              poderId,
              jugadorId: jugador.id,
              equipo: jugador.equipo,
            });
          }

          setTimeout(() => {
            const actual = this.salas.get(sala.codigo);
            if (!actual) return;
            if (actual.poderEnProceso?.jugadorId === jugador.id) {
              actual.poderEnProceso = null;
              this.salas.set(actual.codigo, actual);
            }
          }, 1000).unref?.();
        } catch (error) {
          socket.emit("poder-rechazado", { motivo: "error", mensaje: "No se pudo activar el poder" });
        }
      });

      socket.on("revancha-sala", (datos = {}, callback = () => {}) => {
        try {
          const sala = this.salas.get(socket.data.codigoSala);
          if (!sala) return callback({ exito: false, error: "Sala no encontrada" });
          if (sala.estado !== "terminada") {
            return callback({ exito: false, error: "La partida todavía no terminó" });
          }
          if (sala.creador !== token) {
            return callback({ exito: false, error: "Solo el anfitrión puede iniciar la revancha" });
          }

          const conectados = sala.jugadores.filter((j) => j.conectado && !j.abandonado);
          if (conectados.length < this.capacidadDeSala(sala)) {
            return callback({ exito: false, error: "Faltan jugadores para iniciar la revancha" });
          }

          const config = this.normalizarConfig({
            ...sala.config,
            ...(datos.config || {}),
            modo: sala.config?.modo,
          });
          sala.config = config;
          this.iniciarPartida(sala, sala.codigo);
          callback({ exito: true, estado: this.vistaEstado(sala) });
        } catch (error) {
          callback({ exito: false, error: "No se pudo iniciar la revancha" });
        }
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
          if (sala.estado !== "esperando" || sala.jugadores.length >= this.capacidadDeSala(sala)) {
            return callback({ exito: false, error: "Sala no disponible" });
          }
          callback({ exito: true, sala: this.vistaPublica(sala) });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("buscar-partida", (datos = {}, callback = () => {}) => {
        try {
          const modo = this.normalizarModo(datos.modo);
          const requeridos = modo === "2v2" ? 4 : 2;
          const nombre = this.normalizarNombre(datos.nombre);
          const cola = this.colasMatchmaking[modo];
          const filtrada = cola.filter((c) => c.token !== token);
          filtrada.push({ token, nombre, socketId: socket.id, modo });
          this.colasMatchmaking[modo] = filtrada;

          if (filtrada.length < requeridos) {
            return callback({ exito: true, emparejado: false, esperando: true, modo });
          }

          const elegidos = filtrada.splice(0, requeridos);
          const sockets = elegidos.map((p) => this.io.sockets.sockets.get(p.socketId));
          if (sockets.some((s) => !s)) {
            this.colasMatchmaking[modo] = [...elegidos, ...filtrada];
            return callback({ exito: true, emparejado: false, esperando: true, modo });
          }

          const codigo = this.generarCodigo();
          const sala = {
            codigo,
            jugadores: elegidos.map((p, indice) => ({
              id: p.token,
              socketId: p.socketId,
              nombre: p.nombre,
              listo: true,
              conectado: true,
              asiento: indice,
              equipo: this.equipoDeAsiento(indice),
              abandonado: false,
            })),
            estado: "esperando",
            mazo: [],
            cartasVolteadas: [],
            movimientos: 0,
            parejas: {},
            parejasEquipos: { A: 0, B: 0 },
            poderes: {},
            turno: null,
            turnoEquipo: null,
            bloqueada: false,
            creador: elegidos[0].token,
            anfitrion: elegidos[0].nombre,
            creadoEn: Date.now(),
            publica: false,
            contrasena: null,
            config: this.normalizarConfig({ mezclarAldeas: true, pares: modo === "2v2" ? 12 : 10, modo }),
            temporizadorAbandono: null,
          };
          this.salas.set(codigo, sala);
          sockets.forEach((sock) => sock.join(codigo));
          sockets.forEach((sock, indice) => {
            sock.data.codigoSala = codigo;
          });
          this.iniciarPartida(sala, codigo);
          callback({ exito: true, emparejado: true, codigo, modo });
        } catch (error) {
          callback({ exito: false, error: "Error" });
        }
      });

      socket.on("cancelar-busqueda", () => {
        for (const modo of Object.keys(this.colasMatchmaking)) {
          this.colasMatchmaking[modo] = this.colasMatchmaking[modo].filter((c) => c.token !== token);
        }
      });

      socket.on("disconnect", () => {
        for (const modo of Object.keys(this.colasMatchmaking)) {
          this.colasMatchmaking[modo] = this.colasMatchmaking[modo].filter(
            (c) => c.socketId !== socket.id
          );
        }
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
            equipo: jugador.equipo,
            segundos: Math.round(this.tiempoReconexionMs / 1000),
          });
          this.limpiarTemporizadorAbandono(sala, jugador);
          jugador.temporizadorAbandono = setTimeout(() => {
            const actual = this.salas.get(codigo);
            if (!actual || actual.estado !== "jugando") return;
            const jugadorActual = this.jugadorPorToken(actual, jugador.id);
            if (!jugadorActual || jugadorActual.conectado) return;

            jugadorActual.abandonado = true;
            if (actual.config?.modo === "2v2") {
              const companero = this.jugadoresDisponiblesDeEquipo(actual, jugadorActual.equipo).find(
                (j) => j.id !== jugadorActual.id
              );
              if (companero) {
                if (actual.turno === jugadorActual.id) {
                  actual.turno = companero.id;
                  actual.turnoEquipo = companero.equipo;
                  this.io.to(actual.codigo).emit("turno-cambiado", {
                    turno: actual.turno,
                    turnoEquipo: actual.turnoEquipo,
                  });
                }
                return;
              }
              this.terminarPartida(actual, this.otroEquipo(jugadorActual.equipo), "abandono");
              return;
            }

            this.terminarPartida(actual, this.otroJugador(actual, jugadorActual.id)?.id || null, "abandono");
          }, this.tiempoReconexionMs);
          jugador.temporizadorAbandono.unref?.();
          return;
        }

        sala.jugadores = sala.jugadores.filter((j) => j.id !== jugador.id);
        if (sala.jugadores.length === 0) {
          this.limpiarTemporizadorLimpieza(sala);
          this.salas.delete(codigo);
        } else {
          if (sala.creador === jugador.id) sala.creador = sala.jugadores[0].id;
          if (sala.estado !== "terminada") sala.estado = "esperando";
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
    const actor = sala.jugadores.find((j) => j.id === c1.jugadorId) || null;
    const equipo = actor?.equipo || c1.equipo || sala.turnoEquipo;

    if (c1.valor === c2.valor && c1.aldea === c2.aldea) {
      sala.mazo[c1.index].emparejada = true;
      sala.mazo[c2.index].emparejada = true;
      sala.cartasVolteadas = [];
      sala.parejas[c1.jugadorId] = (sala.parejas[c1.jugadorId] || 0) + 1;
      if (equipo === "A" || equipo === "B") {
        sala.parejasEquipos[equipo] = (sala.parejasEquipos[equipo] || 0) + 1;
      }
      sala.turno = c1.jugadorId;
      sala.turnoEquipo = equipo;
      this.salas.set(sala.codigo, sala);
      this.io.to(sala.codigo).emit("acierto", {
        index1: c1.index,
        index2: c2.index,
        turno: sala.turno,
        turnoEquipo: equipo,
        movimientos: sala.movimientos,
        parejas: { ...sala.parejas },
        parejasEquipos: { ...sala.parejasEquipos },
      });

      if (sala.mazo.every((carta) => carta.emparejada)) {
        const ganador = this.ganadorPorParejas(sala);
        this.terminarPartida(sala, ganador, "completada");
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
      this.siguienteTurno(actual);
      this.salas.set(actual.codigo, actual);
      this.io.to(actual.codigo).emit("turno-cambiado", {
        turno: actual.turno,
        turnoEquipo: actual.turnoEquipo,
      });
    }, this.retardoFalloMs).unref?.();
  }

  obtenerListaSalasPublicas() {
    const lista = [];
    for (const sala of this.salas.values()) {
      if (
        sala.publica &&
        sala.estado === "esperando" &&
        sala.jugadores.length < this.capacidadDeSala(sala)
      ) {
        lista.push(this.vistaPublica(sala));
      }
    }
    return lista;
  }

  cerrar() {
    for (const sala of this.salas.values()) {
      this.limpiarTemporizadorAbandono(sala);
      this.limpiarTemporizadorLimpieza(sala);
    }
    this.salas.clear();
    this.colasMatchmaking = { "1v1": [], "2v2": [] };
    this.io.close();
  }
}

module.exports = GestorSalas;
