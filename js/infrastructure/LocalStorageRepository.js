import { IUsuarioLector } from "../../core/interfaces/IUsuarioLector.js";
import { Usuario } from "../../core/entities/Usuario.js";

export class LocalStorageUsuarioRepositorio extends IUsuarioLector {

    async obtenerTodos() {

        const respuesta = await fetch("http://localhost:3000/jugadores");

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los jugadores.");
        }

        const datos = await respuesta.json();

        return datos.map((dato) => Usuario.desdeJSON(dato));
    }

    async buscarPorCorreo(correo) {

        const usuarios = await this.obtenerTodos();

        return usuarios.find((u) => u.correo === correo) || null;
    }

    async guardar(usuario) {

        const respuesta = await fetch("http://localhost:3000/jugadores", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nombre: usuario.usuario,
                password: usuario.pass,
                nacimiento: usuario.nacimiento,
                correo: usuario.correo
            })
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo registrar el usuario.");
        }

        return await respuesta.json();
    }

    async buscarPorCredenciales(usuario, password) {

        const usuarios = await this.obtenerTodos();

        return usuarios.find(
            (u) =>
                u.usuario === usuario &&
                u.verificarPassword(password)
        ) || null;
    }

    async actualizar(usuarioActualizado) {

        throw new Error("La actualización todavía no está implementada.");
    }
}