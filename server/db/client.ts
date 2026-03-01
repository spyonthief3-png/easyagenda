// Database Client - Suporta SQLite local e Turso (libSQL)
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Verifica se está em produção com Turso
const useTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

console.log('🔌 DB Config:', { useTurso, hasUrl: !!process.env.TURSO_DATABASE_URL, hasToken: !!process.env.TURSO_AUTH_TOKEN });

let db: any;

if (useTurso) {
    // Produção: Turso (libSQL)
    console.log('🔌 Conectando ao Turso...');
    const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
    });
    
    // Usar raw client para queries
    db = client;
} else {
    // Desenvolvimento: SQLite local
    console.log('🔌 Conectando ao SQLite local...');
    db = new Database('local.db');
}

export { db };
