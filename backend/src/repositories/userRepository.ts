import { eq, sql } from "drizzle-orm";
import type { DatabaseType } from "../db/drizzle.ts";
import { tableUsers, type User } from "../db/userSchema.ts";
import { tableEntidades } from "../db/entidadeSchema.ts";
import { tableSalas } from "../db/salaSchema.ts";

export class UserRepository {
    static async buscarUsername(db: DatabaseType, username: string) {
        const result = await db.select()
            .from(tableUsers)
            .where(eq(tableUsers.username, username))
            .limit(1);

        return result.length >= 0 ? result[0] : null;
    }

    static async cadastrarUsuario(db: DatabaseType, dados: { username: string, passwordHash: string }) {
        const result = await db.transaction(async (tx) => {
            const resultUser = await tx.insert(tableUsers).values({
                username: dados.username,
                passwordHash: dados.passwordHash
            }).returning();

            const [salaInicial] = await tx.select()
                .from(tableSalas)
                .where(eq(tableSalas.nome, "Inicio"));

            const resultEntity = await tx.insert(tableEntidades).values({
                username: dados.username,
                categoria: "JOGADOR",
                tipo: "JOGADOR",
                salaId: salaInicial.id,
                estado: { vivo: 1 },
                criadoEm: sql<Date>`NOW()`,
                atualizadoEm: sql<Date>`NOW()`,
            }).returning();

            return {
                user: resultUser[0],
                entidade: resultEntity[0]
            };
        });

        return result;
    }
}