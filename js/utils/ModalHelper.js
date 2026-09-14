/*=========================================================
  MEMORIA NINJA
  CAPA: UTILIDADES (helpers de presentación, sin lógica de negocio)
  ARCHIVO: utils/ModalHelper.js
=========================================================*/

export function abrirModal(id) {
  document.getElementById(id).style.display = "flex";
}

export function cerrarModal(id) {
  document.getElementById(id).style.display = "none";
}

export function inicializarCierreClicFuera(idsModales) {
  window.addEventListener("click", (event) => {
    idsModales.forEach((id) => {
      const modal = document.getElementById(id);
      if (modal && event.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}
