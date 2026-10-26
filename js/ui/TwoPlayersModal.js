import { BaseModal } from './BaseModal.js';
import { clienteMultijugador } from '../multijugador/ClienteMultijugador.js';

const TEXTO_SALAS_VACIO = 'No hay salas disponibles. ¡Crea la primera!';

export class TwoPlayersModal extends BaseModal {
  constructor(modalId, salaService) {
    super(modalId);
    this.salaService = salaService;
    this.salaPendienteContrasena = null;
    this.configurarSocket();
    this.inicializarEventos();
    this.inicializarCrearSala();
  }

  configurarSocket() {
    clienteMultijugador.on('sala-actualizada', (sala) => {
      if (sala?.codigo && sala?.jugadores >= 2) {
        document.getElementById('panelEsperandoRival')?.setAttribute('hidden', 'true');
      }
    });
    clienteMultijugador.on('lista-salas-actualizada', (salas) => {
      this.pintarListaSalas(salas || []);
    });
    clienteMultijugador.on('partida-iniciada', (datos) => {
      if (this.redirectEnCurso) return;
      this.redirectEnCurso = true;
      document.getElementById('panelEsperandoRival')?.setAttribute('hidden', 'true');
      document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
      const codigo = datos?.codigo || clienteMultijugador.codigoSala || '';
      window.location.href = `game-online.html?codigo=${encodeURIComponent(codigo)}`;
    });
  }

  async abrir() {
    super.abrir();
    this.redirectEnCurso = false;
    try {
      await clienteMultijugador.conectar();
    } catch (error) {
      this.mostrarMensajeVacio('El multijugador requiere el backend corriendo (npm start).');
      return;
    }
    this.mostrarMensajeVacio(TEXTO_SALAS_VACIO);
    this.ocultarTodosLosPaneles();
    document.getElementById('panelCrearSala')?.setAttribute('hidden', 'true');
    document.getElementById('panelEsperandoRival')?.setAttribute('hidden', 'true');
    document.getElementById('panelBuscarCodigo')?.setAttribute('hidden', 'true');
    document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
    document.getElementById('modalContrasenaSala')?.classList.remove('activo');
    this.actualizarListaSalas();
  }

  ocultarTodosLosPaneles() {
    ['panelCrearSala', 'panelEsperandoRival', 'panelBuscarCodigo', 'panelPartidaRapida'].forEach(id => {
      document.getElementById(id)?.setAttribute('hidden', 'true');
    });
  }

  mostrarMensajeVacio(mensaje) {
    const vacio = document.getElementById('salasVacio');
    if (!vacio) return;
    vacio.hidden = false;
    vacio.textContent = mensaje;
  }

  async actualizarListaSalas() {
    try {
      const res = await clienteMultijugador.listarSalas();
      if (res?.exito) this.pintarListaSalas(res.salas || []);
      else this.pintarListaSalas([]);
    } catch {
      this.pintarListaSalas([]);
    }
  }

  pintarListaSalas(salas) {
    const contenedor = document.getElementById('listaSalas');
    const vacio = document.getElementById('salasVacio');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    if (!salas || salas.length === 0) {
      if (vacio) {
        vacio.hidden = false;
        vacio.textContent = TEXTO_SALAS_VACIO;
      }
      return;
    }
    if (vacio) vacio.hidden = true;
    salas.forEach(sala => {
      const card = document.createElement('div');
      card.className = 'sala-card';
      const pares = sala.config?.pares || 8;
      const mezclar = sala.config?.mezclarAldeas ? 'MEZCLADO' : `ALDEA: ${(sala.config?.aldea || 'KONOHA').toUpperCase()}`;

      const info = document.createElement('div');
      info.className = 'sala-card-info';
      const linea1 = document.createElement('div');
      const fuerte = document.createElement('strong');
      fuerte.textContent = sala.anfitrion || 'Jugador';
      linea1.appendChild(fuerte);
      linea1.appendChild(document.createTextNode(` · ${sala.jugadores}/2`));
      const linea2 = document.createElement('div');
      linea2.textContent = `${pares} PAREJAS · ${mezclar}${sala.conContrasena ? ' 🔒' : ''}`;
      info.appendChild(linea1);
      info.appendChild(linea2);

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-unirse-sala-pequeno';
      boton.textContent = 'UNIRSE';
      boton.addEventListener('click', () => this.solicitarUnirse(sala));

      card.appendChild(info);
      card.appendChild(boton);
      contenedor.appendChild(card);
    });
  }

  solicitarUnirse(sala) {
    if (sala.conContrasena) {
      this.salaPendienteContrasena = sala;
      document.getElementById('modalContrasenaSala')?.classList.add('activo');
      document.getElementById('inputContrasenaUnirse').value = '';
      document.getElementById('errorContrasenaSala').hidden = true;
      return;
    }
    this.unirseASalaDirecto(sala.codigo);
  }

  async unirseASalaDirecto(codigo, contrasena = null) {
    const nombre = localStorage.getItem('usuarioActivo') 
      ? JSON.parse(localStorage.getItem('usuarioActivo') || '{}').nombre || 'Jugador'
      : 'Jugador';
    try {
      const res = await clienteMultijugador.unirseSala(codigo, nombre, contrasena);
      if (res.exito) {
        document.getElementById('modalContrasenaSala')?.classList.remove('activo');
        this.ocultarTodosLosPaneles();
        document.getElementById('panelEsperandoRival')?.removeAttribute('hidden');
        document.getElementById('codigoSalaEspera').textContent = codigo.toUpperCase();
      } else {
        this.mostrarErrorUnirse(res.error || 'No se pudo unir a la sala.');
      }
    } catch {
      this.mostrarErrorUnirse('Error al conectar con el servidor.');
    }
  }

  mostrarErrorUnirse(mensaje) {
    const modalContrasena = document.getElementById('modalContrasenaSala');
    if (modalContrasena?.classList.contains('activo')) {
      const errorContrasena = document.getElementById('errorContrasenaSala');
      if (errorContrasena) {
        errorContrasena.textContent = mensaje;
        errorContrasena.hidden = false;
      }
      return;
    }
    const errorCodigo = document.getElementById('errorLobbyCodigo');
    if (errorCodigo && !document.getElementById('panelBuscarCodigo')?.hidden) {
      errorCodigo.textContent = mensaje;
      errorCodigo.hidden = false;
      return;
    }
    this.mostrarMensajeVacio(mensaje);
  }

  inicializarEventos() {
    document.getElementById('btnCrearSalaLobby')?.addEventListener('click', () => {
      this.ocultarTodosLosPaneles();
      document.getElementById('panelCrearSala')?.removeAttribute('hidden');
    });
    document.getElementById('btnCancelarCrearSala')?.addEventListener('click', () => {
      document.getElementById('panelCrearSala')?.setAttribute('hidden', 'true');
    });
    document.getElementById('btnUnirsePorCodigo')?.addEventListener('click', () => {
      this.ocultarTodosLosPaneles();
      document.getElementById('panelBuscarCodigo')?.removeAttribute('hidden');
      document.getElementById('inputBuscarCodigo').value = '';
      document.getElementById('errorLobbyCodigo').hidden = true;
    });
    document.getElementById('btnCancelarBuscar')?.addEventListener('click', () => {
      document.getElementById('panelBuscarCodigo')?.setAttribute('hidden', 'true');
    });
    document.getElementById('btnBuscarUnirse')?.addEventListener('click', async () => {
      const codigo = document.getElementById('inputBuscarCodigo').value.trim().toUpperCase();
      if (!codigo) return;
      const errorLobby = document.getElementById('errorLobbyCodigo');
      if (errorLobby) errorLobby.hidden = true;
      try {
        const res = await clienteMultijugador.buscarSalaPorCodigo(codigo);
        if (res.exito) {
          if (res.sala.conContrasena) {
            this.salaPendienteContrasena = { codigo };
            document.getElementById('panelBuscarCodigo')?.setAttribute('hidden', 'true');
            document.getElementById('modalContrasenaSala')?.classList.add('activo');
            return;
          }
          this.unirseASalaDirecto(codigo);
        } else if (errorLobby) {
          errorLobby.textContent = res.error || 'Error';
          errorLobby.hidden = false;
        }
      } catch {
        if (errorLobby) {
          errorLobby.textContent = 'Error al conectar con el servidor.';
          errorLobby.hidden = false;
        }
      }
    });
    document.getElementById('inputBuscarCodigo')?.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        document.getElementById('btnBuscarUnirse')?.click();
      }
    });
    document.getElementById('btnPartidaRapida')?.addEventListener('click', async () => {
      this.ocultarTodosLosPaneles();
      document.getElementById('panelPartidaRapida')?.removeAttribute('hidden');
      try {
        const res = await clienteMultijugador.buscarPartidaRapida();
        if (res.exito && res.emparejado && res.codigo) {
          if (this.redirectEnCurso) return;
          this.redirectEnCurso = true;
          document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
          window.location.href = `game-online.html?codigo=${encodeURIComponent(res.codigo)}`;
        } else if (!res.exito) {
          document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
          this.mostrarMensajeVacio(res.error || 'No se pudo buscar partida.');
        }
      } catch (error) {
        document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
        this.mostrarMensajeVacio('No se pudo buscar partida. Verifica que el backend esté corriendo.');
      }
    });
    document.getElementById('btnCancelarBusqueda')?.addEventListener('click', () => {
      clienteMultijugador.cancelarBusqueda();
      document.getElementById('panelPartidaRapida')?.setAttribute('hidden', 'true');
    });
    document.getElementById('btnSalirEsperando')?.addEventListener('click', () => {
      clienteMultijugador.abandonarSala();
      document.getElementById('panelEsperandoRival')?.setAttribute('hidden', 'true');
      this.actualizarListaSalas();
    });
    document.getElementById('btnConfirmarContrasena')?.addEventListener('click', () => {
      const pass = document.getElementById('inputContrasenaUnirse').value;
      const sala = this.salaPendienteContrasena;
      if (sala?.codigo) this.unirseASalaDirecto(sala.codigo, pass);
    });
    document.getElementById('btnCancelarContrasena')?.addEventListener('click', () => {
      document.getElementById('modalContrasenaSala')?.classList.remove('activo');
      this.salaPendienteContrasena = null;
    });
  }

  inicializarCrearSala() {
    document.querySelectorAll('input[name="tipoMazo"]').forEach(r => {
      r.addEventListener('change', () => {
        const esAldea = document.querySelector('input[name="tipoMazo"]:checked')?.value === 'aldea';
        document.getElementById('filaAldea')?.toggleAttribute('hidden', !esAldea);
        const selectPares = document.getElementById('selectPares');
        if (esAldea) {
          selectPares.innerHTML = '<option value="8">8 PAREJAS (16 CARTAS)</option>';
          selectPares.value = '8';
        } else {
          selectPares.innerHTML = `
            <option value="8">8 PAREJAS (16 CARTAS)</option>
            <option value="10">10 PAREJAS (20 CARTAS)</option>
            <option value="12">12 PAREJAS (24 CARTAS)</option>
            <option value="14">14 PAREJAS (28 CARTAS)</option>
            <option value="16">16 PAREJAS (32 CARTAS)</option>
          `;
        }
      });
    });
    document.getElementById('chkContrasena')?.addEventListener('change', (e) => {
      document.getElementById('inputContrasenaSala')?.toggleAttribute('hidden', !e.target.checked);
    });
    document.getElementById('btnConfirmarCrearSala')?.addEventListener('click', async () => {
      try {
        await clienteMultijugador.conectar();
      } catch (error) {
        this.mostrarMensajeVacio('No se pudo conectar con el servidor de salas.');
        return;
      }
      const mezclarAldeas = document.querySelector('input[name="tipoMazo"]:checked')?.value === 'mezclar';
      const aldea = document.getElementById('selectAldea')?.value;
      let pares = parseInt(document.getElementById('selectPares')?.value || '8');
      if (!mezclarAldeas) pares = 8;
      const publica = document.querySelector('input[name="tipoSala"]:checked')?.value === 'publica';
      const conPass = document.getElementById('chkContrasena')?.checked;
      const contrasena = conPass ? document.getElementById('inputContrasenaSala')?.value || null : null;
      let res;
      try {
        res = await clienteMultijugador.crearSala({ publica, contrasena, config: { mezclarAldeas, aldea, pares } });
      } catch {
        this.mostrarMensajeVacio('No se pudo crear la sala. Verifica que el backend esté corriendo.');
        return;
      }
      if (res.exito) {
        document.getElementById('panelCrearSala')?.setAttribute('hidden', 'true');
        document.getElementById('panelEsperandoRival')?.removeAttribute('hidden');
        document.getElementById('codigoSalaEspera').textContent = res.codigo;
        this.actualizarListaSalas();
      } else {
        this.mostrarMensajeVacio(res.error || 'No se pudo crear la sala.');
      }
    });
  }

  generarCodigoSala() {
    const txtCodigo = document.getElementById('txtCodigoGenerado');
    if (!txtCodigo) return;

    if (this.salaService) {
      // El código mostrado queda registrado como la sala vigente,
      // de modo que solo ese código (y no cualquiera) pueda usarse para unirse.
      txtCodigo.textContent = this.salaService.obtenerCodigoSala();
    } else {
      txtCodigo.textContent = Math.floor(100000 + Math.random() * 900000);
    }
  }

  inicializarUnirseASala() {
    const input = document.getElementById('inputCodigoSala');
    const boton = document.getElementById('btnUnirseSala');
    const error = document.getElementById('errorCodigoSala');
    if (!input || !boton) return;

    const mostrarError = (mensaje) => {
      if (error) {
        error.textContent = mensaje;
        error.hidden = false;
      }
      input.value = '';
      input.classList.remove('input-error');
      void input.offsetWidth;
      input.classList.add('input-error');
      input.focus();
    };

    const limpiarError = () => {
      if (error) error.hidden = true;
      input.classList.remove('input-error');
    };

    const unirseASala = async () => {
      const codigo = input.value.trim().toUpperCase();

      if (!codigo) {
        mostrarError('Debes ingresar un código de sala');
        return;
      }

      limpiarError();
      try {
        await clienteMultijugador.conectar();
        const nombre = localStorage.getItem('usuarioActivo') 
          ? JSON.parse(localStorage.getItem('usuarioActivo') || '{}').nombre || 'Jugador'
          : 'Jugador';
        const respuesta = await clienteMultijugador.unirseSala(codigo, nombre);
        if (respuesta.exito) {
          window.location.href = `game-online.html?codigo=${encodeURIComponent(codigo)}`;
        } else {
          mostrarError(respuesta.error || 'Código incorrecto');
        }
      } catch {
        mostrarError('Error al conectar con el servidor');
      }
    };

    boton.addEventListener('click', unirseASala);

    input.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        unirseASala();
      }
    });

    input.addEventListener('input', limpiarError);
  }
}