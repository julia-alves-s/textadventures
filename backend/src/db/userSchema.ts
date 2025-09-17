import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const tableUsers = pgTable('users', {
    username: varchar('username', { length: 50 }).primaryKey().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof tableUsers.$inferSelect;