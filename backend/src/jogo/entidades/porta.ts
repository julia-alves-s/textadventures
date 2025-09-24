import type { Contexto } from "../contexto.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { EntidadeBase } from "./base.ts";

export class EntidadePorta extends EntidadeBase {
    static nome = "PORTA";
    static estadoInicial = (): Estado => ({ aberto: false });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.entidade.estado?.aberto) {
            return "Uma porta aberta";
        } else {
            return "Uma porta fechada, talvez você possa abri-la.";
        }
    }

    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        if(this.estaAberto()) {
            return {
                "FECHAR": async () => this.fechar(ctx, extra),
                ...(await super._acoes(ctx, extra)),
            };
        } else {
            return {
                "ABRIR": async () => this.abrir(ctx, extra),
                ...(await super._acoes(ctx, extra)),
            };
        }
    }

    estaAberto() {
        return this.entidade.estado?.aberto === true;
    }
    async abrir(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        await ctx.alterarEntidade(this, { estado: { aberto: true }});
        return "Você abre a porta.";
    }
    async fechar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        await ctx.alterarEntidade(this, { estado: { aberto: false }});
        return "Você fecha a porta.";
    }

    getFilhosVisiveis() {
        if(this.entidade.estado?.aberto) {
            return super.getFilhosVisiveis();
        } else {
            return { itens: [], filhos: [] };
        }
    }
}