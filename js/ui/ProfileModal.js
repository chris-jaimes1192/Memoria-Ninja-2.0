import { BaseModal } from './BaseModal.js';

export class ProfileModal extends BaseModal {
  constructor(modalId, profileService) {
    super(modalId);
    this.profileService = profileService;
  }

  abrir() {
    const datos = this.profileService.obtenerPerfil();

    const modalName = document.getElementById('modalName');
    const modalLevel = document.getElementById('modalLevel');
    const statWins = document.getElementById('statWins');
    const statHighScore = document.getElementById('statHighScore');

    if (modalName) modalName.textContent = datos.nombre;
    if (modalLevel) modalLevel.textContent = datos.nivel;
    if (statWins) statWins.textContent = datos.victorias;
    if (statHighScore) statHighScore.textContent = datos.xp;

    super.abrir();
  }
}