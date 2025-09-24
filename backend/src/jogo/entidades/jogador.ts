import type { Contexto } from "../contexto.ts";
import type { ItemBase } from "../itens/base.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../salas/base.ts";
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
                    if(!(item.onde instanceof EntidadeBase && item.onde.entidade.id === ctx.jogador.entidade.id)) {
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
        return Date.now() - new Date(this.entidade.atualizadoEm).getTime() <= 1000 * 60 * 10;
    }

    getFilhosVisiveis(): { itens: ItemBase[]; filhos: EntidadeBase[]; } {
        if(!this.outroJogador) {
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
        }
    }

    terminouTutorial(): boolean {
        return this.entidade.estado?.terminouTutorial === true;
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

    itensSeguros(): boolean {
        return true;
    }
}