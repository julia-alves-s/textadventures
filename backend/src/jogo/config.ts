import type { Entidade } from "../db/entidadeSchema.ts";
import type { Item } from "../db/itemSchema.ts";
import type { Sala } from "../db/salaSchema.ts";
import type { EntidadeBase, EntidadeBaseStatic } from "./entidades/base.ts";
import type { Estado } from "./types.ts";
import type { ItemBase, ItemBaseStatic } from "./itens/base.ts";

import { entidadesContainer } from "./entidades/container.ts";
import { EntidadeJogador } from "./entidades/jogador.ts";
import * as entidadesPorta from "./entidades/porta.ts";

import { itensPadrao } from "./itens/inicio.ts";

import { SalaBase, SalaGlobal, type SalaBaseStatic } from "./salas/base.ts";
import { entidadesInicio, salaasInicio } from "./salas/inicio.ts";
import { entidadesClareira, salasClareira } from "./salas/clareira.ts";
import { EntidadeArvore } from "./entidades/arvore.ts";

const _itensArray: (typeof ItemBase & ItemBaseStatic)[] = [
    ...Object.values(itensPadrao)
];
export const _itens: Map<string, typeof ItemBase & ItemBaseStatic> = new Map();
for(let classe of _itensArray) {
    _itens.set(classe.nome, classe);
}

const _salasArray: (typeof SalaBase & SalaBaseStatic)[] = [
    SalaGlobal,
    ...Object.values(salaasInicio),
    ...Object.values(salasClareira)
];
export const _salas: Map<string, typeof SalaBase & SalaBaseStatic> = new Map();
for(let classe of _salasArray) {
    _salas.set(classe.nome, classe);
}

const _entidadesArray: (typeof EntidadeBase & EntidadeBaseStatic)[] = [
    EntidadeJogador,
    EntidadeArvore,
    ...Object.values(entidadesContainer),
    ...Object.values(entidadesPorta),
    ...Object.values(entidadesInicio),
    ...Object.values(entidadesClareira)
];
export const _entidades: Map<string, typeof EntidadeBase & EntidadeBaseStatic> = new Map();
for(let classe of _entidadesArray) {
    _entidades.set(classe.nome, classe);
}

export const getItemConfig = <T extends ItemBase = ItemBase>(itemTipo: string, info: {
    item: Item;
    onde: SalaBase | EntidadeBase;
}): T => {
    let itemConfig = _itens.get(itemTipo);
    if(!itemConfig) {
        throw new Error(`Item com tipo ${itemTipo} não existe na configuração do jogo!`);
    }
    return (new (itemConfig as any)(info)) as T;
}

export const getSalaConfig = <T extends SalaBase = SalaBase>(salaNome: string, info: {
    sala: Sala;
    itens?: ItemBase[];
    entidades?: EntidadeBase[];
}): T => {
    let salaConfig = _salas.get(salaNome);
    if(!salaConfig) {
        throw new Error(`Sala com id ${salaNome} não existe na configuração do jogo!`);
    }
    return (new (salaConfig as any)(info)) as T;
}

export const getEntidadeConfig = <T extends EntidadeBase = EntidadeBase>(entidadeTipo: string, info: {
    entidade: Entidade;
    onde: SalaBase | EntidadeBase;
    itens?: ItemBase[];
    filhos?: EntidadeBase[];
}): T => {
    let entidadeConfig = _entidades.get(entidadeTipo);
    if(!entidadeConfig) {
        throw new Error(`Entidade com tipo ${entidadeTipo} não existe na configuração do jogo!`);
    }
    return (new (entidadeConfig as any)(info)) as T;
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

export const gerarPilhaId = (itemNome: string, estado?: Estado | null) => {
    if(!estado || Object.keys(estado).length === 0) {
        return itemNome;
    } else {
        const chaves = Object.keys(estado).sort().map((k) => `${k}=${JSON.stringify(estado[k])}`);
        const serializadoA = chaves.join("@");
        const serializadoB = chaves.join("!").split("").reverse().join("");
        return `${itemNome}:${chaves.length.toString(36)}:${hashString(serializadoA).toString(36)}:${hashString(serializadoB).toString(36)}`;
    }
}