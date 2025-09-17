import "dotenv/config";
import { randomUUID } from "crypto";
import { db } from "./drizzle.ts";
import { type Sala, tableSalas } from "./salaSchema.ts";
import { tableUsers } from "./userSchema.ts";
import { tableEntidades } from "./entidadeSchema.ts";
import { type Item, tableItens } from "./itemSchema.ts";
import { salas } from "../jogo/salas/salas.ts";
import bcrypt from "bcryptjs";
import { and, eq, isNotNull, sql } from "drizzle-orm";

// Assume que acabou de dar drizzle kit push, então as tabelas estão criadas mas vazias
// OU, se já tiver dados, não insere duplicados
try {

    const insertSalas: typeof tableSalas.$inferInsert[] = [];
    const insertItens: typeof tableItens.$inferInsert[] = [];
    for(let [salaId, sala] of Object.entries(salas)) {
        const salaUUID = randomUUID();
        insertSalas.push({
            id: salaUUID,
            nome: salaId,
            estado: sala.estadoInicial || {}
        });
    }

    // Atualiza ou insere as salas iniciais
    const todasAsSalas = await db.insert(tableSalas)
        .values(insertSalas)
        .onConflictDoUpdate({
            target: tableSalas.nome,
            set: {
                estado: sql`EXCLUDED.estado`,
                atualizadoEm: sql`NOW()`,
            }
        }).returning({ id: tableSalas.id, nome: tableSalas.nome });

    for(let sala of todasAsSalas) {
        const configSala = salas[sala.nome as keyof typeof salas];
        if(!configSala) continue;

        if(configSala.itensIniciais) {
            for(let item of configSala.itensIniciais) {
                insertItens.push({
                    id: randomUUID(),
                    tipo: item.tipo,
                    quantidade: item.quantidade,
                    quantidadeInicial: item.quantidade,
                    localTipo: "SALA",
                    localId: sala.id,
                    estado: item.estadoInicial || {}
                });
            }
        }
    }

    // Deleta todos os itens que estão no chão das salas
    await db.delete(tableItens).where(eq(tableItens.localTipo, "SALA"));
    // Re-insere os itens iniciais no chão das salas
    await db.insert(tableItens).values(insertItens);
    
    console.log("Seed inicial criado!");

} catch (error) {
    console.error("Erro:", error);
} finally {
    await db.$client.end();
}