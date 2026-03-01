// Database Client - Suporta SQLite local e Turso (libSQL)
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleLibSQL } from 'drizzle-orm/libsql';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se está em produção com Turso
const useTurso = !!process.env.TURSO_DATABASE_URL;

let db: any;

if (useTurso) {
    // Produção: Turso (libSQL)
    console.log('🔌 Conectando ao Turso (libSQL)...');
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = drizzleLibSQL(client, { schema });
} else {
    // Desenvolvimento: SQLite local
    console.log('🔌 Conectando ao SQLite local...');
    const sqlite = new Database('local.db');
    db = drizzle(sqlite, { schema });
}

export { db };
