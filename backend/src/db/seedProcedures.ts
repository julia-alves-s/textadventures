import "dotenv/config";
import { db } from "./drizzle.ts";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { ProcedureResetarItensChao } from "./procedures/resetarItensChao.ts";
import { TriggerAplicarLocal } from "./procedures/triggerAplicarLocal.ts";

try {
    // https://supabase.com/blog/postgres-as-a-cron-server
    try {
        await TriggerAplicarLocal.create(db);

        await ProcedureResetarItensChao.create(db);
        // console.log(await ProcedureResetarItensChao.call(db));

        try {
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_cron`);

            //-- Agendar a execução da procedure a cada 5 minutos, 
            //-- Itens que estiverem no chão, a partir de 2 minutos podem ser resetados, sendo 7 minutos o tempo máximo
            // SELECT cron.schedule('limpeza-itens-chao', '*/5 * * * *', 'CALL resetar_itens_chao();');
            console.log(await db.execute(sql`SELECT cron.schedule('limpeza-itens-chao', '*/5 * * * *', 'SELECT resetar_itens_chao();')`));
        } catch (error) {
            console.error("Erro ao criar extensão pg_cron:", error);
        }
    } catch (error) {
        console.error("Erro ao criar extensão pg_cron ou procedure:", error);
    }
} catch (error) {
    console.error("Erro:", error);
} finally {
    await db.$client.end();
}