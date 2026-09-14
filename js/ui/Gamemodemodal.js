import { BaseModal } from './BaseModal.js';

export class GameModeModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
  }

  inicializarOpciones() {
    const tarjetas = this.modalElement?.querySelectorAll('.opcion-card');
    tarjetas?.forEach(card => {
      card.addEventListener('click', () => {
        const modo = card.getAttribute('data-modo') || 'un-jugador';
        window.location.href = `juego.html?modo=${modo}`;
      });
    });
  }
}