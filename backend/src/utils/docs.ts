import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import swaggerJSDoc from "swagger-jsdoc";
import z from "zod";

// https://swagger.io/specification/
export type HTTPMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

export type ControllerSchema<Q extends z.ZodType, B extends z.ZodType, P extends z.ZodType, R extends z.ZodType> = {
    query?: Q;
    body?: B;
    params?: P;
    response?: R;
};

export type ParsedRequestUndef<Q, B, P> = {
    query: Q extends z.ZodType ? z.infer<Q> : undefined;
    body: B extends z.ZodType ? z.infer<B> : undefined;
    params: P extends z.ZodType ? z.infer<P> : undefined;
};

export type ParsedRequest<Q, B, P> = 
  (Q extends z.ZodType ? { query: z.infer<Q> } : {}) &
  (B extends z.ZodType ? { body: z.infer<B> } : {}) &
  (P extends z.ZodType ? { params: z.infer<P> } : {});

export interface DocOperation extends swaggerJSDoc.Operation {
    schema?: ControllerSchema<z.ZodType, z.ZodType, z.ZodType, z.ZodType> | undefined;
};

export interface DocPathItem extends swaggerJSDoc.PathItem {
    get?: DocOperation | undefined;
    put?: DocOperation | undefined;
    post?: DocOperation | undefined;
    delete?: DocOperation | undefined;
    options?: DocOperation | undefined;
    head?: DocOperation | undefined;
    patch?: DocOperation | undefined;
    trace?: DocOperation | undefined;
};

export interface DocPaths extends swaggerJSDoc.Paths {
    [key: string]: DocPathItem;
}

/**
 * Faz o parsing da requisição de acordo com o schema com query, body e params.
 */
export function parseRequest<Q extends z.ZodType, B extends z.ZodType, P extends z.ZodType, R extends z.ZodType>(schema: ControllerSchema<Q, B, P, R>, req: { query?: unknown, body?: unknown, params?: unknown }) {
    const r = {
        ...(schema.query ? { query: schema.query.parse(req.query) } : {}),
        ...(schema.body ? { body: schema.body.parse(req.body) } : {}),
        ...(schema.params ? { params: schema.params.parse(req.params) } : {}),
    };

    return r as ParsedRequest<Q,B,P>;
}

export function parseResponse<Q extends z.ZodType, B extends z.ZodType, P extends z.ZodType, R extends z.ZodType>(schema: ControllerSchema<Q, B, P, R>, data: unknown) {
    return (schema.response ? schema.response.parse(data) : undefined) as z.infer<R>;
}

export function generateDocs(registry: OpenAPIRegistry, route: string, method: HTTPMethod, _docs: DocOperation) {    
    const { schema, ...docs } = _docs;

    if(!docs.summary) docs.summary = `Rota  ${method} ${route}`;    
    if(!docs.description) docs.description = `Documentação da rota ${method} ${route}`;
    if(!docs.responses) docs.responses = {};
    if(!docs.responses[500]) {
        docs.responses[500] = {
            description: `Erro com código 500`,
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string()
                    })
                }
            }
        };
    }

    docs.responses[200] = {
        description: `Resposta de código 200`,
        ...(schema?.response ? {
            content: {
                "application/json": {
                    schema: schema?.response
                }
            }
        } : {})
    };
    
    registry.registerPath({
        method: method,
        path: route,
        summary: docs.summary,
        description: docs.description,
        tags: docs.tags,
        responses: docs.responses,
        request: {
            body: schema?.body ? {
                content: {
                    "application/json": {
                        schema: schema.body
                    }
                }
            } : undefined,
            params: schema?.params ? schema.params as any : undefined,
            query: schema?.query ? schema.query as any : undefined,
        }
    });
};

export function registerDocPaths (registry: OpenAPIRegistry, paths: DocPaths) {
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, details] of Object.entries(methods)) {
            if(!details) continue;
            generateDocs(registry, path, method as HTTPMethod, details);
        }
    }
}
