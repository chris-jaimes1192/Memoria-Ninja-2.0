export class MenuController {
  constructor(modales) {
    this.profileModal = modales.profileModal;
    this.gameModeModal = modales.gameModeModal;
    this.rankingModal = modales.rankingModal;
    this.historyModal = modales.historyModal;
    this.dosJugadoresModal = modales.dosJugadoresModal;
    this.multijugadorModal = modales.multijugadorModal;
  }

  inicializarEventos() {
    // 1. Perfil (Arriba Izquierda)
    document.querySelector('.perfil-panel')?.addEventListener('click', () => {
      this.profileModal?.mostrarDatosPerfil();
    });

    // 2. Un Jugador (Tarjeta Azul)
    document.querySelector('.panel.azul')?.addEventListener('click', () => {
      this.gameModeModal?.abrir();
    });

    // 3. Dos Jugadores (Tarjeta Morada)
    document.querySelector('.panel.morado')?.addEventListener('click', () => {
      this.dosJugadoresModal?.abrir();
    });

    // 4. Multijugador (Tarjeta Verde)
    document.querySelector('.panel.verde')?.addEventListener('click', () => {
      this.multijugadorModal?.abrir();
    });

    // 5. Ranking (Boton Arriba Derecha)
    document.querySelector('.ranking-panel')?.addEventListener('click', () => {
      this.rankingModal?.abrir();
    });

    // 6. Botones de la Barra Inferior (Historial, Puntaje, etc.)
    const itemsInferiores = document.querySelectorAll('.contenedor-inferior .item');
    itemsInferiores.forEach(item => {
      item.addEventListener('click', () => {
        const texto = item.innerText.toLowerCase();
        
        if (texto.includes('historial')) {
          // Intenta abrir con el objeto de la clase o buscando la clase CSS directamente
          if (this.historyModal) {
            this.historyModal.abrir();
          } else {
            const modalH = document.querySelector('.modal-historial');
            if (modalH) modalH.classList.remove('hidden');
          }
        } else if (texto.includes('puntaje')) {
          const modalPuntaje = document.getElementById('puntajeInfoModal');
          if (modalPuntaje) modalPuntaje.classList.add('activo');
        }
      });
    });

    // 7. Cierre Global de Modales
    document.addEventListener('click', (e) => {
      const esBotonCerrar = 
        e.target.classList.contains('cerrar-modal') ||
        e.target.classList.contains('btn-volver-modal') ||
        e.target.classList.contains('historial-cerrar');

      if (esBotonCerrar) {
        const modalPadre = e.target.closest('.modal-overlay, .modal-historial, #puntajeInfoModal');
        if (modalPadre) {
          modalPadre.classList.remove('activo');
          modalPadre.classList.add('hidden');
        }
      }
    });
  }
}