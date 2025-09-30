import type { Contexto } from "../contexto.ts";
import type { EntidadeBase } from "../entidades/base.ts";
import { itensPadrao } from "../itens/inicio.ts";
import { ComponenteJogo, type AcaoExtraPopulado, type AcoesCallbackResult, type ComponentCallback, type ComponenteConfig } from "../objetoJogo.ts";
import type { MaybePromise } from "../types.ts";

export class Abrivel extends ComponenteJogo<EntidadeBase> {
    private readonly listener: {
        aoAbrir: ComponentCallback;
        aoFechar: ComponentCallback;
    };
    constructor(objeto: EntidadeBase, config?: {
        aoAbrir?: ComponentCallback;
        aoFechar?: ComponentCallback;
    } & ComponenteConfig) {
        const { estaAtivo, ..._listener} = config || {};
        super(objeto, estaAtivo ? { estaAtivo } : undefined);

        this.listener = {
            aoAbrir: async (ctx) => { ctx.escrevaln("Abriu."); return true },
            aoFechar: async (ctx) => { ctx.escrevaln("Fechou."); return true },
            ..._listener,
        };
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        if(this.estaAberto()) {
            return {
                "FECHAR": async () => this.fechar(ctx, extra),
            };
        } else {
            return {
                "ABRIR": async () => this.abrir(ctx, extra),
            };
        }
    }

    estaAberto() {
        return this.objeto.entidade.estado?.aberto === true;
    }
    async abrir(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        if((await this.listener.aoAbrir(ctx, extra)) === true) {
            await ctx.alterarEntidade(this.objeto, { estado: { aberto: true }});
        }
    }
    async fechar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        if((await this.listener.aoFechar(ctx, extra)) === true) {
            await ctx.alterarEntidade(this.objeto, { estado: { aberto: false }});
        }
    }
}

export class Trancavel extends ComponenteJogo<EntidadeBase> {
    private readonly listener: {
        aoDestrancar: ComponentCallback;
        aoTrancar: ComponentCallback;
    };
    constructor(objeto: EntidadeBase, config?: {
        aoDestrancar?: ComponentCallback;
        aoTrancar?: ComponentCallback;
    } & ComponenteConfig) {
        const { estaAtivo, ..._listener} = config || {};
        super(objeto, estaAtivo ? { estaAtivo } : undefined);

        this.listener = {
            aoDestrancar: async (ctx) => { ctx.escrevaln("Destrancou."); return true },
            aoTrancar: async (ctx) => { ctx.escrevaln("Trancou."); return true },
            ..._listener,
        };
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        if(!this.estaTrancado()) {
            return {
                "TRANCAR": async () => this.trancar(ctx, extra),
            };
        } else {
            return {
                "DESTRANCAR": async () => this.destrancar(ctx, extra),
            };
        }
    }

    estaTrancado() {
        return this.objeto.entidade.estado?.trancado === true;
    }
    _verificaChave(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        const chave = extra?.item || ctx.jogador.obterItensPorNome(itensPadrao.Chave).at(0);
        if(!chave) {
            ctx.escrevaln("A porta está trancada, você precisa de uma chave para abri-la.");
            return false;
        }
        if(!chave.estaNaMochila(ctx)) {
            ctx.escrevaln("Você não tem isso");
            return false;
        }
        const chaveCerta = chave.item.nome === itensPadrao.Chave.nome && chave.item.estado?.abre === this.objeto.entidade.nome;
        if(!chaveCerta) {
            ctx.escrevaln("Não é a chave certa");
            return false;
        }
        return true;
    }
    async trancar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        if(!this._verificaChave(ctx, extra)) return;

        if((await this.listener.aoTrancar(ctx, extra)) === true) {
            await ctx.alterarEntidade(this.objeto, { estado: { trancado: true }});
        }
    }
    async destrancar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        if(!this._verificaChave(ctx, extra)) return;

        if((await this.listener.aoDestrancar(ctx, extra)) === true) {
            await ctx.alterarEntidade(this.objeto, { estado: { trancado: false }});
        }
    }
}

export class Armazenavel extends ComponenteJogo<EntidadeBase> {
    private readonly listener: {
        aoColocar: ComponentCallback;
    };
    constructor(objeto: EntidadeBase, config?: {
        aoColocar: ComponentCallback;
    } & ComponenteConfig) {
        const { estaAtivo, ..._listener} = config || {};
        super(objeto, estaAtivo ? { estaAtivo } : undefined);
        
        this.listener = {
            aoColocar: async (ctx) => { ctx.escrevaln("Colocou."); return true },
            ..._listener,
        };
    }

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): AcoesCallbackResult {
        return {
            "COLOCAR": async () => this.colocar(ctx, extra),
        };
    }

    async colocar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        const item = extra?.item;
        if(!item) {
            return "Deve especificar o que quer colocar.";
        }
        if(!item.estaNaMochila(ctx)) {
            return "Você não tem esse item.";
        }

        if((await this.listener.aoColocar(ctx, extra)) === true) {
            await ctx.moverItem(item, { 
                quantidade: extra?.quantidade || item.item.quantidade,
                onde: this.objeto
            });
        }
    }
}

export class Vendedor extends ComponenteJogo<EntidadeBase> {

    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): MaybePromise<AcoesCallbackResult> {
        return {};
    }

    // Vai ser chamado pelo item.
    async vender(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        const item = extra?.item;
        if(!item) {
            return "Deve especificar o que quer vender.";
        }
        const itemMochila = ctx.jogador.itens.find(i => i.item.nome === item.item.nome && i.item.pilhaId === item.item.pilhaId);
        if(!itemMochila) {
            return "Você não tem esse item.";
        }
        const quantidade = extra?.quantidade || itemMochila.item.quantidade;
        if(quantidade > itemMochila.item.quantidade) {
            return `Você não tem tudo isso.`;
        }
        
        const valorItem = item.obterPreco();
        if(valorItem <= 0) {
            return "Esse item não vale nada.";
        }

        await ctx.moverItem(itemMochila, { 
            quantidade: quantidade,
            onde: this.objeto
        });
        await ctx.criarItem({
            item: itensPadrao.Moedas, 
            quantidade: Math.ceil(valorItem * quantidade), 
            onde: ctx.jogador 
        });
        return `Vendeu ${quantidade}x ${item.item.nome} por ${Math.ceil(valorItem * quantidade)} moedas.`;
    }

    // Vai ser chamado pelo item.
    async comprar(ctx: Contexto, extra?: AcaoExtraPopulado | null) {
        const item = extra?.item;
        if(!item) {
            return "Deve especificar o que quer comprar.";
        }
        // Verificar se o item escolhido é do vendedor
        if("entidade" in item.onde && item.onde.entidade.id !== this.objeto.entidade.id) {
            return "Não dá para comprar isso aqui.";
        }
        const quantidade = extra?.quantidade || 1;
        if(quantidade > item.item.quantidade) {
            return `Não tem tudo isso em estoque.`;
        }
        if(quantidade === item.item.quantidade) {
            return "Não pode comprar até o que está na vitrine! deixe pelo menos 1.";
        }
        
        const valorItem = item.obterPreco();
        if(valorItem <= 0) {
            await ctx.moverItem(item, { 
                quantidade: quantidade,
                onde: ctx.jogador
            });
            return `Pegou ${quantidade}x ${item.item.nome} de graça.`;
        }
        
        const precoTotal = Math.ceil((valorItem * 1.1) * quantidade);
        const moedas = ctx.jogador.obterItensPorNome(itensPadrao.Moedas).at(0);
        if(!moedas || moedas.item.quantidade < precoTotal) {
            return `Você não tem moedas suficientes. Custa ${precoTotal} moedas.`;
        }

        await ctx.moverItem(moedas, { 
            quantidade: precoTotal,
            onde: null
        });
        await ctx.moverItem(item, { 
            quantidade: quantidade,
            onde: ctx.jogador
        });
        return `Comprou ${quantidade}x ${item.item.nome} por ${precoTotal} moedas.`;
    }
}