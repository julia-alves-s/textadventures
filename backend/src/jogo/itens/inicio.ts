import type { Contexto } from "../contexto.ts";
import type { Estado, ItemInfo } from "../types.ts";

export const itensInicio = {
    Pedra: {
        descricao: () => "Pedra comum, redonda e cinza.",
    },
    Moedas: {
        descricao: () => "Moedas antigas, parecem ser de ouro maciço.",
    },
    Lampiao: {
        descricao: async (ctx: Contexto, info: ItemInfo) => {
            if(info.estado?.luz) {
                if(info.quantidadeInicial === null && Math.random() < 0.005) { // 0.5% de chance de apagar quando examinado, mas o que fica no chão da sala inicial não apaga
                    // A FAZER: deveria ser uma ação/trigger/listener/etc..., não um efeito colateral de examinar
                    await ctx.moverItem(info as any, { ondeId: info.ondeId, quantidade: 1, estado: { luz: false } });
                    return "Lampião antigo (apagado) *O Lampião se apagou!*";
                } else {
                    return "Lampião antigo (aceso)";
                }
            } else {
                return "Lampião antigo (apagado)";
            }
        },
        estadoInicial: {
            luz: true
        }
    },
    Corda: {
        descricao: () => "Corda resistente, parece que aguenta bastante peso."
    },
    Papel: {
        descricao: (ctx: Contexto, info: ItemInfo) => {
            if(info.estado?.texto && typeof info.estado.texto === "string") {
                if(info.estado.texto.length > 32)
                    return "Pedaço de papel, escrito: "+info.estado.texto.substring(0,32)+"...";
                else
                    return "Pedaço de papel, escrito: "+info.estado.texto+"";
            } else {
                return "Pedaço de papel em branco."
            }
        },
        acoes: {
            "LER": (ctx: Contexto, info: ItemInfo) => {
                if(info.estado?.texto && typeof info.estado.texto === "string") {
                    return "No papel está escrito: \n" + info.estado.texto;
                } else {
                    return "O papel está em branco.";
                }
            },
            "ESCREVER": async (ctx: Contexto, info: ItemInfo, extra?: Estado | null) => {
                let txt = "";
                if(extra?.texto && typeof extra.texto === "string") {
                    txt = extra.texto.replaceAll(/[^\x20-\x7E]+/g,"").substring(0,1024);
                }

                await ctx.moverItem(info as any, { ondeId: info.ondeId, quantidade: 1, estado: { texto: txt } });
                return "Você escreve no papel.";
            }
        }
    }
} as const;