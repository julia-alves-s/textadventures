import type { Entidade } from "../../db/entidadeSchema.ts";
import { Acao } from "../comandos/comandoConfig.ts";
import type { Contexto } from "../contexto.ts";
import type { ItemBase, ItemBaseStatic } from "../itens/base.ts";
import { SalaBase, type AcaoExtraPopulado, type AcoesCallbackResult, type ItemInicial, type SalaBaseStatic } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";

export type EntidadeInicial = {
    entidade: typeof EntidadeBase & EntidadeBaseStatic;
    nome?: string; // Nome único da entidade, só usado quando necessário
    itensIniciais?: ItemInicial[];
    filhosIniciais?: EntidadeInicial[];
    estadoInicial?: Estado;
    ref?: { sala: typeof SalaBase & SalaBaseStatic, nome: string }; // Quando for entidade ref. Procura a entidade do tipo e nome na sala indicada.
};

export interface EntidadeBaseStatic {
    nome: string;
    itensIniciais?: () => ItemInicial[];
    filhosIniciais?: () => EntidadeInicial[];
    estadoInicial?: () => Estado;
}

export abstract class EntidadeBase {    
    descricao(ctx: Contexto): MaybePromise<string | void> {
        return `um ${this.entidade.tipo.toLowerCase()}`;
    }
    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): MaybePromise<AcoesCallbackResult> {
        return {};
    }
    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        return {
            [Acao.$Descricao]: async () => await this.descricao(ctx),
            ...(await this.acoes(ctx, extra))
        };
    }

    entidade: Entidade
    onde: SalaBase | EntidadeBase;
    itens: ItemBase[];
    filhos: EntidadeBase[];
    ehReferencia: boolean = false;

    constructor(info: {entidade: Entidade, onde: SalaBase | EntidadeBase, itens?: ItemBase[], filhos?: EntidadeBase[]}) {
        this.entidade = info.entidade;
        this.onde = info.onde;
        this.itens = info.itens || [];
        this.filhos = info.filhos || [];
    }

    obterItensPorNome(item: typeof ItemBase & ItemBaseStatic): ItemBase[] {
        return this.itens.filter(i => i.item.nome === item.nome);
    }

    temLuz(): boolean {
        if(this.entidade.estado?.luz === true) return true;

        for(let obj of this.itens) {
            if(obj.temLuz()) return true;
        }

        for(let ent of this.filhos) {
            if(ent.temLuz()) return true;
        }

        return false;
    }

    estaVisivel() {
        return true;
    }

    getFilhosVisiveis() {
        return {
            itens: this.itens.filter(i => i.estaVisivel()),
            filhos: this.filhos.filter(e => e.estaVisivel())
        };
    }

    // Se os itens dentro dessa entidade são seguros (somem sozinhos quando limpa o chão)
    itensSeguros() {
        return false;
    }
}