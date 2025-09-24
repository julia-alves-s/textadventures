import type { Contexto } from "../contexto.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { EntidadeBase } from "./base.ts";

class Bau extends EntidadeBase {
    static nome = "BAU";
    static estadoInicial = (): Estado => ({ aberto: false });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.entidade.estado?.aberto) {
            return "Um baú aberto";
        } else {
            return "Um baú fechado, talvez você possa abri-lo.";
        }
    }

    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        if(this.estaAberto()) {
            return {
                "FECHAR": async () => this.fechar(ctx),
                "COLOCAR": async () => {
                    const item = extra?.item;
                    if(!item) {
                        return "Deve especificar o que quer colocar no baú.";
                    }
                    if(!(item.onde instanceof EntidadeBase && item.onde.entidade.id === ctx.jogador.entidade.id)) {
                        return "Você não tem esse item.";
                    }
                    await ctx.moverItem(item, { 
                        quantidade: extra?.quantidade || item.item.quantidade,
                        onde: this
                    });
                    return "Colocou no baú.";
                },
                ...(await super._acoes(ctx, extra)),
            };
        } else {
            return {
                "ABRIR": async () => this.abrir(ctx),
                ...(await super._acoes(ctx, extra)),
            };
        }
    }

    estaAberto() {
        return this.entidade.estado?.aberto === true;
    }
    async abrir(ctx: Contexto) {
        await ctx.alterarEntidade(this, { estado: { aberto: true }});
        return "Você abre o baú.";
    }
    async fechar(ctx: Contexto) {
        await ctx.alterarEntidade(this, { estado: { aberto: false }});
        return "Você fecha o baú.";
    }

    getFilhosVisiveis() {
        if(this.entidade.estado?.aberto) {
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
        }
    }
    
    itensSeguros() {
        return true;
    }
}

export const entidadesContainer = {
    Bau
};