import type { Contexto } from "../contexto.ts";
import type { ItemBase } from "../itens/base.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../objetoJogo.ts";
import { EntidadeBase } from "./base.ts";

export class EntidadeJogador extends EntidadeBase {
    static nome = "JOGADOR";

    outroJogador = true;

    descricao(ctx: Contexto) {
        if(!this.outroJogador) {
            return "Você mesmo.";
        } else {
            return this.entidade.username || "um jogador";
        }
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        if(this.outroJogador) {
            return {
                "DAR": async () => {
                    const item = extra?.item;
                    if(!item) {
                        return "Deve especificar o que quer dar.";
                    }
                    if(!item.estaNaMochila(ctx)) {
                        return "Você não tem esse item.";
                    }
                    await ctx.moverItem(item, { 
                        quantidade: extra?.quantidade || item.item.quantidade,
                        onde: this
                    });
                    return "Você entrega o item.";
                }
            };
        } else {
            return {};
        }
    }

    estaVisivel(): boolean {
        if(this.outroJogador) {
            return Date.now() - new Date(this.entidade.atualizadoEm).getTime() <= 1000 * 60 * 10;
        } else {
            return true;
        }
    }
    
    filhosVisiveis(): boolean {
        return this.outroJogador === false;
    }

    itensSeguros() {
        return true;
    }
}

export class EntidadeNPC extends EntidadeBase {
    static nome = "NPC";

    descricao(ctx: Contexto) {
        return this.entidade.nome || "Alguém desconhecido.";
    }

    filhosVisiveis(): boolean {
        return false;
    }

    itensSeguros(): boolean {
        return true;
    }
}