import { BaseModal } from './BaseModal.js';
import { clienteMultijugador } from '../multijugador/ClienteMultijugador.js';

const TEXTO_SALAS_VACIO = 'No hay salas disponibles. ¡Crea la primera!';

export class TwoPlayersModal extends BaseModal {
  constructor(modalId, salaService) {
    super(modalId);
    this.salaService = salaService;
    this.salaPendienteContrasena = null;
    this.modoVista = null;
    this.configurarSocket();
    this.inicializarEventos();
    this.inicializarCrearSala();
  }

  configurarSocket() {
    clienteMultijugador.on('sala-actualizada', (sala) => {
      if (sala?.codigo) this.actualizarPanelEspera(sala);
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

  async abrirConCodigo(codigo) {
    await this.abrir();
    const normalizado = String(codigo || '').trim().toUpperCase();
    if (!normalizado) return;
    try {
      const res = await clienteMultijugador.buscarSalaPorCodigo(normalizado);
      if (!res.exito) {
        this.mostrarErrorUnirse(res.error || 'No se encontró la sala.');
        return;
      }
      if (res.sala?.conContrasena) {
        this.salaPendienteContrasena = { codigo: normalizado };
        document.getElementById('modalContrasenaSala')?.classList.add('activo');
        document.getElementById('inputContrasenaUnirse').value = '';
        document.getElementById('errorContrasenaSala').hidden = true;
        return;
      }
      await this.unirseASalaDirecto(normalizado);
    } catch {
      this.mostrarErrorUnirse('No se pudo conectar con el servidor de salas.');
    }
  }

  async abrir() {
    super.abrir();
    this.redirectEnCurso = false;
    this.ultimoCodigoQr = null;
    this.urlSalaActual = null;
    try {
      await clienteMultijugador.conectar();
    } catch (error) {
      this.mostrarMensajeVacio('El multijugador requiere el backend corriendo (npm start).');
      this.ocultarTodosLosPaneles();
      document.getElementById('listaSalasContainer')?.setAttribute('hidden', 'true');
      return;
    }
    this.modoVista = null;
    const btnCrear = document.getElementById('btnCrearSalaLobby');
    const btnUnirse = document.getElementById('btnUnirsePorCodigo');
    const btnRapida = document.getElementById('btnPartidaRapida');
    btnCrear?.classList.remove('btn-lobby-activo');
    btnUnirse?.classList.remove('btn-lobby-activo');
    btnRapida?.classList.remove('btn-lobby-activo');
    this.ocultarTodosLosPaneles();
    document.getElementById('modalContrasenaSala')?.classList.remove('activo');
    this.mostrarMensajeVacio(TEXTO_SALAS_VACIO);
    const lista = document.getElementById('listaSalasContainer');
    if (lista) lista.removeAttribute('hidden');
    this.actualizarListaSalas();
  }

  ocultarTodosLosPaneles() {
    ['panelCrearSala', 'panelEsperandoRival', 'panelBuscarCodigo', 'panelPartidaRapida'].forEach(id => {
      document.getElementById(id)?.setAttribute('hidden', 'true');
    });
    const lista = document.getElementById('listaSalasContainer');
    if (lista) lista.setAttribute('hidden', 'true');
  }

  aplicarVista(vista) {
    this.modoVista = vista;
    this.ocultarTodosLosPaneles();
    const btnCrear = document.getElementById('btnCrearSalaLobby');
    const btnUnirse = document.getElementById('btnUnirsePorCodigo');
    const btnRapida = document.getElementById('btnPartidaRapida');
    btnCrear?.classList.remove('btn-lobby-activo');
    btnUnirse?.classList.remove('btn-lobby-activo');
    btnRapida?.classList.remove('btn-lobby-activo');

    if (vista === 'crear') {
      btnCrear?.classList.add('btn-lobby-activo');
      document.getElementById('panelCrearSala')?.removeAttribute('hidden');
      return;
    }

    if (vista === 'unirse') {
      btnUnirse?.classList.add('btn-lobby-activo');
      document.getElementById('panelBuscarCodigo')?.removeAttribute('hidden');
      const lista = document.getElementById('listaSalasContainer');
      if (lista) lista.removeAttribute('hidden');
      this.mostrarMensajeVacio(TEXTO_SALAS_VACIO);
      this.actualizarListaSalas();
      return;
    }

    if (vista === 'rapida') {
      btnRapida?.classList.add('btn-lobby-activo');
      document.getElementById('panelPartidaRapida')?.removeAttribute('hidden');
    }
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
      const capacidad = Number(sala.capacidad) || (sala.modo === '2v2' ? 4 : 2);
      const ocupados = Number(sala.jugadores) || 0;
      const llena = ocupados >= capacidad;
      const modoTxt = sala.modo === '2v2' ? '2 VS 2' : '1 VS 1';
      const mezclar = sala.config?.mezclarAldeas ? 'MEZCLADO' : `ALDEA: ${(sala.config?.aldea || 'KONOHA').toUpperCase()}`;
      const codigo = String(sala.codigo || '').toUpperCase();

      const info = document.createElement('div');
      info.className = 'sala-card-info';

      const filaSuperior = document.createElement('div');
      filaSuperior.className = 'sala-card-fila';
      const idSala = document.createElement('span');
      idSala.className = 'sala-card-id';
      idSala.textContent = codigo ? `ID: ${codigo}` : 'ID: ----';
      const anfitrion = document.createElement('span');
      anfitrion.className = 'sala-card-anfitrion';
      anfitrion.textContent = sala.anfitrion ? `ANFITRIÓN: ${sala.anfitrion}` : '';
      filaSuperior.appendChild(idSala);
      if (anfitrion.textContent) filaSuperior.appendChild(anfitrion);

      const filaInferior = document.createElement('div');
      filaInferior.className = 'sala-card-fila sala-card-fila-secundaria';
      const detalles = document.createElement('span');
      detalles.className = 'sala-card-detalles';
      detalles.textContent = `${modoTxt} · ${ocupados}/${capacidad} JUGADORES · ${pares} PAREJAS · ${mezclar}${sala.conContrasena ? ' · CON CONTRASEÑA' : ''}`;
      const estado = document.createElement('span');
      estado.className = llena ? 'sala-card-estado sala-card-estado-llena' : 'sala-card-estado sala-card-estado-esperando';
      estado.textContent = llena ? 'LLENA' : 'ESPERANDO';
      filaInferior.appendChild(detalles);
      filaInferior.appendChild(estado);

      info.appendChild(filaSuperior);
      info.appendChild(filaInferior);

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = llena ? 'btn-unirse-sala-pequeno btn-unirse-sala-pequeno-deshabilitado' : 'btn-unirse-sala-pequeno';
      boton.textContent = llena ? 'LLENA' : 'UNIRSE';
      boton.disabled = llena;
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
        this.mostrarPanelEspera(codigo.toUpperCase(), res.sala);
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

  mostrarPanelEspera(codigo, sala = {}) {
    this.ultimoCodigoQr = null;
    const btnCrear = document.getElementById('btnCrearSalaLobby');
    const btnUnirse = document.getElementById('btnUnirsePorCodigo');
    const btnRapida = document.getElementById('btnPartidaRapida');
    btnCrear?.classList.add('btn-lobby-activo');
    btnUnirse?.classList.remove('btn-lobby-activo');
    btnRapida?.classList.remove('btn-lobby-activo');
    this.modoVista = 'crear';
    this.ocultarTodosLosPaneles();
    document.getElementById('panelEsperandoRival')?.removeAttribute('hidden');
    this.actualizarPanelEspera({ ...sala, codigo: codigo || sala.codigo });
  }

  actualizarPanelEspera(sala) {
    const codigo = String(sala?.codigo || '').toUpperCase();
    const panel = document.getElementById('panelEsperandoRival');
    if (!codigo || panel?.hidden) return;

    const capacidad = Number(sala.capacidad) || (sala.modo === '2v2' ? 4 : 2);
    const ocupados = Number(sala.jugadores) || 0;
    const faltan = Math.max(0, capacidad - ocupados);
    const es2v2 = sala.modo === '2v2' || capacidad === 4;
    const codigoEl = document.getElementById('codigoSalaEspera');
    if (codigoEl) codigoEl.textContent = codigo;

    const titulo = document.getElementById('esperandoTitulo');
    if (titulo) {
      titulo.textContent = faltan === 0
        ? 'SALA COMPLETA · INICIANDO...'
        : es2v2
          ? `ESPERANDO JUGADORES (${ocupados}/${capacidad})...`
          : 'ESPERANDO RIVAL...';
    }

    const info = document.getElementById('esperandoInfo');
    if (info) {
      info.textContent = faltan === 0
        ? 'LA PARTIDA ESTÁ POR COMENZAR'
        : es2v2
          ? 'SE NECESITAN 4 JUGADORES EN TOTAL'
          : 'COMPARTE EL CÓDIGO O EL QR CON TU RIVAL';
    }

    const equipos = document.getElementById('esperandoEquipos');
    if (equipos) {
      if (es2v2 && sala.equipos) {
        const nombres = (equipo) => (sala.equipos[equipo] || []).map((j) => j.nombre).join(' + ') || '—';
        equipos.textContent = `EQUIPO A: ${nombres('A')}  ·  EQUIPO B: ${nombres('B')}`;
        equipos.hidden = false;
      } else {
        equipos.hidden = true;
      }
    }

    this.cargarQrSala(codigo);
  }

  async cargarQrSala(codigo) {
    if (this.ultimoCodigoQr === codigo) return;
    this.ultimoCodigoQr = codigo;

    const img = document.getElementById('qrSala');
    const urlEl = document.getElementById('urlSalaEspera');
    if (img) img.hidden = true;
    if (urlEl) urlEl.textContent = '';

    try {
      const respuesta = await fetch(`/api/salas/${encodeURIComponent(codigo)}/compartir`);
      if (!respuesta.ok) return;
      const datos = await respuesta.json();
      if (!datos.exito) return;
      this.urlSalaActual = datos.url;
      if (urlEl) urlEl.textContent = datos.url;
      if (img) {
        img.src = datos.qrDataUrl;
        img.hidden = false;
      }
    } catch {
      // Sin backend no hay QR; el código sigue visible para compartir a mano.
    }
  }

  inicializarEventos() {
    document.getElementById('btnCrearSalaLobby')?.addEventListener('click', () => {
      document.getElementById('modalContrasenaSala')?.classList.remove('activo');
      this.salaPendienteContrasena = null;
      document.getElementById('inputBuscarCodigo').value = '';
      const errorLobby = document.getElementById('errorLobbyCodigo');
      if (errorLobby) errorLobby.hidden = true;
      this.aplicarVista('crear');
    });
    document.getElementById('btnCancelarCrearSala')?.addEventListener('click', () => {
      this.aplicarVista('crear');
    });
    document.getElementById('btnUnirsePorCodigo')?.addEventListener('click', () => {
      document.getElementById('modalContrasenaSala')?.classList.remove('activo');
      this.salaPendienteContrasena = null;
      document.getElementById('inputBuscarCodigo').value = '';
      const errorLobby = document.getElementById('errorLobbyCodigo');
      if (errorLobby) errorLobby.hidden = true;
      this.aplicarVista('unirse');
    });
    document.getElementById('btnBuscarUnirse')?.addEventListener('click', async () => {
      const codigo = document.getElementById('inputBuscarCodigo').value.trim().toUpperCase();
      if (!codigo) {
        const errorLobby = document.getElementById('errorLobbyCodigo');
        if (errorLobby) {
          errorLobby.textContent = 'Introduce el ID de la sala.';
          errorLobby.hidden = false;
        }
        return;
      }
      const errorLobby = document.getElementById('errorLobbyCodigo');
      if (errorLobby) errorLobby.hidden = true;
      try {
        const res = await clienteMultijugador.buscarSalaPorCodigo(codigo);
        if (res.exito) {
          if (res.sala.conContrasena) {
            this.salaPendienteContrasena = { codigo };
            document.getElementById('panelBuscarCodigo')?.setAttribute('hidden', 'true');
            const lista = document.getElementById('listaSalasContainer');
            if (lista) lista.setAttribute('hidden', 'true');
            document.getElementById('modalContrasenaSala')?.classList.add('activo');
            return;
          }
          this.unirseASalaDirecto(codigo);
        } else if (errorLobby) {
          errorLobby.textContent = res.error || 'No se encontró esa sala';
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
      document.getElementById('modalContrasenaSala')?.classList.remove('activo');
      this.salaPendienteContrasena = null;
      document.getElementById('inputBuscarCodigo').value = '';
      const errorLobby = document.getElementById('errorLobbyCodigo');
      if (errorLobby) errorLobby.hidden = true;
      this.aplicarVista('rapida');
      const modo = document.querySelector('input[name="modoRapida"]:checked')?.value || '1v1';
      const texto = document.getElementById('textoBusquedaRapida');
      if (texto) texto.textContent = modo === '2v2' ? 'BUSCANDO EQUIPO (2 VS 2)...' : 'BUSCANDO OPONENTE...';
      try {
        const res = await clienteMultijugador.buscarPartidaRapida(modo);
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
      this.modoVista = 'rapida';
    });
    document.getElementById('btnSalirEsperando')?.addEventListener('click', () => {
      clienteMultijugador.abandonarSala();
      document.getElementById('panelEsperandoRival')?.setAttribute('hidden', 'true');
      this.aplicarVista('crear');
      this.actualizarListaSalas();
    });
    document.getElementById('btnCopiarEnlaceSala')?.addEventListener('click', async (evento) => {
      const boton = evento.currentTarget;
      if (!this.urlSalaActual) return;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(this.urlSalaActual);
        } else {
          const area = document.createElement('textarea');
          area.value = this.urlSalaActual;
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.appendChild(area);
          area.select();
          document.execCommand('copy');
          area.remove();
        }
        boton.textContent = '¡COPIADO!';
        setTimeout(() => { boton.textContent = 'COPIAR ENLACE'; }, 1600);
      } catch {
        boton.textContent = 'NO SE PUDO COPIAR';
      }
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
      const modo = document.querySelector('input[name="modoPartida"]:checked')?.value || '1v1';
      let pares = parseInt(document.getElementById('selectPares')?.value || '8');
      if (!mezclarAldeas) pares = 8;
      const publica = document.querySelector('input[name="tipoSala"]:checked')?.value === 'publica';
      const conPass = document.getElementById('chkContrasena')?.checked;
      const contrasena = conPass ? document.getElementById('inputContrasenaSala')?.value || null : null;
      let res;
      try {
        res = await clienteMultijugador.crearSala({ publica, contrasena, config: { modo, mezclarAldeas, aldea, pares } });
      } catch {
        this.mostrarMensajeVacio('No se pudo crear la sala. Verifica que el backend esté corriendo.');
        return;
      }
      if (res.exito) {
        document.getElementById('panelCrearSala')?.setAttribute('hidden', 'true');
        this.mostrarPanelEspera(res.codigo, res.sala || { modo, capacidad: modo === '2v2' ? 4 : 2, jugadores: 1 });
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