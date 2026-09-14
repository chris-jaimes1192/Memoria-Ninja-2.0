import { IProfileService } from '../domain/IProfileService.js';

export class ProfileService extends IProfileService {
  constructor(storageRepository) {
    super();
    this.storage = storageRepository;
  }

  obtenerPerfil() {
    const nombre = this.storage.getItem('playerName1') || 'Ninja Player';
    const nivel = this.storage.getItem('nivelActual') || '1';

    return {
      nombre,
      nivel,
      victorias: "12",
      xp: "2,450 XP"
    };
  }
}