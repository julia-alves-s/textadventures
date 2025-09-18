// src/types/express/index.d.ts
// https://blog.logrocket.com/extend-express-request-object-typescript/
import { z } from "zod";
import { User } from "../../db/userSchema.ts";

// to make the file a module and avoid the TypeScript error
export { };

export type APILocals = {
    // authMiddleware, adiciona a sessão do usuário logado
    auth?: {
        user: User;
    };
}

declare global {
    namespace Express {
        export interface Locals extends APILocals {

        }
    }
}
