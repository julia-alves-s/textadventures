import type { Contexto } from "./contexto.ts";
import { itensInicio } from "./itens/inicio.ts";
import { salasInicio } from "./salas/inicio.ts";
import type { Estado, ItemInfo, SalaInfo } from "./types.ts";

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

type CallbackOrValue<T, U> = T | ((ctx: Contexto, info: U, extra?: Estado | null) => T | Promise<T>);

export type ItemType<ITEM = string> = {
    descricao: CallbackOrValue<string | void, ItemInfo>;
    acoes?: CallbackOrValue<{ 
        [acao: string]: CallbackOrValue<string | void, ItemInfo>;
    }, ItemInfo>;
    itensIniciais?: {
        nome: ITEM;
        quantidade: number;
        estadoInicial?: Estado;
    }[];
};

export type SalaType<SALA = string, ITEM = string> = {
    descricao: CallbackOrValue<string | void, SalaInfo>;
    conexoes: CallbackOrValue<{ 
        [direcao: string]: CallbackOrValue<SALA | void, SalaInfo>;
    }, SalaInfo>;
    acoes?: CallbackOrValue<{ 
        [acao: string]: CallbackOrValue<string | void, SalaInfo>;
    }, SalaInfo>;
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

export const execCallbackOrValue = async <T, U>(callbackOrValue: CallbackOrValue<T, U>, ctx: Contexto, info: U, extra?: Estado | null) => {
    if(typeof callbackOrValue === "function") {
        return await (callbackOrValue as (ctx: Contexto, info: U, extra?: Estado | null) => T | Promise<T>)(ctx, info, extra);
    } else {
        return callbackOrValue;
    }
}

// https://lowrey.me/implementing-javas-string-hashcode-in-javascript/
function hashString(str: string){
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

export const gerarPilhaId = (itemNome: ItemTipo, estado?: Estado | null) => {
    if(!estado || Object.keys(estado).length === 0) {
        return itemNome;
    } else {
        const chaves = Object.keys(estado).sort().map((k) => `${k}=${JSON.stringify(estado[k])}`);
        const serializadoA = chaves.join("@");
        const serializadoB = chaves.join("!").split("").reverse().join("");
        return `${itemNome}:${chaves.length.toString(36)}:${hashString(serializadoA).toString(36)}:${hashString(serializadoB).toString(36)}`;
    }
}