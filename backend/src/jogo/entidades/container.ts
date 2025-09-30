import { Abrivel, Armazenavel } from "../componentes/componentes.ts";
import type { Contexto } from "../contexto.ts";
import { ComponenteJogo } from "../objetoJogo.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { EntidadeBase } from "./base.ts";

class Bau extends EntidadeBase {
    static nome = "BAU";
    static estadoInicial = (): Estado => ({ aberto: false });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.obterComponente(Abrivel).estaAberto()) {
            return "Um baú aberto";
        } else {
            return "Um baú fechado, talvez você possa abri-lo.";
        }
    }

    componentes(): ComponenteJogo<any>[] {
        return [
            new Abrivel(this, {
                aoAbrir: async (ctx) => { ctx.escrevaln("Você abre o baú."); return true },
                aoFechar: async (ctx) => { ctx.escrevaln("Você fecha o baú."); return true },
            }),
            new Armazenavel(this, {
                aoColocar: async (ctx) => { ctx.escrevaln("Colocou no baú"); return true; },
                estaAtivo: async (ctx) => { return this.obterComponente(Abrivel).estaAberto() },
            })
        ];
    }

    filhosVisiveis(): boolean {
        return this.obterComponente(Abrivel).estaAberto();
    }
    
    itensSeguros() {
        return true;
    }
}

export const entidadesContainer = {
    Bau
};