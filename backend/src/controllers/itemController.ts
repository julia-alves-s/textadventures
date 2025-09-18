import { type RequestHandler } from "express";
import { itemDocs } from "../docs/itemDocs.ts";
import { ControllerBase } from "./ControllerBase.ts";

export class ItemController extends ControllerBase {
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