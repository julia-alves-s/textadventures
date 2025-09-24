import type { Sala } from "../../db/salaSchema.ts";
import type { AcaoExtra } from "../../docs/schemas.ts";
import { Acao, type AcaoValue } from "../comandos/comandoConfig.ts";
import type { Contexto } from "../contexto.ts";
import type { EntidadeBase, EntidadeBaseStatic, EntidadeInicial } from "../entidades/base.ts";
import type { ItemBase, ItemBaseStatic } from "../itens/base.ts";
import type { ArrowOrValue, Estado, MaybePromise } from "../types.ts";

export type ItemInicial = {
    item: typeof ItemBase & ItemBaseStatic;
    quantidade: number;
    estadoInicial?: Estado;
};

export interface SalaBaseStatic {
    nome: string;
    itensIniciais?: () => ItemInicial[];
    entidadesIniciais?: () => EntidadeInicial[];
    estadoInicial?: () => Estado;
}

export type AcoesCallbackResult = {
    [acao in AcaoValue]?: ArrowOrValue<typeof SalaBase & SalaBaseStatic | string | void>;
};

export type AcaoExtraPopulado = Omit<AcaoExtra, "item" | "entidade"> & {
    item?: ItemBase;
    entidade?: EntidadeBase;
};

export abstract class SalaBase {    
    descricao(ctx: Contexto): MaybePromise<string | void> {
        return;
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

    sala: Sala;
    itens: ItemBase[];
    entidades: EntidadeBase[];

    constructor(info: {sala: Sala, itens?: ItemBase[], entidades?: EntidadeBase[]}) {
        this.sala = info.sala;
        this.itens = info.itens || [];
        this.entidades = info.entidades || [];
    }

    obterItensPorNome(item: typeof ItemBase & ItemBaseStatic): ItemBase[] {
        return this.itens.filter(i => i.item.nome === item.nome);
    }

    obterEntidadePorNome<T extends typeof EntidadeBase>(entidade: T & EntidadeBaseStatic, nome?: string | null): InstanceType<T>[] {
        return this.entidades.filter(e => e.entidade.tipo === entidade.nome && (!nome || e.entidade.nome === nome)) as InstanceType<T>[];
    }

    temLuz(): boolean {
        if(this.sala.estado?.luz === true) return true;

        for(let obj of this.itens) {
            if(obj.temLuz()) return true;
        }

        for(let ent of this.entidades) {
            if(ent.temLuz()) return true;
        }

        return false;
    }

    estaVisivel() {
        return this.temLuz();
    }

    getFilhosVisiveis() {
        return {
            itens: this.itens.filter(i => i.estaVisivel()),
            entidades: this.entidades.filter(e => e.estaVisivel())
        };
    }
};

export class SalaGlobal extends SalaBase {
    static nome = "Global";
    descricao(ctx: Contexto) {
        return "";
    }
}