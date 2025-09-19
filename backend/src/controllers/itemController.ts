import { type RequestHandler } from "express";
import { itemDocs } from "../docs/itemDocs.ts";
import { ControllerBase } from "./ControllerBase.ts";
import { execCallbackOrValue, getItemConfig } from "../jogo/config.ts";

export class ItemController extends ControllerBase {
    static acaoItem: RequestHandler = async (req, res) => {
        const { ctx, body } = await this.loadRequest(itemDocs["/item/acao"].post.schema, req, res);

        const mochila = await ctx.getMochila();
        let achouObjeto = mochila.find(o => o.id === body.item);
        if(!achouObjeto) {
            const objetosChao = await ctx.getItensNoChao();
            achouObjeto = objetosChao.find(o => o.id === body.item);
        }
        if(!achouObjeto) {
            ctx.escrevaln("Não tem isso aqui.");
            await this.sendResponse(ctx, req, res);
            return;
        }

        const itemConfig = getItemConfig(achouObjeto.nome);
        const acoes = await execCallbackOrValue(itemConfig.acoes ?? {}, ctx, achouObjeto, body.extra ?? null);
        if(!(body.acao in acoes)) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const resultado = await execCallbackOrValue(acoes[body.acao], ctx, achouObjeto, body.extra ?? null);
            if(resultado) {
                ctx.escrevaln(resultado);
            }
        }

        await this.sendResponse(ctx, req, res);
    }

    static pegarItem: RequestHandler = async (req, res) => {
        const { ctx, body } = await this.loadRequest(itemDocs["/item/pegar"].post.schema, req, res);

        let objetos = await ctx.getItensNoChao();
        if (objetos.length == 0) {
            ctx.escrevaln("Não tem nada para pegar.");
        } else {
            const objeto = objetos.find(o => o.id === body.item);
            if (!objeto) {
                ctx.escrevaln("Não tem isso aqui.");
            } else {
                await ctx.moverItem(objeto, { quantidade: body.quantidade, ondeId: ctx.jogador.id });
            }
        }

        await this.sendResponse(ctx, req, res);
    }

    static largarItem: RequestHandler = async (req, res) => {
        const { ctx, body } = await this.loadRequest(itemDocs["/item/largar"].post.schema, req, res);

        let objetos = await ctx.getMochila();
        if (objetos.length == 0) {
            ctx.escrevaln("Não tem nada na mochila.");
        } else {
            const objeto = objetos.find(o => o.id === body.item);
            if (!objeto) {
                ctx.escrevaln("Não tem isso na mochila.");
            } else {
                await ctx.moverItem(objeto, { quantidade: body.quantidade, ondeId: (await ctx.getSala()).id });
            }
        }

        await this.sendResponse(ctx, req, res);
    }
}