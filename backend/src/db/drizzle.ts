// https://supabase.com/docs/guides/database/drizzle
// https://orm.drizzle.team/docs/get-started/supabase-existing
// Parece que supabase prefere o uso do "postgres" em vez do "pg"
import "dotenv/config";
import { sql } from "drizzle-orm";
import { PgDatabase, PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) { throw new Error("POSTGRES_URL is not set in environment variables"); }

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle({
    client,
    schema: schema,
    // logger: process.env.DEBUGLOG === "true" ? true : false,
});

// await db.execute(sql`SET TIME ZONE 'UTC';`).then(() => {
//     console.log("Database connected and timezone set to UTC");
// });

export type DatabaseType = typeof db;
export type TransactionType<T extends PgDatabase<any,any,any>> = T extends PgDatabase<infer U,infer K,infer P> ? PgTransaction<U,K,P> : never;
export type TransactionCallback<T> = (tx: TransactionType<DatabaseType>) => Promise<T>;