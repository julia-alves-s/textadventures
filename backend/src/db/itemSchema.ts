import { pgTable, uuid, varchar, jsonb, check, type AnyPgColumn, timestamp, integer, uniqueIndex, pgEnum, char, index } from 'drizzle-orm/pg-core';
import { type Estado, type EstadoItem } from './estadoSchema.ts';
import { getTupleFromKeys, UUID_ZERO } from './utils.ts';
import { relations } from 'drizzle-orm';
import { tableEntidades } from './entidadeSchema.ts';
import { tableSalas } from './salaSchema.ts';
import { itens } from '../jogo/config.ts';

export const enumItemNome = pgEnum('item_nome', getTupleFromKeys(itens));

export const tableLocais = pgTable('locais', {
    id: uuid('id').primaryKey().defaultRandom(),
});

export const tableItens = pgTable('itens', {
    // Referência para o local para itens associado a esta item (para agir como container), criado pela trigger criar_local_automatico.
    id: uuid('id').primaryKey().references(() => tableLocais.id, { onDelete: 'restrict' }).$defaultFn(() => UUID_ZERO),

    // Que item é esse (ex: "espada", "pocao", "chave")
    nome: enumItemNome('nome').notNull(),

    // ID da pilha, calculado a partir do estado
    // Ex: "pedra", "espada-999", "pocao-12345"
    pilhaId: varchar('pilha_id', { length: 255 }).notNull(),

    // Quantidade desse item (para itens empilháveis) Sempre >= 1
    quantidade: integer('quantidade').default(1).notNull(),
    // Quando é um item inicial (spawn) de uma sala. valor que será restaurado.
    quantidadeInicial: integer('quantidade_inicial'),
    
    // Onde o item está atualmente
    ondeId: uuid('onde_id').references(() => tableLocais.id, { onDelete: 'restrict' }).notNull(),

    criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // Atributos dinâmicos: durabilidade, cargas, etc.
    // Ex: { "durabilidade": 82 }
    estado: jsonb('estado').$type<Estado>().default({}).notNull(),
},
    (table) => [
        // Garante que não vai duplicar pilhas de itens no mesmo local
        uniqueIndex("idx_unico_pilha_onde")
            .on(table.pilhaId, table.ondeId),
            
        index("idx_item_onde").on(table.ondeId),
    ]
);

export const itemEntidadeRelation = relations(tableItens, ({ one }) => ({
    entidade: one(tableEntidades, {
        fields: [tableItens.ondeId],
        references: [tableEntidades.id],
    }),
    sala: one(tableSalas, {
        fields: [tableItens.ondeId],
        references: [tableSalas.id],
    }),
}));

export type Item = typeof tableItens.$inferSelect;