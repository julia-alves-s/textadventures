import { and, eq, gte, sql } from "drizzle-orm";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import { tableSalas } from "../db/salaSchema.ts";
import { JogoError, type Estado } from "../jogo/types.ts";
import { tableItens } from "../db/itemSchema.ts";

export class EntidadeRepository {
    static async atualizar(db: DatabaseType, entidadeId: string, dados: { ondeId?: string, estado?: Estado | null } ) {
        const result = await db.update(tableEntidades)
        .set({ 
            ondeId: dados.ondeId,
            estado: dados.estado && Object.keys(dados.estado).length === 0 ? null : dados.estado,
            atualizadoEm: sql<Date>`NOW()`,
        })
        .where(eq(tableEntidades.id, entidadeId))
        .returning();

        if(result.length === 0) throw new JogoError("Entidade foi deletada: "+entidadeId);
        return result[0];
    }

    static async deletar(db: DatabaseType, ondeId: string, entidadeId: string) {
        const result = await db.delete(tableEntidades)
        .where(and(eq(tableEntidades.id, entidadeId), eq(tableEntidades.ondeId, ondeId)))
        .returning();

        if(result.length === 0) throw new JogoError("Entidade não foi encontrada ou não estava onde esperado: "+entidadeId);
        return result[0];
    }

    static async moveParaSalaNome(db: DatabaseType, entidadeId: string, salaNome: string, estado?: Estado | null) {
        const result = await db.update(tableEntidades)
        .set({ 
            ondeId: tableSalas.id,
            atualizadoEm: sql<Date>`NOW()`,
            estado: estado && Object.keys(estado).length === 0 ? null : estado,
        })
        .from(tableSalas)
        .where(and(eq(tableEntidades.id, entidadeId), eq(tableSalas.nome, salaNome)))
        .returning({
            entidade: tableEntidades,
            sala: tableSalas
        });

        return result.length > 0 ? result[0] : null;
    }

    static async naSala(db: DatabaseType, ondeId: string) {
        return await db.query.tableEntidades.findMany({
            where: eq(tableEntidades.ondeId, ondeId),
            with: {
                mochila: {
                    where: gte(tableItens.quantidade, 1)
                }
            }
        });
    }
}