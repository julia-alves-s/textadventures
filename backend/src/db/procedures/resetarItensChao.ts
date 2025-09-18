//-- https://github.com/citusdata/pg_cron

import { sql } from "drizzle-orm";
import type { DatabaseType } from "../drizzle.ts";

export class ProcedureResetarItensChao {
    static async create(db: DatabaseType) {
        console.log(await db.execute(sql`
        CREATE OR REPLACE FUNCTION resetar_itens_chao()
        RETURNS INTEGER
        LANGUAGE plpgsql
        AS $$
        DECLARE 
            _result INTEGER;
        BEGIN
            -- 1. Restaura itens que são spawn (quantidade_inicial) para sua quantidade inicial
            UPDATE itens
            SET quantidade = quantidade_inicial, atualizado_em = NOW()
            WHERE quantidade_inicial IS NOT NULL AND quantidade <> quantidade_inicial AND atualizado_em < NOW() - INTERVAL '2 minutes';

            -- 2. Remove itens que estão no chão há mais de 2 minutos sem atualização, ou que zeraram sua quantidade
            DELETE FROM itens WHERE quantidade_inicial IS NULL AND (
                atualizado_em < NOW() - INTERVAL '2 minutes'
                AND id IN (
                    SELECT itens.id
                    FROM itens
                    INNER JOIN salas ON itens.onde_id = salas.id
                )
                OR quantidade < 1
            );

            GET DIAGNOSTICS _result = ROW_COUNT;

            RETURN _result;
        END;
        $$;
        `));
    }

    static async call(db: DatabaseType) {
        return await db.execute(sql`SELECT resetar_itens_chao();`);
    }
}