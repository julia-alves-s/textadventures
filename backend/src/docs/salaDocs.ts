import z from "zod";
import { type DocPaths } from "../utils/docs.ts";
import { respostaSituacao } from "./schemas.ts";

export const salaDocs = {
    "/sala/olhar": {
        get: {
            summary: "Descreve a sala atual",
            description: "Retorna a descrição completa da sala onde o jogador se encontra, incluindo saídas, itens no chão e outras entidades visíveis.",
            schema: {
                response: respostaSituacao.extend({
                    sala: z.object({
                        id: z.string().meta({ example: "Inicio" }),
                        localId: z.uuid().meta({ example: "UUID" }),
                        descricao: z.string().meta({
                            example: "Você está em uma sala iluminada. Há uma porta ao norte e uma janela ao sul.",
                        }),
                        conexoes: z.array(z.string()).meta({
                            example: ["N", "S"],
                        }),
                        atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
                        itens: z.array(z.object({
                            id: z.uuid().meta({ example: "UUID" }),
                            tipo: z.string().meta({ example: "pedra" }),
                            quantidade: z.number().meta({ example: 1 }),
                            descricao: z.string().meta({ example: "Uma pedra comum." }),
                            atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
                        })),
                        entidades: z.array(z.object({
                            id: z.uuid().meta({ example: "UUID" }),
                            localId: z.uuid().meta({ example: "UUID" }),
                            categoria: z.string().meta({ example: "JOGADOR" }),
                            tipo: z.string().meta({ example: "JOGADOR" }),
                            username: z.string().meta({ example: "usuario123" }),
                            atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
                            descricao: z.string().meta({ example: "" }),
                        })).optional(),
                    }),
                    resposta: z.string().meta({
                        example: "Está tudo escuro aqui.",
                    }),
                })
            }
        }
    },
    "/sala/mover": {
        post: {
            summary: "Move o jogador para uma direção",
            description: "Tenta mover o jogador para uma sala adjacente na direção especificada (ex: norte, sul, leste, oeste).",
            schema: {
                body: z.object({
                    direcao: z.string().toUpperCase().meta({
                        description: "Direção para a qual se mover.",
                        example: "norte",
                    }),
                }),
                response: respostaSituacao
            }
        }
    }
} satisfies DocPaths;