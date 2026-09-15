import { Carta } from "../entities/carta.js";


export class CartaService {

    constructor() {

        this.rutaBack =
            "assets/img/respaldomuerte.png";

        this.rutaAldeas =
            "assets/img/cards/aldeas/";


        this.cartasDisponibles = [

            // =========================
            // KONOHA - UZUMAKI
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "konoha",

                clan: "uzumaki",

                valor: valor

            })),


            // =========================
            // KONOHA - HYUGA
            // =========================

            ...[
                "1","2","3","4",
                "5","6"
            ].map(valor => ({

                aldea: "konoha",

                clan: "hyuga",

                valor: valor

            })),


            // =========================
            // KONOHA - UCHIHA
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "konoha",

                clan: "uchiha",

                valor: valor

            })),


            // =========================
            // KONOHA - SARUTOBI
            // =========================

            ...[
                "1","2","3","4",
                "5","6"
            ].map(valor => ({

                aldea: "konoha",

                clan: "sarutobi",

                valor: valor

            })),


            // =========================
            // ARENA
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "arena",

                valor: valor

            })),


            // =========================
            // ROCA
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "roca",

                valor: valor

            })),


            // =========================
            // NIEBLA
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "niebla",

                valor: valor

            })),


            // =========================
            // NUBE
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7","8"
            ].map(valor => ({

                aldea: "nube",

                valor: valor

            })),


            // =========================
            // AKATSUKI
            // =========================

            ...[
                "1","2","3","4",
                "5","6","7"
            ].map(valor => ({

                aldea: "akatsuki",

                valor: valor

            }))

        ];

    }


    obtenerNiveles() {

        return [

            {
                cartas: 8,
                aldea: "konoha",
                clan: "uzumaki"
            },

            {
                cartas: 6,
                aldea: "konoha",
                clan: "hyuga"
            },

            {
                cartas: 8,
                aldea: "konoha",
                clan: "uchiha"
            },

            {
                cartas: 6,
                aldea: "konoha",
                clan: "sarutobi"
            },

            {
                cartas: 8,
                aldea: "arena"
            },

            {
                cartas: 8,
                aldea: "roca"
            },

            {
                cartas: 8,
                aldea: "niebla"
            },

            {
                cartas: 8,
                aldea: "nube"
            },

            {
                cartas: 7,
                aldea: "akatsuki"
            }

        ];

    }


    generarTablero(nivelActual) {

        const niveles =
            this.obtenerNiveles();


        const nivel =
            niveles[nivelActual - 1];


        if (!nivel) {

            console.error(
                "No existe el nivel:",
                nivelActual
            );

            return [];

        }


        let disponibles =
            this.cartasDisponibles.filter(
                carta => {

                    if (
                        carta.aldea !==
                        nivel.aldea
                    ) {

                        return false;

                    }


                    if (
                        nivel.clan &&
                        carta.clan !==
                        nivel.clan
                    ) {

                        return false;

                    }


                    return true;

                }
            );


        disponibles.sort(
            () => Math.random() - 0.5
        );


        const seleccionadas =
            disponibles.slice(
                0,
                nivel.cartas
            );


        const cartasJuego = [];


        seleccionadas.forEach(
            (datos, indice) => {

                cartasJuego.push(

                    new Carta(

                        datos.aldea,

                        datos.clan || null,

                        datos.valor,

                        indice

                    )

                );


                cartasJuego.push(

                    new Carta(

                        datos.aldea,

                        datos.clan || null,

                        datos.valor,

                        indice

                    )

                );

            }
        );


        cartasJuego.sort(
            () => Math.random() - 0.5
        );


        return cartasJuego;

    }


    obtenerImagenFrontal(carta) {

        if (
            carta.getAldea() ===
            "konoha"
        ) {

            return (
                this.rutaAldeas +
                "konoha/" +
                carta.getClan() +
                "/" +
                carta.getValor() +
                ".png"
            );

        }


        return (

            this.rutaAldeas +

            carta.getAldea() +

            "/" +

            carta.getValor() +

            ".png"

        );

    }


    obtenerImagenBack() {

        return this.rutaBack;

    }

}