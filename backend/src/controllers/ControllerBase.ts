import type { Request, Response } from "express";
import { Contexto } from "../jogo/contexto.ts";
import type { User } from "../db/userSchema.ts";
import { parseRequest, type ControllerSchema, type ParsedRequest, type ParsedRequestUndef } from "../utils/docs.ts";
import { itemDocs } from "../docs/itemDocs.ts";
import type z from "zod";

export class ControllerBase {
    static async loadRequest<Q extends z.ZodType, B extends z.ZodType, P extends z.ZodType, R extends z.ZodType>(
        schema: ControllerSchema<Q,B,P,R>, 
        req: Request, res: Response
    ): Promise<{
        ctx: Contexto, 
        query: ParsedRequestUndef<Q,B,P>["query"],
        body: ParsedRequestUndef<Q,B,P>["body"],
        params: ParsedRequestUndef<Q,B,P>["params"]
    }> {
        const usuario = req.session! as User;
        const parsed = parseRequest(schema, req) as any;

        const ctx = await Contexto.carregar(usuario.username);

        return {
            ctx,
            query: "query" in parsed && parsed.query ? parsed.query : undefined,
            body: "body" in parsed && parsed.body ? parsed.body : undefined,
            params: "params" in parsed && parsed.params ? parsed.params : undefined,
        };
    }

    static async sendResponse(ctx: Contexto, req: Request, res: Response) {
        const result = await ctx.retornarSituacao();
        await ctx.salvar();

        res.status(200).json(result);
    }
}