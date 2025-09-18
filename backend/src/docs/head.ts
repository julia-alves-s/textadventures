// When deploying swagger on vercel on nodejs it does not show UI #8461
// https://github.com/swagger-api/swagger-ui/issues/8461#issuecomment-2002404091

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi';
import { itemDocs } from './itemDocs.ts';
import { salaDocs } from './salaDocs.ts';
import { type ControllerSchema, type HTTPMethod, type ParsedRequest, type ParsedRequestUndef } from '../utils/docs.ts';
import z from 'zod';
import { authDocs } from './authDocs.ts';

// https://stackoverflow.com/questions/72133185/deploy-an-express-server-that-uses-express-static-to-serve-a-build-folder-to-ver

// https://github.com/vercel/ncc/issues/406

// https://github.com/scottie1984/swagger-ui-express/issues/114#issuecomment-2160925816

export const apiDocPaths = {
    ...salaDocs,
    ...itemDocs,
    ...authDocs,
};

const generateOpenAPIDocs = (registry: OpenAPIRegistry) => {
	const config = {
        openapi: "3.1.0",
        info: {
            title: "Text Adventures API",
            version: "1.0",
            description: "Embarque em uma jornada onde tudo é possível! Veja o código fonte do projeto em https://github.com/erickweil/textadventures/",
            contact: {
                name: "Erick Leonardo Weil",
                email: "erick.weil@ifro.edu.br",
            },
        },
        servers: [
            {
                url: process.env.DOCS_API_URL || "Necessário configurar URL",
            },
            {
                url: "http://127.0.0.1:"+(process.env.PORT || 3000),
            }
        ]
	};

    const openApiDocsJson = new OpenApiGeneratorV31(registry.definitions).generateDocument(config);

    return {
        swaggerDefinition: openApiDocsJson,
        apis: [], // Not used but required by swagger-jsdoc
    };
};

export default generateOpenAPIDocs;



// ===================================================
//                Mágica Typescript
// ===================================================
// Inferência de tipos para facilitar fazer o fetch
//
// A ideia é que você possa fazer o fetchApi passando o método, a rota e o request, 
// e o TypeScript vai inferir os tipos corretos para você.

// Pega um ControllerSchema de uma rota e método específicos
export type GetSchema<
  TPath extends keyof typeof apiDocPaths,
  TMethod extends keyof (typeof apiDocPaths)[TPath]
> = (typeof apiDocPaths)[TPath][TMethod] extends { schema: infer S } ? (S extends ControllerSchema<z.ZodType,z.ZodType,z.ZodType,z.ZodType> ? S : never) : never;

// Pega o schema de uma rota e método específicos, e retorna os tipos da requisição (query, body e params)
export type GetParsedRequest<
    TPath extends keyof typeof apiDocPaths,
    TMethod extends keyof (typeof apiDocPaths)[TPath]
> = GetSchema<TPath, TMethod> extends { query?: infer Q; body?: infer B; params?: infer P}
    ? 
    ParsedRequest<Q,B,P>
    : never;

// Pega o schema de uma rota e método específicos, e retorna os tipos da requisição (query, body e params)
export type GetParsedRequestUndef<
    TPath extends keyof typeof apiDocPaths,
    TMethod extends keyof (typeof apiDocPaths)[TPath]
> = GetSchema<TPath, TMethod> extends { query?: infer Q; body?: infer B; params?: infer P}
    ? 
    ParsedRequestUndef<Q,B,P>
    : never;

// Pega o schema de uma rota e método específicos, e retorna o tipo de resposta
export type GetSchemaResponse<
    TPath extends keyof typeof apiDocPaths,
    TMethod extends keyof (typeof apiDocPaths)[TPath]
> = GetSchema<TPath, TMethod> extends ControllerSchema<infer Q, infer B, infer P, infer R>
    ? (R extends z.ZodType ? z.infer<R> : undefined)
    : never;

export type TPathFromMethod<TPath extends keyof typeof apiDocPaths, T extends HTTPMethod> = 
TPath & {
    [K in TPath]: T extends keyof (typeof apiDocPaths)[K] ? K : never
}[TPath];