import { type RequestHandler } from "express";
import { salaDocs } from "../docs/salaDocs.ts";
import { getSalaConfig, type SalaNome } from "../jogo/config.ts";
import { ControllerBase } from "./ControllerBase.ts";

export class SalaController extends ControllerBase {
    static descreverSalaAtual: RequestHandler = async (req, res) => {
        const { ctx } = await this.loadRequest(salaDocs["/sala/olhar"].get.schema, req, res);

        await this.sendResponse(ctx, req, res);
    }

    static moverParaDirecao: RequestHandler<{ direcao: string }> = async (req, res) => {
        const { ctx, body } = await this.loadRequest(salaDocs["/sala/mover"].post.schema, req, res);

        const salaConfig = getSalaConfig((await ctx.getSala()).nome as SalaNome);
        const conexao = body.direcao in salaConfig.conexoes && salaConfig.conexoes[body.direcao];
        if(!conexao) {
            ctx.escrevaln("Você não pode fazer isso.");
        } else {
            const novaSalaNome = await conexao(ctx);
            if(novaSalaNome) {
                await ctx.moverParaSala(novaSalaNome);
            }
        }

        await this.sendResponse(ctx, req, res);
    }
}