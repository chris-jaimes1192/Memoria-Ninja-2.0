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
        <td class="fecha-hora">
          ${p.fecha}
          <br>
          <small>${p.hora}</small>
        </td>
      </tr>
    `).join('');
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