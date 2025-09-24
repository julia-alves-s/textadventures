import type { Contexto } from "../contexto.ts";
import { itensPadrao } from "../itens/inicio.ts";
import type { AcaoExtraPopulado, AcoesCallbackResult } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";
import { EntidadeBase } from "./base.ts";

export class EntidadeArvore extends EntidadeBase {
    static nome = "Arvore";
    static estadoInicial = (): Estado => ({ cortadaEm: null });

    tempoCortada() {
        const cortadaEm = this.entidade.estado?.cortadaEm;
        if(!cortadaEm || typeof cortadaEm !== "number") return Infinity;

        return Date.now() - cortadaEm;
    }

    estaCrescida() {
        return this.tempoCortada() > 1000 * 60 * 10; // 10 minutos
    }

    descricao(ctx: Contexto): MaybePromise<string | void> {
        if(this.estaCrescida()) {
            return "Uma árvore alta e robusta.";
        }
        const tempo = this.tempoCortada();
        if(tempo < 1000 * 60) {
            return "Um toco de árvore recém cortada.";
        } else if(tempo < 1000 * 60 * 2) {
            return "Um toco de árvore que está começando a brotar.";
        } else if(tempo < 1000 * 60 * 4) {
            return "Um toco de árvore com alguns galhos pequenos crescendo.";
        } else if(tempo < 1000 * 60 * 7) {
            return "Uma árvore jovem, ainda pequena mas crescendo rapidamente.";
        } else {
            return "Uma árvore que está quase crescida.";
        }
    }

    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        if(this.estaCrescida()) {
            return {
                "CORTAR": async () => this.cortar(ctx, extra),
                ...(await super._acoes(ctx, extra)),
            };
        } else {
            return {
                ...(await super._acoes(ctx, extra)),
            };
        }
    }

    async cortar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        const machado = extra?.item || ctx.jogador.obterItensPorNome(itensPadrao.Machado).at(0);
        if(!machado) {
            return "Você precisa de um machado para cortar a árvore.";
        }
        if(machado.item.nome !== itensPadrao.Machado.nome) {
            return "Não dá para cortar a árvore com isso.";
        }
        // 4 chances em 5 de não conseguir cortar
        const sorteio = Math.floor(Math.random() * 100);
        if(sorteio < 80) {
            if(sorteio > 40) { // 1 em 2 de não conseguir nada
                return "Você começa a cortar a árvore, ainda há muito trabalho pela frente.";
            } else if(sorteio > 10) {
                return "Você tenta cortar a árvore, e faz algum progresso.";
            } else if(sorteio > 1) {
                await ctx.criarItem({ item: itensPadrao.Tronco, quantidade: 1, onde: this.onde });
                return "Você corta a árvore e cai alguns galhos...";
            } else if(sorteio > 0) {
                await ctx.criarItem({ item: itensPadrao.Tronco, quantidade: Math.floor((Math.random()*Math.random()) * 5) + 1, onde: this.onde });
                return "Você corta a árvore e cai muitos galhos...";
            } else {
                await ctx.moverItem(machado, { quantidade: 1, onde: this.onde }); // Joga o machado no chão
                return "Ao cortar a árvore, seu machado ricocheteia e cai no chão!";
            }
        }
        
        await ctx.alterarEntidade(this, { estado: { cortadaEm: Date.now() }});
        await ctx.criarItem({ item: itensPadrao.Tronco, quantidade: Math.floor((Math.random()*Math.random()) * 3) + 1, onde: this.onde });
        return "Você corta a árvore, deixando apenas um toco.";
    }
}