/*=========================================================
  MEMORIA NINJA
  CAPA: INFRAESTRUCTURA -> Repositorio
  ARCHIVO: infraestructura/repositorios/HttpUsuarioRepositorio.js

  Implementa AMBAS interfaces (IUsuarioLector + IUsuarioEscritor)
  pero con el backend REAL detrás: cada método es un fetch a la
  API Node/Express que a su vez habla con SQLite.

  Este es el reemplazo moderno de LocalStorageUsuarioRepositorio:
  los usuarios ya no viven en el navegador, viven en la base de
  datos del servidor. En el diagrama de la sustentación esto es la
  prueba de que el patrón de repositorios de la Fase 1 servía para
  esto: el Service (AutenticacionService/RegistroService) recibe la
  MISMA abstracción de siempre y no se entera del cambio.

  NOTA SOBRE ASINCRONÍA:
  fetch es asíncrono, así que estos métodos devuelven Promesas.
  Por eso AutenticacionService/RegistroService y los controladores
  de login/registro pasaron a ser async. Es el costo real de
  desacoplar los datos del documento.
=========================================================*/

import { IUsuarioLector } from "../../core/interfaces/IUsuarioLector.js";
import { Usuario } from "../../core/entities/Usuario.js";

const URL_BASE = "http://localhost:3000/api";

/** @implements {import("../../core/interfaces/IUsuarioEscritor.js").IUsuarioEscritor} */
export class HttpUsuarioRepositorio extends IUsuarioLector {
  /**
   * Centraliza el fetch + manejo de errores.
   * @returns {Promise<object>} el body JSON de respuesta.
   * @throws {Error} mensaje amigable cuando el backend no responde.
   */
  async #peticion(ruta, opciones = {}) {
    let respuesta;
    try {
      respuesta = await fetch(`${URL_BASE}${ruta}`, {
        headers: { "Content-Type": "application/json" },
        ...opciones
      });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor de datos. Verifica que el backend esté corriendo en localhost:3000."
      );
    }

    const cuerpo = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(cuerpo.error || "Error del servidor.");
    }
    return cuerpo;
  }

  #aEntidad(props) {
    if (!props) return null;
    return new Usuario({
      id: props.id,
      usuario: props.usuario,
      nacimiento: props.nacimiento,
      correo: props.correo,
      pass: null // la verificación de contraseña ya la hizo el backend
    });
  }

  async obtenerTodos() {
    const { usuarios } = await this.#peticion("/usuarios");
    return usuarios.map((props) => this.#aEntidad(props)).filter(Boolean);
  }

  async buscarPorCorreo(correo) {
    const { usuario } = await this.#peticion(
      `/usuarios/por-correo/${encodeURIComponent(correo)}`
    );
    return this.#aEntidad(usuario);
  }

  async buscarPorCredenciales(usuario, password) {
    try {
      const cuerpo = await this.#peticion("/usuarios/login", {
        method: "POST",
        body: JSON.stringify({ usuario, password })
      });
      return this.#aEntidad(cuerpo.usuario);
    } catch (error) {
      // 401 = credenciales inválidas -> no es un error del sistema,
      // es "usuario no encontrado" para el AutenticacionService.
      if (error.message === "Usuario o contraseña incorrectos") return null;
      throw error;
    }
  }

  async guardar(usuario) {
    // Mismo contrato que LocalStorageUsuarioRepositorio: la entidad solo
    // deja salir sus datos por toJSON() (nunca por getters sueltos).
    const datos = usuario.toJSON();
    await this.#peticion("/usuarios/registro", {
      method: "POST",
      body: JSON.stringify({
        usuario: datos.usuario,
        correo: datos.correo,
        nacimiento: datos.nacimiento,
        password: datos.pass
      })
    });
  }

  async actualizar(usuarioActualizado) {
    throw new Error(
      "actualizar() no está disponible por HTTP todavía. Usa la API de registro o el backend directamente."
    );
  }
}