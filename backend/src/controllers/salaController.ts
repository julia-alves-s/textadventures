import { type RequestHandler } from "express";
import { salaDocs } from "../docs/salaDocs.ts";
import { ControllerBase } from "./ControllerBase.ts";
import { execArrowOrValue } from "../jogo/types.ts";
import type { SalaBase, AcaoExtraPopulado, SalaBaseStatic } from "../jogo/salas/base.ts";

export class SalaController extends ControllerBase {
    static descreverSalaAtual: RequestHandler = async (req, res) => {
        const { ctx, params } = await this.loadRequest(salaDocs["/sala/{salaId}/olhar"].get.schema, req, res);
        if(!ctx) return;

        await this.sendResponse(ctx, req, res);
    }

    static executarAcao: RequestHandler = async (req, res) => {
        const { ctx, body, params } = await this.loadRequest(salaDocs["/sala/{salaId}/{acao}"].post.schema, req, res);
        if(!ctx) return;

        const sala = ctx.sala;

        const { item, entidade, ..._extra} = body || {};
        const extra: AcaoExtraPopulado = _extra;
        if(item) {
            extra.item = ctx.getItemVisivel(item) || undefined;
        }
        if(entidade) {
            extra.entidade = ctx.getEntidadeVisivel(entidade) || undefined;
        }

        const acoes = await sala._acoes(ctx, extra ?? null);
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