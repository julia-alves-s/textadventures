import { eq, sql } from "drizzle-orm";
import { Sala, tableSalas } from "../db/salaSchema.ts";
import { RepositoryBase } from "./repositoryBase.ts";
import { alias } from "drizzle-orm/pg-core";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { Estado } from "../db/estadoSchema.ts";
import { Item, tableItens } from "../db/itemSchema.ts";

class SalaRepository extends RepositoryBase {
    public async dadosIniciaisJogador(usuarioId: string) {
        const itensSubquery = this.db.select({
            salaId: tableItens.salaId,
            itens: sql<Item[]>`COALESCE(json_agg(${tableItens}.*), '{}')`.as("itens"),
            })
            .from(tableItens)
            .groupBy(tableItens.salaId)
            .as("itens_sub");

        const aliasSalaGlobal = alias(tableSalas, "global");
        const result = await this.db.select({
                sala: tableSalas,
                entidade: tableEntidades,
                global: aliasSalaGlobal,
                itensNoChao: itensSubquery.itens
            })
            .from(tableEntidades)
            .leftJoin(tableSalas, eq(tableEntidades.salaId, tableSalas.id))
            .leftJoin(aliasSalaGlobal, eq(aliasSalaGlobal.id, "Global"))
            .leftJoin(itensSubquery, eq(itensSubquery.salaId, tableSalas.id))
            .where(eq(tableEntidades.usuarioId, usuarioId))
            .limit(1);
    
        if(!result || result.length === 0 || !result[0]) {
            throw new Error("Usuário não existe!");
        }
    
        const { entidade, sala, global, itensNoChao } = result[0];
        if(!entidade || !sala) {
            throw new Error("Entidade em sala que não existe!");
        }

        return { entidade, sala, 
            global: global!, 
            itensNoChao: itensNoChao || []
        };
    }

    public async getSalaById(salaId: string): Promise<Sala | null> {
        const result = await this.db.select()
        .from(tableSalas)
        .where(eq(tableSalas.id, salaId))
        .limit(1);

        return result && result.length > 0 ? result[0] : null;
    }

    async atualizar(salaId: string, dados: { estado: Estado } ) {
        await this.db.update(tableSalas)
        .set({ 
            estado: dados.estado,
            atualizadoEm: new Date() 
        })
        .where(eq(tableSalas.id, salaId));
    }
}

export const salaRepository = new SalaRepository();