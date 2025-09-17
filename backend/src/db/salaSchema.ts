import { pgTable, varchar, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { type Estado, type EstadoItem } from './estadoSchema.ts';

export const tableSalas = pgTable('salas', {
    id: uuid('id').primaryKey().defaultRandom(),
    // ID da sala que corresponde ao seu código (ex: "sala_do_trono")
    nome: varchar('nome', { length: 100 }).unique().notNull(),
    
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // JSONB para armazenar estados mutáveis da sala
    // Ex: { "porta_trancada": true, "alavanca_puxada": false }
    estado: jsonb('estado').$type<Estado>().default({}).notNull(),
});

export type Sala = typeof tableSalas.$inferSelect;