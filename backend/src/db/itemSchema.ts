import { pgTable, uuid, varchar, jsonb, check, type AnyPgColumn, timestamp, integer, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tableEntidades } from './entidadeSchema.js';
import { tableSalas } from './salaSchema.js';
import { type Estado, type EstadoItem } from './estadoSchema.ts';

export const enumLocalTipo = pgEnum('local_tipo', [
    "ENTIDADE", "SALA", "CONTAINER"
]);

export const tableItens = pgTable('itens', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Que tipo de item é esse (ex: "espada", "pocao", "chave")
    tipo: varchar('tipo', { length: 100 }).notNull(),

    // Quantidade desse item (para itens empilháveis) Sempre >= 1
    quantidade: integer('quantidade').default(1).notNull(),
    // Quando é um item inicial (spawn) de uma sala. valor que será restaurado.
    quantidadeInicial: integer('quantidade_inicial'),
    
    localTipo: enumLocalTipo('local_tipo').notNull(),
    localId: uuid('local_id').notNull(),

    criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // Atributos dinâmicos: durabilidade, cargas, etc.
    // Ex: { "durabilidade": 82 }
    estado: jsonb('estado').$type<Estado>().default({}).notNull(),
},
    (table) => [
        // Garante que o item esteja em apenas EM UM LUGAR
        uniqueIndex("idx_unico_local")
            .on(table.tipo, table.localTipo, table.localId)
    ]
);

export type Item = typeof tableItens.$inferSelect;