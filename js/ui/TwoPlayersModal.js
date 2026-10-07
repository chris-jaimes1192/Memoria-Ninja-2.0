import { BaseModal } from './BaseModal.js';

export class TwoPlayersModal extends BaseModal {
  constructor(modalId, salaService) {
    super(modalId);
    this.salaService = salaService;
    this.inicializarUnirseASala();
  }

  abrir() {
    super.abrir();
    this.generarCodigoSala();
  }

  generarCodigoSala() {
    const txtCodigo = document.getElementById('txtCodigoGenerado');
    if (!txtCodigo) return;

    if (this.salaService) {
      // El código mostrado queda registrado como la sala vigente,
      // de modo que solo ese código (y no cualquiera) pueda usarse para unirse.
      txtCodigo.textContent = this.salaService.obtenerCodigoSala();
    } else {
      txtCodigo.textContent = Math.floor(100000 + Math.random() * 900000);
    }
  }

  inicializarUnirseASala() {
    const input = document.getElementById('inputCodigoSala');
    const boton = document.getElementById('btnUnirseSala');
    const error = document.getElementById('errorCodigoSala');
    if (!input || !boton) return;

    const mostrarError = (mensaje) => {
      if (error) {
        error.textContent = mensaje;
        error.hidden = false;
      }
      // Se limpia el campo para que el jugador pueda escribir el código otra vez.
      input.value = '';
      // Se reinicia la clase para que la animación de temblor se repita en cada intento.
      input.classList.remove('input-error');
      void input.offsetWidth;
      input.classList.add('input-error');
      input.focus();
    };

    const limpiarError = () => {
      if (error) error.hidden = true;
      input.classList.remove('input-error');
    };

    const unirseASala = () => {
      const codigo = input.value.trim();

      if (!codigo) {
        mostrarError('Debes ingresar un código de sala');
        return;
      }

      // Seguridad: solo se aceptan códigos de 6 dígitos (formato de las salas).
      if (!/^\d{6}$/.test(codigo)) {
        mostrarError('Código incorrecto: debe tener 6 dígitos');
        return;
      }

      // Seguridad: el código debe corresponder a una sala vigente.
      if (this.salaService && !this.salaService.esCodigoValido(codigo)) {
        mostrarError('Código incorrecto: la sala no existe');
        return;
      }

      limpiarError();
      window.location.href = `game-online.html?codigo=${encodeURIComponent(codigo)}`;
    };

    boton.addEventListener('click', unirseASala);

    input.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter') {
        evento.preventDefault();
        unirseASala();
      }
    });

    input.addEventListener('input', limpiarError);
  }
}