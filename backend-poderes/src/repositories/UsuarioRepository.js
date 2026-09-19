/**
 * ABSTRACCIÓN: UsuarioRepository
 *
 * >>> ISP + DIP <<<
 * Define SOLO los métodos que UsuarioService necesita para trabajar con
 * usuarios. Cualquier implementación concreta (hoy: SQL; mañana: Mongo,
 * API remota, etc.) que cumpla este contrato puede inyectarse en el
 * Service sin que este cambie una línea.
 */
class UsuarioRepository {
  buscarPorUsuario(usuario) {
    throw new Error("buscarPorUsuario() no implementado");
  }

  buscarPorCorreo(correo) {
    throw new Error("buscarPorCorreo() no implementado");
  }

  obtenerTodos() {
    throw new Error("obtenerTodos() no implementado");
  }

  guardar(usuario) {
    throw new Error("guardar() no implementado");
  }
}

module.exports = UsuarioRepository;