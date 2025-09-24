import type { Item } from "../../db/itemSchema.ts";
import { Acao } from "../comandos/comandoConfig.ts";
import type { Contexto } from "../contexto.ts";
import { EntidadeBase } from "../entidades/base.ts";
import { SalaBase, type AcaoExtraPopulado, type AcoesCallbackResult } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";

export interface ItemBaseStatic {
    nome: string;
    estadoInicial?: () => Estado;
}

export abstract class ItemBase {    
    descricao(ctx: Contexto): MaybePromise<string | void> {
        return;
    }
    acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): MaybePromise<AcoesCallbackResult> {
        return {};
    }

    async _acoes(ctx: Contexto, extra?: AcaoExtraPopulado | null): Promise<AcoesCallbackResult> {
        const acoes: AcoesCallbackResult = {};

        if(this.estaNaMochila(ctx)) {
            acoes["LARGAR"] = async () => {
                await ctx.moverItem(this, { 
                    quantidade: extra?.quantidade || this.item.quantidade,
                    onde: ctx.sala
                });
                return "Largou.";
            };
        } else {
            acoes["PEGAR"] = async () => {
                await ctx.moverItem(this, { 
                    quantidade: extra?.quantidade || this.item.quantidade,
                    onde: ctx.jogador
                });
                return "Pegou.";
            };
        }

        return {
            [Acao.$Descricao]: async () => await this.descricao(ctx),
            ...acoes,
            ...(await this.acoes(ctx, extra))
        };
    }

    item: Item;
    onde: SalaBase | EntidadeBase;
    constructor(info: {item: Item, onde: SalaBase | EntidadeBase}) {
        this.item = info.item;
        this.onde = info.onde;
    }

    estaNaMochila(ctx: Contexto) {
        return this.onde instanceof EntidadeBase && this.onde.entidade.id === ctx.jogador.entidade.id;
    }

    temLuz(): boolean {
        if(this.item.estado?.luz === true) return true;
        else return false;
    }

    estaVisivel() {
        return true;
    }
}