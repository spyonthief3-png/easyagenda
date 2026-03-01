// Database Client - Suporta SQLite local e Turso (libSQL) com Drizzle
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se está em produção com Turso
const useTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

console.log('🔌 DB Config:', { useTurso, hasUrl: !!process.env.TURSO_DATABASE_URL, hasToken: !!process.env.TURSO_AUTH_TOKEN });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (useTurso) {
    // Produção: Turso (libSQL)
    console.log('🔌 Conectando ao Turso...');
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    // Usar Drizzle com libSQL client
    db = drizzle(client, { schema });
} else {
    // Desenvolvimento: SQLite local
    console.log('🔌 Conectando ao SQLite local...');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require('better-sqlite3');
    const sqlite = new Database('local.db');
    db = drizzle(sqlite, { schema });
}

export { db };
