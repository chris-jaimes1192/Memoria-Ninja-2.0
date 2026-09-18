import { BaseModal } from './BaseModal.js';

export class TwoPlayersModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
  }

  abrir() {
    super.abrir();
    this.generarCodigoSala();
  }

  generarCodigoSala() {
    const txtCodigo = document.getElementById('txtCodigoGenerado');
    if (txtCodigo) {
      txtCodigo.textContent = Math.floor(100000 + Math.random() * 900000);
    }
  }
}