import { pgTable, varchar, jsonb, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { type Estado, type EstadoItem } from './estadoSchema.ts';
import { getTupleFromKeys, UUID_ZERO } from './utils.ts';
import { tableItens, tableLocais } from './itemSchema.ts';
import { relations } from 'drizzle-orm';
import { tableEntidades } from './entidadeSchema.ts';
import { salas } from '../jogo/config.ts';

export const enumSalaNome = pgEnum('sala_nome', getTupleFromKeys(salas));

export const tableSalas = pgTable('salas', {
    // Referência para o local para itens associado a esta sala, criado pela trigger criar_local_automatico.
    id: uuid('id').primaryKey().references(() => tableLocais.id, { onDelete: 'restrict' }).$defaultFn(() => UUID_ZERO),

    // ID da sala que corresponde ao seu código (ex: "Inicio")
    nome: enumSalaNome('nome').unique().notNull(),
    
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // JSONB para armazenar estados mutáveis da sala
    // Ex: { "porta_trancada": true, "alavanca_puxada": false }
    estado: jsonb('estado').$type<Estado>().default({}).notNull(),
});

export const salaItemRelation = relations(tableSalas, ({ many }) => ({
    itens: many(tableItens),
    entidades: many(tableEntidades)
}));

export type Sala = typeof tableSalas.$inferSelect;