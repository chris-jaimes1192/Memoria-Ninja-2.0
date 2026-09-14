import { LocalStorageRepository } from './infrastructure/LocalStorageRepository.js';
import { ProfileService } from './services/ProfileService.js';
import { ProfileModal } from './ui/ProfileModal.js';
import { BaseModal } from './ui/BaseModal.js';
import { MenuController } from './ui/MenuController.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Repositorio de datos y servicio
  const storageRepository = new LocalStorageRepository();
  const profileService = new ProfileService(storageRepository);

  // 2. Instancia segura de modales (Valida que el ID exista)
  const profileModal = document.getElementById('perfilModal') 
    ? new ProfileModal('perfilModal', profileService) 
    : null;

  const gameModeModal = document.getElementById('modalModoJuego') 
    ? new BaseModal('modalModoJuego') 
    : null;

  const rankingModal = document.getElementById('modalRanking') 
    ? new BaseModal('modalRanking') 
    : null;

  const dosJugadoresModal = document.getElementById('modalDosJugadores') 
    ? new BaseModal('modalDosJugadores') 
    : null;

  const multijugadorModal = document.getElementById('modalMultijugador') 
    ? new BaseModal('modalMultijugador') 
    : null;

  const historyModal = (document.getElementById('modalHistorial') || document.querySelector('.modal-historial'))
    ? new BaseModal(document.getElementById('modalHistorial') ? 'modalHistorial' : document.querySelector('.modal-historial').id || 'modalHistorial')
    : null;

  // 3. Inicializar el Controlador Principal
  const menuController = new MenuController({
    profileModal,
    gameModeModal,
    rankingModal,
    historyModal,
    dosJugadoresModal,
    multijugadorModal
  });

  menuController.inicializarEventos();
});