-- https://github.com/citusdata/pg_cron

-- run as superuser:
CREATE EXTENSION pg_cron;

CREATE OR REPLACE PROCEDURE resetar_itens_chao()
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Restaura itens que são spawn (quantidade_inicial) para sua quantidade inicial
    UPDATE public.itens
    SET quantidade = quantidade_inicial, atualizado_em = NOW()
    WHERE quantidade_inicial IS NOT NULL AND quantidade <> quantidade_inicial AND atualizado_em < NOW() - INTERVAL '10 seconds';

    -- 2. Remove itens que estão no chão há mais de 5 minutos sem atualização, ou que zeraram sua quantidade
    DELETE FROM public.itens 
    WHERE (atualizado_em < NOW() - INTERVAL '10 seconds' AND local_tipo = 'SALA' AND quantidade_inicial IS NULL)
    OR (quantidade < 1);

    COMMIT;
END;
$$;

SELECT cron.schedule('limpeza-itens-chao', '*/5 * * * *', 'CALL resetar_itens_chao();');