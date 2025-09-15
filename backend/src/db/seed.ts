import "dotenv/config";
import { randomUUID } from "crypto";
import { db } from "../config/drizzle.ts";
import { tableSalas } from "./salaSchema.ts";
import { tableUsers } from "./userSchema.ts";
import { tableEntidades } from "./entidadeSchema.ts";
import { tableItens } from "./itemSchema.ts";
import { salas } from "../jogo/salas/salas.ts";

// Assume que acabou de dar drizzle kit push, então as tabelas estão criadas mas vazias
try {
    await db.insert(tableSalas).values(Object.entries(salas).map(([salaId, sala]) => ({
        id: salaId,
        estado: sala.estadoInicial || {}
    })));

    const [jogador] = await db.insert(tableUsers).values([
        { id: randomUUID(), username: "jogador", createdAt: new Date() },
    ]).returning();

    const [jogadorEntidade] = await db.insert(tableEntidades).values([
        {
            id: randomUUID(),
            categoria: "JOGADOR",
            tipo: "JOGADOR",
            salaId: "Inicio",
            usuarioId: jogador.id,
            estado: {"vivo": 1}
        },
    ]).returning();
    
    const [pedra] = await db.insert(tableItens).values([
        {
            id: randomUUID(),
            tipo: "pedra",
            quantidade: 1,
            salaId: "Inicio",
            estado: {}
        },
    ]).returning();

    console.log("Seed inicial criado!");

} catch (error) {
    console.error("Erro:", error);
} finally {
    await db.$client.end();
}