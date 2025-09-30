import type { AcaoExtra } from "../docs/schemas.ts";
import { Acao, type AcaoValue } from "./comandos/comandoConfig.ts";
import type { Contexto } from "./contexto.ts";
import type { EntidadeBase } from "./entidades/base.ts";
import type { ItemBase } from "./itens/base.ts";
import type { SalaBase, SalaBaseStatic } from "./salas/base.ts";
import type { ArrowOrValue, MaybePromise } from "./types.ts";

export type AcoesCallbackResult = {
    [acao in AcaoValue]?: ArrowOrValue<typeof SalaBase & SalaBaseStatic | string | void>;
};

export type AcaoExtraPopulado = Omit<AcaoExtra, "item" | "entidade"> & {
    item?: ItemBase;
    entidade?: EntidadeBase;
};

export type ComponentCallback = (ctx: Contexto, extra?: AcaoExtraPopulado | null) => MaybePromise<boolean>;

// A ideia é juntar as ações, erro se sobrescrever a mesma.
export function mergeAcoes(target: AcoesCallbackResult, source: AcoesCallbackResult) {
    for(let [acao, fn] of Object.entries(source)) {
        if(target[acao as AcaoValue]) {
            throw new Error(`Ação ${acao} já existe no objeto.`);
        }
        target[acao as AcaoValue] = fn;
    }
    return target;
}

export abstract class ObjetoJogo {
    constructor() {
        const comps = this.componentes();
        for(let c of comps) {
            this.adicionarComponente(c);
        }
    }

    descricao(ctx: Contexto): MaybePromise<string | void> {
        return;
    }
    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): MaybePromise<AcoesCallbackResult> {
        return {};
    }
    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        const acoes: AcoesCallbackResult = {};

        for(let c of this._componentes.values()) {
            if(c.config?.estaAtivo && (await c.config.estaAtivo(ctx, extra) === false)) {
                continue;
            }
            mergeAcoes(acoes, await c.acoes(ctx, extra));
        }

        mergeAcoes(acoes, await this.acoes(ctx, extra));

        if(!acoes[Acao.$Descricao]) {
            acoes[Acao.$Descricao] = async () => await this.descricao(ctx);
        }

        return acoes;
    }

    private readonly _componentes: Map<string, ComponenteJogo<any>> = new Map();
    adicionarComponente<T extends ObjetoJogo, C extends ComponenteJogo<T>>(componente: C): void {
        this._componentes.set(componente.constructor.name, componente);
    }
    obterComponente<T extends ObjetoJogo, C extends ComponenteJogo<T>>(componente: {new(...args: any[]): C}): C {
        return this._componentes.get(componente.name) as C;
    }
    possuiComponente<T extends ObjetoJogo, C extends ComponenteJogo<T>>(componente: {new(...args: any[]): C}): boolean {
        return this._componentes.has(componente.name);
    }

    componentes(): ComponenteJogo<any>[] {
        return [];
    }

    estaVisivel(): boolean {
        return true;
    }

    filhosVisiveis(): boolean {
        return true;
    }

    obterFilhos(): ObjetoJogo[] {
        return [];
    }
}

export type ComponenteConfig = {
    estaAtivo?: ComponentCallback;
};
export abstract class ComponenteJogo<T extends ObjetoJogo> {
    objeto: T;
    constructor(objeto: T, public readonly config?: ComponenteConfig) {
        this.objeto = objeto;
    }

    abstract acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): MaybePromise<AcoesCallbackResult>;
}