import { eq } from "drizzle-orm";
import { Item, tableItens } from "../db/itemSchema.ts";
import { RepositoryBase } from "./repositoryBase.ts";

class ItemRepository extends RepositoryBase {
    async naMochila(entidadeId: string): Promise<Item[]> {
        const itens = await this.db.select()
            .from(tableItens)
            .where(eq(tableItens.entidadeId, entidadeId));
        return itens;
    }

    async noChao(salaId: string): Promise<Item[]> {
        const itens = await this.db.select()
            .from(tableItens)
            .where(eq(tableItens.salaId, salaId));
        return itens;
    }

    async moverItem(itemId: string, onde: { entidadeId?: string } | { salaId?: string } | { itemContainerId?: string }) {
        await this.db.update(tableItens)
        .set({ 
            entidadeId: "entidadeId" in onde && onde.entidadeId || null,
            salaId: "salaId" in onde && onde.salaId || null,
            itemContainerId: "itemContainerId" in onde && onde.itemContainerId || null,
            atualizadoEm: new Date() 
        })
        .where(eq(tableItens.id, itemId));
    }
}

export const itemRepository = new ItemRepository();