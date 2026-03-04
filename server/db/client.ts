// Database Client - Suporta SQLite local e Turso (libSQL) com Drizzle
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Verifica se está em produção com Turso
const useTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

console.log('🔌 DB Config:', { 
    useTurso, 
    hasUrl: !!process.env.TURSO_DATABASE_URL, 
    hasToken: !!process.env.TURSO_AUTH_TOKEN, 
    nodeEnv: process.env.NODE_ENV
});

// Inicializa o db conforme o ambiente
let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
    if (dbInstance) return dbInstance;
    
    if (useTurso) {
        // Produção: Turso (libSQL)
        console.log('🔌 Conectando ao Turso...');
        const client = createClient({
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN,
        });
        
        // @ts-ignore - tipos do drizzle não reconhecem libsql diretamente
        dbInstance = drizzle(client, { schema });
    } else {
        // Desenvolvimento: SQLite local
        console.log('🔌 Conectando ao SQLite local...');
        const sqlite = new Database('local.db');
        dbInstance = drizzle(sqlite, { schema });
    }
    
    return dbInstance;
}

// Exporta db diretamente para compatibilidade com código existente
export const db = getDb();
