import { and, eq, sql } from "drizzle-orm";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import { tableSalas } from "../db/salaSchema.ts";
import type { SalaNome } from "../jogo/config.ts";

export class EntidadeRepository {
    static async atualizar(db: DatabaseType, entidadeId: string, dados: { salaId?: string, estado?: Estado } ) {
        await db.update(tableEntidades)
        .set({ 
            salaId: dados.salaId,
            estado: dados.estado,
            atualizadoEm: sql<Date>`NOW()`,
        })
        .where(eq(tableEntidades.id, entidadeId));
    }

    static async moveParaSalaNome(db: DatabaseType, entidadeId: string, salaNome: SalaNome) {
        const result = await db.update(tableEntidades)
        .set({ 
            salaId: tableSalas.id,
            atualizadoEm: sql<Date>`NOW()`,
        })
        .from(tableSalas)
        .where(and(eq(tableEntidades.id, entidadeId), eq(tableSalas.nome, salaNome)))
        .returning({
            entidade: tableEntidades,
            sala: tableSalas
        });

        return result.length > 0 ? result[0] : null;
    }

    static async naSala(db: DatabaseType, salaId: string) {
        const result = await db.select()
            .from(tableEntidades)
            .where(eq(tableEntidades.salaId, salaId));

        return result;
    }
}