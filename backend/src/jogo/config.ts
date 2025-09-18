import type { Estado } from "../db/estadoSchema.ts";
import type { Contexto } from "./contexto.ts";
import { itensInicio } from "./itens/inicio.ts";
import { salasInicio } from "./salas/inicio.ts";

const _itens = {
    ...itensInicio,
} as const;

const _salas = {
    ...salasInicio,
    Global: {
        descricao: () => "Lógica global que afeta todas as salas. Impossível de acessar diretamente.",
        conexoes: {},
        estadoInicial: {}
    }
} as const;

export type ItemType<ITEM = string> = {
    descricao: (ctx: Contexto) => void | string | Promise<string | void>;
    itensIniciais?: {
        nome: ITEM;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
};

export type SalaType<SALA = string, ITEM = string> = {
    descricao: (ctx: Contexto) => void | string | Promise<string | void>;
    conexoes: { 
        [direcao: string]: (ctx: Contexto) => void | SALA | Promise<SALA | void>;
    };
    itensIniciais?: readonly {
        nome: ITEM;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
    estadoInicial?: Estado;
};


export type ItemTipo = keyof typeof _itens;
export const itens: Record<ItemTipo, ItemType<ItemTipo>> = _itens;
export const getItemConfig = (itemTipo: ItemTipo) => {
    let itemConfig = itens[itemTipo];
    if(!itemConfig) {
        throw new Error(`Item com tipo ${itemTipo} não existe na configuração do jogo!`);
    }

    return itemConfig;
}

export type SalaNome = keyof typeof _salas;
export const salas: Record<SalaNome, SalaType<SalaNome, ItemTipo>> = _salas;
export const getSalaConfig = (salaId: SalaNome) => {
    let salaConfig = salas[salaId];
    if(!salaConfig) {
        throw new Error(`Sala com id ${salaId} não existe na configuração do jogo!`);
    }
    return salaConfig;
}