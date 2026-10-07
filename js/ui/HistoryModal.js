import { BaseModal } from './BaseModal.js';

export class HistoryModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
    this.cuerpoTabla = document.getElementById('historialBody');
    this.tabs = document.querySelectorAll('.tab-historial');
    this.partidas = {
      normales: [
        { resultado: 'victoria', modo: 'Partida Normal', sub: '1 jugador', puntaje: '15,280', fecha: '12/05/2024', hora: '14:38' },
        { resultado: 'derrota', modo: 'Partida Normal', sub: '1 jugador', puntaje: '9,650', fecha: '12/05/2024', hora: '13:52' },
        { resultado: 'victoria', modo: 'Partida Normal', sub: '1 jugador', puntaje: '15,280', fecha: '12/05/2024', hora: '14:38' },
        { resultado: 'derrota', modo: 'Partida Normal', sub: '1 jugador', puntaje: '9,650', fecha: '12/05/2024', hora: '13:52' }
      ],
      online: [],
      sala: []
    };
    this.inicializarTabs();
    this.inicializarCierreConEscape();
  }

  abrir() {
    if (this.modalElement) this.modalElement.classList.remove('hidden');
    this.renderTabla('normales');
  }

  cerrar() {
    if (this.modalElement) this.modalElement.classList.add('hidden');
  }

  renderTabla(tabKey) {
    if (!this.cuerpoTabla) return;

    const filas = this.partidas[tabKey] || [];

    if (filas.length === 0) {
      this.cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="historial-vacio">
              Todavía no hay partidas registradas en esta categoría.
            </div>
          </td>
        </tr>`;
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