import type { Request, Response } from "express";
import type z from "zod";
import { Contexto } from "../jogo/contexto.ts";
import type { User } from "../db/userSchema.ts";
import { parseRequest, type ControllerSchema, type ParsedRequest, type ParsedRequestUndef } from "../utils/docs.ts";
import { SalaRepository } from "../repositories/salaRepository.ts";
import { db } from "../db/drizzle.ts";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";

export class ControllerBase {
    static async loadRequest<Q extends z.ZodType, B extends z.ZodType, P extends z.ZodType, R extends z.ZodType>(
        schema: ControllerSchema<Q,B,P,R>, 
        req: Request, res: Response
    ): Promise<{
        ctx: Contexto, 
        query: ParsedRequestUndef<Q,B,P>["query"],
        body: ParsedRequestUndef<Q,B,P>["body"],
        params: ParsedRequestUndef<Q,B,P>["params"]
    } | {
        ctx: undefined, 
        query: undefined,
        body: undefined,
        params: undefined
    }> {
        const usuario = req.session! as User;
        const parsed = parseRequest(schema, req) as any;

        const salaId = parsed.params?.salaId;
        if(!salaId) {
            throw new RevokeSessionError("ID da sala é obrigatório"); // Para parar a execução
        }

        const ctx = new Contexto(await Contexto.carregar(usuario.username, salaId));

        const parar = await ctx.executarAcoesAntes(parsed.body ?? null);
        if(parar) {
            await this.sendResponse(ctx, req, res);
            return {
                ctx: undefined,
                query: undefined,
                body: undefined,
                params: undefined
            };
        }

        return {
            ctx,
            query: "query" in parsed && parsed.query ? parsed.query : undefined,
            body: "body" in parsed && parsed.body ? parsed.body : undefined,
            params: "params" in parsed && parsed.params ? parsed.params : undefined,
        };
    }

    static async sendResponse(ctx: Contexto, req: Request, res: Response) {
        const result = await ctx.retornarSituacao();
        
        res.status(200).json(result);
    }
}