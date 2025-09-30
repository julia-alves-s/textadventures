import { type RequestHandler } from "express";
import { itemDocs } from "../docs/itemDocs.ts";
import { ControllerBase } from "./ControllerBase.ts";
import { execArrowOrValue } from "../jogo/types.ts";
import type { SalaBase, SalaBaseStatic } from "../jogo/salas/base.ts";
import type { AcaoExtraPopulado } from "../jogo/objetoJogo.ts";

export class ItemController extends ControllerBase {
    static acaoItem: RequestHandler = async (req, res) => {
        const { ctx, body, params } = await this.loadRequest(itemDocs["/sala/{salaId}/item/{id}/{acao}"].post.schema, req, res);
        if(!ctx) return;
        
        const itemId = params.id;

        const achouObjeto = ctx.getItemVisivel(itemId);
        
        if(!achouObjeto) {
            ctx.escrevaln("Não tem isso aqui.");
            await this.sendResponse(ctx, req, res);
            return;
        }

        const { item, entidade, ..._extra} = body || {};
        const extra: AcaoExtraPopulado = _extra;
        if(item) {
            extra.item = ctx.getItemVisivel(item) || undefined;
        }
        if(entidade) {
            extra.entidade = ctx.getEntidadeVisivel(entidade) || undefined;
        }

        const acoes = await achouObjeto._acoes(ctx, extra ?? null);
        if(!(params.acao in acoes) || params.acao.startsWith("$")) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const result = await execArrowOrValue(acoes[params.acao]);
            if(result) {
                if(typeof result !== "string") {
                    await ctx.moverParaSala(result as typeof SalaBase & SalaBaseStatic);
                } else {
                    ctx.escrevaln(result);
                }
            }
        }

        await this.sendResponse(ctx, req, res);
    }
}