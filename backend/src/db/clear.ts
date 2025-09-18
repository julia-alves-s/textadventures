import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from './drizzle.ts';

try {
    console.log('Eliminando todas as tabelas do banco...');
    
    await db.execute(sql.raw(`DROP SCHEMA public CASCADE`));
    await db.execute(sql.raw(`CREATE SCHEMA public`));

    console.log('Limpeza concluída com sucesso!');
} catch (error: unknown) {
    console.error('Erro geral na limpeza:', error);
    process.exit(1);
} finally {
    await db.$client.end();
}
