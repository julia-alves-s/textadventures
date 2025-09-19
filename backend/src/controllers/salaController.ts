import { type RequestHandler } from "express";
import { salaDocs } from "../docs/salaDocs.ts";
import { execCallbackOrValue, getSalaConfig } from "../jogo/config.ts";
import { ControllerBase } from "./ControllerBase.ts";

export class SalaController extends ControllerBase {
    static descreverSalaAtual: RequestHandler = async (req, res) => {
        const { ctx } = await this.loadRequest(salaDocs["/sala/olhar"].get.schema, req, res);

        await this.sendResponse(ctx, req, res);
    }

    static moverParaDirecao: RequestHandler<{ direcao: string }> = async (req, res) => {
        const { ctx, body } = await this.loadRequest(salaDocs["/sala/mover"].post.schema, req, res);

        const sala = await ctx.getSala();
        const salaConfig = getSalaConfig(sala.nome);
        const conexoes = await execCallbackOrValue(salaConfig.conexoes, ctx, sala);
        if(!(body.direcao in conexoes)) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const novaSalaNome = await execCallbackOrValue(conexoes[body.direcao], ctx, sala);
            if(novaSalaNome) {
                await ctx.moverParaSala(novaSalaNome);
            }
        }

        await this.sendResponse(ctx, req, res);
    }
}