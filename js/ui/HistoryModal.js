import { BaseModal } from './BaseModal.js';
import { historialApi } from '../infraestructura/repositorios/HttpHistorialRepositorio.js';

/*
 * MODAL DE HISTORIAL (Parte 3 — datos reales)
 *
 * Antes `this.partidas` estaba HARDCODEADO en el constructor (4 filas falsas
 * del 12/05/2024). Ahora lee el historial REAL de PostgreSQL mediante
 * `GET /api/usuarios/:id/historial` (a través de historialApi) y lo pinta en
 * #historialBody.
 *
 * Convención de `ganador` (ver los controllers de juego):
 *   - el NOMBRE del ganador si la partida se ganó,
 *   - "ninguno" si se perdió.
 *
 * La pestaña "Partidas Normales" muestra TODO el historial real (la columna
 * Modo distingue 1 vs 2 jugadores). "Online 1vs1" y "Unirse a sala" quedan
 * vacías a propósito: el multijugador real llega en la Parte 5.
 */
export class HistoryModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
    this.cuerpoTabla = document.getElementById('historialBody');
    this.tabs = document.querySelectorAll('.tab-historial');
    this.partidas = [];
    this.inicializarTabs();
    this.inicializarCierreConEscape();
  }

  abrir() {
    if (this.modalElement) this.modalElement.classList.remove('hidden');
    this.cargar();
  }

  cerrar() {
    if (this.modalElement) this.modalElement.classList.add('hidden');
  }

  async cargar() {
    const idUsuario = this.#idUsuario();
    if (!idUsuario) {
      this.partidas = [];
      this.mensaje('Inicia sesión para ver tu historial.');
      return;
    }

    this.mensaje('Cargando historial…');
    try {
      const filas = await historialApi.obtener(idUsuario);
      this.partidas = filas.map((fila) => this.#mapear(fila));
      this.renderTabla(this.#tabActivo());
    } catch {
      this.partidas = [];
      this.mensaje('No se pudo cargar el historial (servidor no disponible).');
    }
  }

  #idUsuario() {
    try {
      const sesion = JSON.parse(localStorage.getItem('usuarioActivo'));
      return sesion && sesion.id ? sesion.id : null;
    } catch {
      return null;
    }
  }

  #mapear(fila) {
    const { fecha, hora } = this.#fechaHora(fila.jugada_en);
    const modo = String(fila.modo ?? '1');
    const gano = Boolean(fila.ganador) && fila.ganador !== 'ninguno';

    return {
      resultado: gano ? 'victoria' : 'derrota',
      modo: modo === '2' ? 'Partida 2 jugadores' : 'Partida Normal',
      sub: modo === '2' ? '2 jugadores' : '1 jugador',
      puntaje: this.#formato(fila.puntaje),
      fecha,
      hora
    };
  }

  #fechaHora(valor) {
    if (!valor) return { fecha: '', hora: '' };
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return { fecha: String(valor), hora: '' };

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return { fecha: `${dia}/${mes}/${anio}`, hora: `${hora}:${minutos}` };
  }

  #formato(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero.toLocaleString('es-ES') : '—';
  }

  #tabActivo() {
    const activo = document.querySelector('.tab-historial.activo');
    return activo?.dataset.tab || 'normales';
  }

  mensaje(texto) {
    if (!this.cuerpoTabla) return;
    this.cuerpoTabla.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="historial-vacio">${texto}</div>
        </td>
      </tr>`;
  }

  renderTabla(tabKey) {
    if (!this.cuerpoTabla) return;

    if (tabKey !== 'normales') {
      this.mensaje('Todavía no hay partidas en esta categoría.');
      return;
    }

    const filas = this.partidas || [];

    if (filas.length === 0) {
      this.mensaje('Todavía no hay partidas registradas en esta categoría.');
      return;
    }

    this.cuerpoTabla.innerHTML = filas.map(p => `
      <tr>
        <td class="${p.resultado === 'victoria' ? 'resultado-victoria' : 'resultado-derrota'}">
          ${p.resultado === 'victoria' ? 'VICTORIA' : 'DERROTA'}
        </td>
        <td>
          <span class="modo-principal">${p.modo}</span>
          <span class="modo-sub">${p.sub}</span>
        </td>
        <td>${p.puntaje}</td>
        <td class="fecha-hora">${this.renderFecha(p.fecha, p.hora)}</td>
      </tr>
    `).join('');
  }

  renderFecha(fecha, hora) {
    const { dia, mes, anio } = this.descomponerFecha(fecha);

    const chip = anio
      ? `<span class="fecha-chip">
            <span class="fecha-dia">${dia}</span>
            <span class="fecha-texto">
              <span class="fecha-mes">${mes}</span>
              <span class="fecha-anio">${anio}</span>
            </span>
          </span>`
      : `<span class="fecha-chip fecha-chip-simple">
            <span class="fecha-dia fecha-dia-solo">${dia}</span>
          </span>`;

    const pill = hora ? `<span class="hora-pill">${hora}</span>` : '';

    return `${chip}${pill}`;
  }

  descomponerFecha(fecha) {
    const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
                   'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    if (!fecha) return { dia: '--', mes: '', anio: '' };

    const partes = String(fecha).trim().split('/');

    if (partes.length === 3) {
      const [d, m, a] = partes;
      const indice = parseInt(m, 10) - 1;
      return {
        dia: d.padStart(2, '0'),
        mes: MESES[indice] || m,
        anio: a
      };
    }

    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return { dia: String(fecha), mes: '', anio: '' };

    return {
      dia: String(fechaObj.getDate()).padStart(2, '0'),
      mes: MESES[fechaObj.getMonth()],
      anio: String(fechaObj.getFullYear())
    };
  }

  inicializarTabs() {
    this.tabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('activo'));
        tab.classList.add('activo');
        this.renderTabla(tab.dataset.tab);
      });
    });
  }

  inicializarCierreConEscape() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalElement && !this.modalElement.classList.contains('hidden')) {
        this.cerrar();
      }
    });
  }
}
