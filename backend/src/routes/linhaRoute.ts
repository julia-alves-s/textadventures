import express from "express";
import { db } from "../config/drizzle.ts";
import { tableUsers } from "../db/userSchema.ts";
import { onLinha } from "../jogo/principal.ts";

export const getLinhaRouter = () => {
    const router = express.Router();
    
    router.post("/linha", async (req, res) => {
        const { texto } = req.body;

        if (typeof texto !== "string") {
            res.status(400).json({ error: "Comando inválido" });
            return;
        }

        // A FAZER: obter sessão do usuário.
        const userInfo = await db.select().from(tableUsers).limit(1);
        if(!userInfo || userInfo.length === 0 || !userInfo[0]) {
            res.status(401).json({ error: "Usuário não encontrado" });
            return;
        }

        const result = await onLinha(texto, userInfo[0]);

        res.json({ 
            resposta: result
        });
    });
    
    return router;
};