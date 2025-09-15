import { eq } from "drizzle-orm";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { Estado } from "../db/estadoSchema.ts";
import { RepositoryBase } from "./repositoryBase.ts";

class EntidadeRepository extends RepositoryBase {
    async atualizar(entidadeId: string, dados: { salaId?: string, estado?: Estado } ) {
        await this.db.update(tableEntidades)
        .set({ 
            salaId: dados.salaId,
            estado: dados.estado,
            atualizadoEm: new Date() 
        })
        .where(eq(tableEntidades.id, entidadeId));
    }
}

export const entidadeRepository = new EntidadeRepository();