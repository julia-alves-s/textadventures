import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { type Sala, tableSalas } from "../db/salaSchema.ts";
import { alias } from "drizzle-orm/pg-core";
import { type Entidade, tableEntidades } from "../db/entidadeSchema.ts";
import { type Estado } from "../db/estadoSchema.ts";
import { type Item, tableItens } from "../db/itemSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import { RevokeSessionError } from "../middlewares/authMiddleware.ts";
import { mapArrayWithTable } from "../db/utils.ts";

export class SalaRepository {
    static async dadosIniciaisJogador(db: DatabaseType, username: string) {
        const itensSubquery = db.select({
            salaId: tableItens.localId,
            sala_itens: sql`COALESCE(jsonb_agg(${tableItens}.*), '[]'::jsonb)`.mapWith(mapArrayWithTable(tableItens)).as("sala_itens"),
            })
            .from(tableItens)
            .where(and(eq(tableItens.localTipo, "SALA"), gte(tableItens.quantidade, 1)))
            .groupBy(tableItens.localId)
            .as("itens_sub");

        const mochilaSubquery = db.select({
            entidadeId: tableItens.localId,
            mochila_itens: sql`COALESCE(jsonb_agg(${tableItens}.*), '[]'::jsonb)`.mapWith(mapArrayWithTable(tableItens)).as("mochila_itens"),
            })
            .from(tableItens)
            .where(and(eq(tableItens.localTipo, "ENTIDADE"), gte(tableItens.quantidade, 1)))
            .groupBy(tableItens.localId)
            .as("mochila_sub");

        const entidadeSubquery = db.select({
            entidadeSalaId: tableEntidades.salaId,
            entidades: sql`COALESCE(jsonb_agg(${tableEntidades}.*), '[]'::jsonb)`.mapWith(mapArrayWithTable(tableEntidades)).as("entidades"),
            })
            .from(tableEntidades)
            .groupBy(tableEntidades.salaId)
            .as("entidade_sub");

        const aliasSalaGlobal = alias(tableSalas, "global");
        const result = await db.select({
                sala: tableSalas,
                entidade: tableEntidades,
                global: aliasSalaGlobal,
                itensNoChao: itensSubquery.sala_itens,
                mochila: mochilaSubquery.mochila_itens,
                entidadesNaSala: entidadeSubquery.entidades
            })
            .from(tableEntidades)
            .leftJoin(tableSalas, eq(tableEntidades.salaId, tableSalas.id))
            .leftJoin(aliasSalaGlobal, eq(aliasSalaGlobal.nome, "Global"))
            .leftJoin(itensSubquery, eq(itensSubquery.salaId, tableSalas.id))
            .leftJoin(mochilaSubquery, eq(mochilaSubquery.entidadeId, tableEntidades.id))
            .leftJoin(entidadeSubquery, eq(entidadeSubquery.entidadeSalaId, tableSalas.id))
            .where(eq(tableEntidades.username, username))
            .limit(1);
            
        if(!result || result.length === 0 || !result[0]) {
            throw new RevokeSessionError("Usuário não existe!");
        }
    
        const { entidade, sala, global, itensNoChao, mochila, entidadesNaSala } = result[0];
        if(!entidade || !sala) {
            throw new RevokeSessionError("Entidade em sala que não existe!");
        }

        return { 
            jogador: entidade, 
            sala: sala, 
            global: global!, 
            itensNoChao: itensNoChao || [],
            mochila: mochila || [],
            entidadesNaSala: entidadesNaSala || []
        };
    }

    static async getSalaById(db: DatabaseType, salaId: string): Promise<Sala | null> {
        const result = await db.select()
        .from(tableSalas)
        .where(eq(tableSalas.id, salaId))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    static async getSalaByNome(db: DatabaseType, sala: string): Promise<Sala | null> {
        const result = await db.select()
        .from(tableSalas)
        .where(eq(tableSalas.nome, sala))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    static async atualizar(db: DatabaseType, salaId: string, dados: { estado: Estado } ) {
        await db.update(tableSalas)
        .set({ 
            estado: dados.estado,
            atualizadoEm: sql<Date>`NOW()`, 
        })
        .where(eq(tableSalas.id, salaId));
    }
}