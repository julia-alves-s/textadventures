import { sql } from "drizzle-orm";
import type { DatabaseType } from "../drizzle.ts";

export class TriggerAplicarLocal {
    /**
    Sim, absolutamente! Sua intuição está perfeita. Usar um gatilho (trigger) é a solução ideal e mais elegante para automatizar a inserção na tabela locais, resolvendo completamente o problema da inserção em duas etapas.
    Você está transformando uma complexidade que estaria no seu código da aplicação em uma regra de negócio automatizada e segura dentro do próprio banco de dados.
    Como Funciona a Mágica: O Gatilho BEFORE INSERT
    
    A estratégia é criar um gatilho que é acionado antes de uma nova linha ser inserida em uma tabela "concreta" (como salas ou entidades). O processo é o seguinte:
    Seu código da aplicação tenta fazer um INSERT simples na tabela salas.
    O PostgreSQL intercepta essa tentativa e aciona o gatilho BEFORE INSERT.

    Dentro do gatilho:
    a. Ele primeiro insere uma nova linha na tabela locais.
    b. Ele captura o id recém-criado da tabela locais.
    c. Ele pega a linha que estava prestes a ser inserida na salas (representada pela variável NEW) e injeta o id do local no campo NEW.local_id.

    O gatilho termina e devolve a linha NEW (agora modificada) para o processo de inserção original.
    O INSERT na salas é concluído, agora com o local_id preenchido corretamente.

    Tudo isso acontece de forma atômica, dentro de uma única transação.
    */
    static async create(db: DatabaseType) {
        console.log(await db.execute(sql`
            CREATE OR REPLACE FUNCTION criar_local_automatico()
            RETURNS TRIGGER AS $$
            DECLARE
                novo_local_id UUID;
            BEGIN
                -- 1. Insere uma nova linha na tabela de locais e captura o ID gerado.
                INSERT INTO public.locais DEFAULT VALUES RETURNING id INTO novo_local_id;

                -- 2. Atribui o ID capturado à coluna 'local_id' da linha que está sendo inserida.
                --    (A variável NEW representa a linha que será inserida na tabela alvo, como 'salas' ou 'entidades')
                NEW.id := novo_local_id;

                -- 3. Retorna a linha modificada para que a operação de INSERT original possa continuar.
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `));


        // Aplicar a trigger em cada tabela.
        console.log(await db.execute(sql`
            CREATE OR REPLACE TRIGGER trigger_criar_local_para_sala
            BEFORE INSERT ON public.salas
            FOR EACH ROW EXECUTE FUNCTION criar_local_automatico();
        `));

        console.log(await db.execute(sql`
            CREATE OR REPLACE TRIGGER trigger_criar_local_para_entidade
            BEFORE INSERT ON public.entidades
            FOR EACH ROW EXECUTE FUNCTION criar_local_automatico();
        `));

        //Deixar para depois... tem que ver isso ainda (WHEN (NEW.pode_ser_container = TRUE))
        console.log(await db.execute(sql`
            CREATE OR REPLACE TRIGGER trigger_criar_local_para_item
            BEFORE INSERT ON public.itens
            FOR EACH ROW EXECUTE FUNCTION criar_local_automatico();
        `));
    }
}