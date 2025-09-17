import { and, eq, gte, sql } from "drizzle-orm";
import { type Item, tableItens } from "../db/itemSchema.ts";
import { type DatabaseType } from "../db/drizzle.ts";
import type { Estado } from "../db/estadoSchema.ts";

export class ItemRepository {
    static async naMochila(db: DatabaseType, entidadeId: string): Promise<Item[]> {
        const itens = await db.select()
            .from(tableItens)
            .where(and(
                eq(tableItens.localTipo, "ENTIDADE"), 
                eq(tableItens.localId, entidadeId),
                gte(tableItens.quantidade, 1)
            ));
        return itens;
    }

    static async noChao(db: DatabaseType, salaId: string): Promise<Item[]> {
        const itens = await db.select()
            .from(tableItens)
            .where(and(
                eq(tableItens.localTipo, "SALA"), 
                eq(tableItens.localId, salaId),
                gte(tableItens.quantidade, 1)
            ));
        return itens;
    }

    static async moverItem(db: DatabaseType, itemId: string, quantidade: number, localTipo: "ENTIDADE" | "SALA" | "CONTAINER", localId: string) {
        return await db.transaction(async (tx: any) => {
            // 1. Retira o item de onde ele está agora (Não tem problema deixar 0 itens)
            const itemAtual = await this.removerItem(tx, itemId, quantidade);

            // 2. Tenta inserir o item no destino com onConflictUpdate
            return await this.adicionarItem(tx, {
                tipo: itemAtual.tipo,
                quantidade: quantidade,
                localTipo: localTipo,
                localId: localId,
                estado: itemAtual.estado,
                criadoEm: itemAtual.criadoEm
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
        tipo: string,
        estado?: Estado,
        criadoEm?: Date,
        quantidade: number,
        localTipo: "ENTIDADE" | "SALA" | "CONTAINER", 
        localId: string
    }) {
        const [result] = await db.insert(tableItens).values({
            tipo: itemAtual.tipo,
            quantidade: itemAtual.quantidade,
            localTipo: itemAtual.localTipo,
            localId: itemAtual.localId,
            estado: itemAtual.estado,
            criadoEm: sql<Date>`NOW()`,
            atualizadoEm: sql<Date>`NOW()`,
        }).onConflictDoUpdate({
            target: [tableItens.tipo, tableItens.localTipo, tableItens.localId],
            set: {
                quantidade: sql<number>`(${tableItens.quantidade} + ${itemAtual.quantidade})`,
                atualizadoEm: sql<Date>`NOW()`
            }
        }).returning();

        return result;
    }
}