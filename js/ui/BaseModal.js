export class BaseModal {
  constructor(modalId) {
    this.modalElement = document.getElementById(modalId);
    this.initBaseEvents();
  }

  abrir() {
    if (this.modalElement) this.modalElement.classList.add('activo');
  }

  cerrar() {
    if (this.modalElement) this.modalElement.classList.remove('activo');
  }

  initBaseEvents() {
    window.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.cerrar();
      }
    });
  }
}