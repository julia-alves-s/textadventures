import { PgDatabase, PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core";
import { db as databaseConnection } from "../config/drizzle.ts";

export type DatabaseType = typeof databaseConnection;
export type TransactionType<T extends PgDatabase<any,any,any>> = T extends PgDatabase<infer U,infer K,infer P> ? PgTransaction<U,K,P> : never;
export type TransactionCallback<T> = (tx: TransactionType<DatabaseType>) => Promise<T>;

export abstract class RepositoryBase {
    protected readonly db: DatabaseType;

    constructor(db: DatabaseType = databaseConnection) {
        this.db = db;
    }

    /**
     * Retorna uma nova instância do repositório vinculada a uma transação.
     * 
     * @param tx A transação que será vinculada ao repositório
     */
    public bindTransaction(tx: TransactionType<DatabaseType>) {
        type _this = typeof this;
        const constructor = this.constructor as { new(db: TransactionType<DatabaseType>): _this };
        return new constructor(tx);
    }

    /**
     * Utilizado para ser possível realizar transações envolvendo múltiplos repositórios.
     * 
     * IMPORTANTE: você deve instanciar novos repositórios passando tx como parâmetro.
     * Exemplo:
     * ```ts
     * return await RepositoryBase.transaction(async (tx) => {
     *  const txUserRepo = userRepo.bindTransaction(tx);
     *  
     *  // operações com userRepo
     * 
     *  return resultado;
     * });
     * ```
     * 
     * @param asyncCallback Uma função assíncrona que irá receber a transação (tx) como parâmetro. (Crie novos repositories usando *tx* como parâmetro)
     * @returns O resultado da função assíncrona
     * 
     * @see {@link https://orm.drizzle.team/docs/transactions Transactions - Drizzle ORM}
     */
    static async transaction<T>(asyncCallback: TransactionCallback<T>, config?: PgTransactionConfig) {
        return await databaseConnection.transaction(async (tx) => {
            return await asyncCallback(tx);
            // NÃO PODE TER CATCH, tx.rollback() lança uma exceção que é capturada pelo próprio drizzle
        }, config);
    }
}
