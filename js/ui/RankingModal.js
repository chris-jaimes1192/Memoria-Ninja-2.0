import { BaseModal } from './BaseModal.js';

export class RankingModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
  }

  cargarRanking() {
    // Si tu ID existe en el HTML, añade la clase para visibilidad
    this.abrir();
  }
}