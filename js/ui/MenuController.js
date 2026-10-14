export class MenuController {
  constructor(modales) {
    this.modales = modales;
    this.registroElementos = new Map();
    this.registrarElementosModal();
  }

  // El controlador no toca el DOM de los modales (SRP):
  // solo conoce la abstracción abrir()/cerrar() (DIP/LSP).
  registrarElementosModal() {
    Object.values(this.modales).forEach(modal => {
      if (modal?.modalElement) {
        this.registroElementos.set(modal.modalElement, modal);
        modal.modalElement.setAttribute('aria-hidden', 'true');
      }
    });
  }

  abrirModal(modal) {
    modal?.abrir();
  }

  // Funciones que requieren sesión (perfil/ranking/historial).
  // En modo invitado u offline se cancela la acción y se avisa al usuario.
  // Devuelve true si la acción debe cancelarse.
  estaBloqueado(motivo) {
    const sesion = window.SesionNinja;
    const estado = sesion?.estadoActual?.() || 'desconocido';
    if (estado === 'activa' || estado === 'desconocido') return false;
    sesion?.avisarInvitado?.(motivo);
    return true;
  }

  cerrarModalDesdeElemento(elemento) {
    const contenedor = elemento.closest('.modal-overlay, .modal-historial');
    const modal = contenedor ? this.registroElementos.get(contenedor) : null;
    modal?.cerrar();
  }

  inicializarEventos() {
    // 1. Perfil (Arriba Izquierda)
    document.querySelector('.perfil-panel')?.addEventListener('click', () => {
      if (this.estaBloqueado('ver tu perfil')) return;
      this.abrirModal(this.modales.profileModal);
    });

    // 2. Un Jugador (Tarjeta Azul)
    document.querySelector('.panel.azul')?.addEventListener('click', () => {
      this.abrirModal(this.modales.gameModeModal);
    });

    // 3. Dos Jugadores (Tarjeta Morada)
    document.querySelector('.panel.morado')?.addEventListener('click', () => {
      this.abrirModal(this.modales.dosJugadoresModal);
    });

    // 4. Multijugador (Tarjeta Verde)
    document.querySelector('.panel.verde')?.addEventListener('click', () => {
      this.abrirModal(this.modales.multijugadorModal);
    });

    // 5. Ranking (Boton Arriba Derecha)
    document.querySelector('.ranking-panel')?.addEventListener('click', () => {
      if (this.estaBloqueado('ver el ranking')) return;
      this.abrirModal(this.modales.rankingModal);
    });

    // 5b. Configuracion (Boton Arriba Derecha)
    document.querySelector('.menu-superior')?.addEventListener('click', () => {
      this.abrirModal(this.modales.configModal);
    });

    // 6. Botones de la Barra Inferior (Historial, Puntaje, etc.)
    document.querySelectorAll('.contenedor-inferior .item').forEach(item => {
      item.addEventListener('click', () => {
        const texto = item.innerText.toLowerCase();
        if (texto.includes('historial')) {
          if (this.estaBloqueado('ver tu historial')) return;
          this.abrirModal(this.modales.historyModal);
        } else if (texto.includes('puntaje')) {
          this.abrirModal(this.modales.puntajeModal);
        }
      });
    });

    // 7. Cierre global delegado: cada boton invoca cerrar() del modal correspondiente
    document.addEventListener('click', (e) => {
      const esBotonCerrar =
        e.target.classList.contains('cerrar-modal') ||
        e.target.classList.contains('btn-volver-modal') ||
        e.target.classList.contains('historial-cerrar') ||
        e.target.classList.contains('btn-volver-info');

      if (esBotonCerrar) {
        this.cerrarModalDesdeElemento(e.target);
      }
    });
  }
}