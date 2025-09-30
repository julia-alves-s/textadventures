import type { Sala } from "../../db/salaSchema.ts";
import { Armazenavel } from "../componentes/componentes.ts";
import type { Contexto } from "../contexto.ts";
import type { EntidadeBase, EntidadeBaseStatic, EntidadeInicial } from "../entidades/base.ts";
import type { ItemBase, ItemBaseStatic } from "../itens/base.ts";
import { ObjetoJogo } from "../objetoJogo.ts";
import type { Estado } from "../types.ts";

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

export abstract class SalaBase extends ObjetoJogo {
    sala: Sala;
    itens: ItemBase[];
    entidades: EntidadeBase[];

    constructor(info: {sala: Sala, itens?: ItemBase[], entidades?: EntidadeBase[]}) {
        super();
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

    /*getFilhosVisiveis() {
        return {
            itens: this.itens.filter(i => i.estaVisivel()),
            entidades: this.entidades.filter(e => e.estaVisivel())
        };
    }*/

    filhosVisiveis(): boolean {
        return true;
    }

    obterFilhos(): ObjetoJogo[] {
        return [
            ...this.itens,
            ...this.entidades
        ];
    }
};

export class SalaGlobal extends SalaBase {
    static nome = "Global";
    descricao(ctx: Contexto) {
        return "";
    }
}