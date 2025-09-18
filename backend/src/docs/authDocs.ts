import z from "zod";
import type { DocPaths } from "../utils/docs.ts";
import { authUserSchema } from "./schemas.ts";

export const authDocs = {
    "/auth/cadastrar": {
        post: {
            summary: "Cadastra um novo usuário",
            description: "Cria um novo usuário com nome de usuário e senha. (Já irá logar o usuário)",
            schema: {
                body: z.object({
                    username: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_\-]+$/).min(3).max(50).meta({
                        description: "Nome de usuário do novo usuário",
                        example: "usuario123",
                    }),
                    password: z.string().min(8).max(255).meta({
                        description: "Senha do novo usuário",
                    }),
                }),
                response: authUserSchema
            }
        }
    },
    "/auth/login": {
        post: {
            summary: "Faz login de um usuário",
            description: "Autentica um usuário com nome de usuário e senha.",
            schema: {
                body: z.object({
                    username: z.string().min(3).max(255).meta({
                        description: "Nome de usuário do usuário",
                        example: "usuario123",
                    }),
                    password: z.string().min(8).max(255).meta({
                        description: "Senha do usuário",
                    }),
                }),
                response: authUserSchema
            }
        }
    },
    "/auth/logout": {
        post: {
            summary: "Faz logout do usuário atual",
            description: "Encerra a sessão do usuário atualmente autenticado.",
        }
    }
} satisfies DocPaths;