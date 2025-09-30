import { Abrivel } from "../componentes/componentes.ts";
import type { Contexto } from "../contexto.ts";
import type { ComponenteJogo } from "../objetoJogo.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { EntidadeBase } from "./base.ts";

export class EntidadePorta extends EntidadeBase {
    static nome = "PORTA";
    static estadoInicial = (): Estado => ({ aberto: false });

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.obterComponente(Abrivel).estaAberto()) {
            return "Uma porta aberta";
        } else {
            return "Uma porta fechada, talvez você possa abri-la.";
        }
    }

    componentes(): ComponenteJogo<any>[] {
        return [
            new Abrivel(this, {
                aoAbrir: async (ctx) => { ctx.escrevaln("Você abre a porta."); return true },
                aoFechar: async (ctx) => { ctx.escrevaln("Você fecha a porta."); return true },
            })
        ];
    }
}