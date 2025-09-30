import type { Item } from "../../db/itemSchema.ts";
import { Vendedor } from "../componentes/componentes.ts";
import type { Contexto } from "../contexto.ts";
import { EntidadeBase } from "../entidades/base.ts";
import { ObjetoJogo, type AcaoExtraPopulado, type AcoesCallbackResult } from "../objetoJogo.ts";
import { SalaBase } from "../salas/base.ts";
import type { Estado, MaybePromise } from "../types.ts";

export interface ItemBaseStatic {
    nome: string;
    estadoInicial?: () => Estado;
}

export abstract class ItemBase extends ObjetoJogo {
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
            if(this.onde.possuiComponente(Vendedor)) {
                const vendedor = this.onde.obterComponente(Vendedor);
                if(!vendedor.config?.estaAtivo || (await vendedor.config.estaAtivo(ctx, extra) === true)) {
                    acoes["COMPRAR"] = async () => {
                        return await vendedor.comprar(ctx, { item: this, quantidade: extra?.quantidade });
                    };
                    acoes["VENDER"] = async () => {
                        return await vendedor.vender(ctx, { item: this, quantidade: extra?.quantidade });
                    };
                }
            } else {
                acoes["PEGAR"] = async () => {
                    await ctx.moverItem(this, { 
                        quantidade: extra?.quantidade || this.item.quantidade,
                        onde: ctx.jogador
                    });
                    return "Pegou.";
                };
            }
        }

        return {
            ...acoes,
            ...(await super._acoes(ctx, extra)),
        };
    }

    item: Item;
    onde: SalaBase | EntidadeBase;
    constructor(info: {item: Item, onde: SalaBase | EntidadeBase}) {
        super();
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

    obterPreco() {
        return 0;
    }
}