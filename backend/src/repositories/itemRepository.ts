import { and, eq, gte, sql } from "drizzle-orm";
import { type Item, tableItens } from "../db/itemSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import type { Estado } from "../db/estadoSchema.ts";
import type { ItemTipo } from "../jogo/config.ts";

export class ItemRepository {
    static async listarPorLocal(db: DatabaseType, localId: string): Promise<Item[]> {
        const itens = await db.select()
            .from(tableItens)
            .where(and(
                eq(tableItens.ondeId, localId),
                gte(tableItens.quantidade, 1)
            ));
        return itens;
    }

    static async moverItem(db: DatabaseType, itemId: string, diff: {
        quantidade: number, 
        ondeId?: string, 
        pilhaId?: string, 
        estado?: Estado
    }) {
        return await db.transaction(async (tx: any) => {
            // 1. Retira o item de onde ele está agora (Não tem problema deixar 0 itens)
            const itemAtual = await this.removerItem(tx, itemId, diff.quantidade);

            // 2. Tenta inserir o item no destino com onConflictUpdate
            return await this.adicionarItem(tx, {
                nome: itemAtual.nome,
                quantidade: diff.quantidade,
                criadoEm: itemAtual.criadoEm,
                ondeId: diff.ondeId ? diff.ondeId : itemAtual.ondeId,
                pilhaId: diff.pilhaId ? diff.pilhaId : itemAtual.pilhaId,
                estado: diff.estado ? diff.estado : itemAtual.estado,
            });
        });
    }

    static async removerItem(db: DatabaseType, itemId: string, quantidade: number) {
        const [itemAtual] = await db.update(tableItens).set({
            quantidade: sql<number>`(${tableItens.quantidade} - ${quantidade})`,
            atualizadoEm: sql<Date>`NOW()`
        }).where(and(eq(tableItens.id, itemId), gte(tableItens.quantidade, quantidade)))
        .returning();

        if(!itemAtual) {
            throw new Error("Item não existe ou não pode pegar tudo isso!");
        }
        return itemAtual;
    }

    static async adicionarItem(db: DatabaseType, itemAtual: {
        nome: ItemTipo,
        pilhaId: string,
        estado?: Estado,
        criadoEm?: Date,
        quantidade: number,
        ondeId: string
    }) {
        const [result] = await db.insert(tableItens).values({
            nome: itemAtual.nome,
            pilhaId: itemAtual.pilhaId,
            quantidade: itemAtual.quantidade,
            ondeId: itemAtual.ondeId,
            estado: itemAtual.estado,
            criadoEm: sql<Date>`NOW()`,
            atualizadoEm: sql<Date>`NOW()`,
        }).onConflictDoUpdate({
            target: [tableItens.pilhaId, tableItens.ondeId],
            set: {
                quantidade: sql<number>`(${tableItens.quantidade} + ${itemAtual.quantidade})`,
                atualizadoEm: sql<Date>`NOW()`
            }
        }).returning();

        return result;
    }
}