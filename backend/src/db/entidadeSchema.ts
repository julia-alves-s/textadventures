import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { tableSalas } from './salaSchema.js';
import { tableUsers } from './userSchema.js';
import { type Estado, type EstadoItem } from './estadoSchema.ts';
import { tableItens, tableLocais } from './itemSchema.ts';
import { UUID_ZERO } from './utils.ts';
import { relations, sql } from 'drizzle-orm';

export const enumCategoriaEntidade = pgEnum('categoria_entidade', ['JOGADOR', 'NPC', 'OBJETO', 'CRIATURA']);

export const enumTipoEntidade = pgEnum('tipo_entidade', [
    // Tipos de Jogador
    'JOGADOR',

    // NPCs
    'GUARDA', 'MERCADOR', 'LADRAO',

    // Entidades-Objeto (Coisas não-vivas que interagem e/ou se movem)
    'ARVORE', 'PORTA', 'BAU',

    // Criaturas
    'GATO', 'LOBO'
]);

export const tableEntidades = pgTable('entidades', {
    // Referência para o local para itens associado a esta entidade, criado pela trigger criar_local_automatico.
    id: uuid('id').primaryKey().references(() => tableLocais.id, { onDelete: 'restrict' }).$defaultFn(() => UUID_ZERO),

    categoria: enumCategoriaEntidade('categoria').notNull(),
    tipo: enumTipoEntidade('tipo').notNull(),

    // Onde a entidade está atualmente no mundo
    salaId: uuid('sala_id').references(() => tableSalas.id).notNull(),

    // Se a entidade for um jogador, aqui está o link para sua conta
    username: varchar('username', { length: 50 }).references(() => tableUsers.username, { onDelete: 'restrict' }).unique(),

    criadoEm: timestamp('criado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { mode: 'date', withTimezone: true }).defaultNow().notNull(),

    // Atributos dinâmicos: vida, mana, status, etc.
    // Ex: { "vida": 85, "vida_max": 100, "status": ["envenenado"] }
    estado: jsonb('estado').$type<Estado>().default({}).notNull(),
}, 
    (table) => [
        index("idx_entidade_sala").on(table.salaId),        
    ]
);

export const entidadeSalaRelation = relations(tableEntidades, ({ one, many }) => ({
	sala: one(tableSalas, {
		fields: [tableEntidades.salaId],
		references: [tableSalas.id],
	}),
	mochila: many(tableItens)
}));

export type Entidade = typeof tableEntidades.$inferSelect;