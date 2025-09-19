import z from "zod";
import { type DocPaths } from "../utils/docs.ts";
import { respostaSituacao } from "./schemas.ts";

export const itemDocs = {
    "/item/pegar": {
        post: {
            summary: "Pega um item do chão",
            description: "Adiciona um item, que está no chão da sala atual, ao inventário do jogador.",
            schema: {
                body: z.object({
                    item: z.uuid().meta({
                        description: "ID do item a ser pego",
                        example: "UUID",
                    }),
                    quantidade: z.number().min(1).optional().meta({
                        description: "Quantidade do item a ser pego (para itens empilháveis). Padrão é 1",
                        example: 1,
                    }).default(1),
                }),
                response: respostaSituacao
            }
        }
    },
    "/item/largar": {
        post: {
            summary: "Larga um item da mochila",
            description: "Remove um item da mochila do jogador e o coloca no chão da sala atual.",
            schema: {
                body: z.object({
                    item: z.uuid().meta({
                        description: "ID do item a ser largado da mochila",
                        example: "UUID",
                    }),
                    quantidade: z.number().min(1).optional().meta({
                        description: "Quantidade do item a ser largado (para itens empilháveis). Padrão é 1",
                        example: 1,
                    }).default(1),
                }),
                response: respostaSituacao
            }
        }
    },
    "/item/acao": {
        post: {
            summary: "Realiza uma ação com um item",
            description: "Realiza uma ação específica com um item que está na mochila ou no chão",
            schema: {
                body: z.object({
                    item: z.uuid().meta({
                        description: "ID do item com o qual realizar a ação",
                        example: "UUID",
                    }),
                    acao: z.string().meta({
                        description: "Ação a ser realizada",
                        example: "usar",
                    }),
                    extra: z.record(z.string(), z.any()).optional().meta({
                        description: "Dados extras para a ação, se necessário",
                        example: { chave: "valor" },
                    }),
                }),
                response: respostaSituacao
            }
        }
    }
} satisfies DocPaths;