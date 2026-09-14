import { BaseModal } from './BaseModal.js';

export class HistoryModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
  }

  mostrarHistorial() {
    this.abrir();
  }
}