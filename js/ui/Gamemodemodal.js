import { BaseModal } from './BaseModal.js';

export class GameModeModal extends BaseModal {
  constructor(modalId) {
    super(modalId);
  }

  inicializarOpciones() {
    const rutas = {
      btnEncontrarPares: { subModoJuego: 'pares', href: 'niveles.html' },
      btnMemoria: { subModoJuego: 'memoria', href: 'pares.html', sesion: { iniciarMusica: 'si' } },
      btnCarpetas: { subModoJuego: 'carpetas', href: 'Agrupar/facil.html' },
      btnMuerte: { subModoJuego: 'muerte', href: 'muerte.html' }
    };

    Object.entries(rutas).forEach(([id, opcion]) => {
      document.getElementById(id)?.addEventListener('click', () => {
        localStorage.setItem('subModoJuego', opcion.subModoJuego);
        Object.entries(opcion.sesion ?? {}).forEach(([clave, valor]) =>
          sessionStorage.setItem(clave, valor)
        );
        window.location.href = opcion.href;
      });
    });
  }
}