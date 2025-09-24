import { type RequestHandler } from "express";
import { ControllerBase } from "./ControllerBase.ts";
import { execArrowOrValue } from "../jogo/types.ts";
import { entidadeDocs } from "../docs/entidadeDocs.ts";
import type { AcaoExtraPopulado, SalaBase, SalaBaseStatic } from "../jogo/salas/base.ts";

export class EntidadeController extends ControllerBase {
    static acaoEntidade: RequestHandler = async (req, res) => {
        const { ctx, body, params } = await this.loadRequest(entidadeDocs["/sala/{salaId}/entidade/{id}/{acao}"].post.schema, req, res);
        if(!ctx) return;
        
        const entidadeId = params.id;
        
        const achouEntidade = ctx.getEntidadeVisivel(entidadeId);

        if(!achouEntidade) {
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

        //const acoes = await execCallbackOrValue(itemConfig.acoes ?? {}, ctx, achouObjeto, body.extra ?? null);
        const acoes = await achouEntidade._acoes(ctx, extra ?? null);
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