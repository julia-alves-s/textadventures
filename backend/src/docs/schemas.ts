import z from "zod";

export const respostaSituacao = z.object({
    resposta: z.string().meta({
        example: "Você não pode fazer isso.",
    }),
    jogador: z.object({
        id: z.string().meta({ example: "Inicio" }),
        localId: z.uuid().meta({ example: "UUID" }),
        username: z.string().meta({
            example: "usuario123",
        }),
        salaId: z.string().meta({
            example: "Inicio",
        }),
        atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        mochila: z.array(z.object({
            id: z.uuid().meta({ example: "UUID" }),
            tipo: z.string().meta({ example: "pedra" }),
            quantidade: z.number().meta({ example: 1 }),
            atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        })).optional()
    }),
    sala: z.object({
        id: z.string().meta({ example: "Inicio" }),
        localId: z.uuid().meta({ example: "UUID" }),
        atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        itens: z.array(z.object({
            id: z.uuid().meta({ example: "UUID" }),
            tipo: z.string().meta({ example: "pedra" }),
            quantidade: z.number().meta({ example: 1 }),
            atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        })).optional(),
        entidades: z.array(z.object({
            id: z.uuid().meta({ example: "UUID" }),
            localId: z.uuid().meta({ example: "UUID" }),
            categoria: z.string().meta({ example: "JOGADOR" }),
            tipo: z.string().meta({ example: "JOGADOR" }),
            username: z.string().meta({ example: "usuario123" }),
            atualizadoEm: z.iso.datetime().meta({ example: "2023-10-05T14:48:00.000Z" }),
        })).optional(),
    }).optional(),
});

export const authUserSchema = z.object({
    id: z.uuid().meta({
        example: "UUID",
    }),
    username: z.string().meta({
        example: "usuario123",
    }),
    createdAt: z.iso.datetime().meta({
        example: "2023-10-05T14:48:00.000Z",
    }),
});