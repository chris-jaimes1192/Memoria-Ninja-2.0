/**
 * ENTIDAD: Usuario (backend)
 *
 * >>> ENCAPSULAMIENTO <<<
 * Igual que en el frontend (core/entities/Usuario.js), los campos son
 * privados (#). El passwordHash NUNCA sale por toJSON()/publico():
 * solo el repositorio lo lee (getter passwordHash) para persistir, y
 * la verificación real la hace PasswordHasher desde el Service.
 */
class Usuario {
  #id;
  #usuario;
  #correo;
  #nacimiento;
  #passwordHash;

  constructor({ id, usuario, correo, nacimiento, passwordHash }) {
    this.#id = id;
    this.#usuario = usuario;
    this.#correo = correo;
    this.#nacimiento = nacimiento ?? null;
    this.#passwordHash = passwordHash;
  }

  get id() {
    return this.#id;
  }

  get usuario() {
    return this.#usuario;
  }

  get correo() {
    return this.#correo;
  }

  get nacimiento() {
    return this.#nacimiento;
  }

  /** Solo lo usa UsuarioRepositorySQL para persistir el hash. */
  get passwordHash() {
    return this.#passwordHash;
  }

  /**
   * Representación pública: seguro para enviar al frontend.
   * Jamás incluye el passwordHash.
   */
  publico() {
    return {
      id: this.#id,
      usuario: this.#usuario,
      correo: this.#correo,
      nacimiento: this.#nacimiento,
    };
  }

  /** Alias para el frontend: lo que devuelven los endpoints. */
  toJSON() {
    return this.publico();
  }
}

module.exports = Usuario;