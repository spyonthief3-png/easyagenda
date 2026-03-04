import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './server/db/schema.js';
import bcrypt from 'bcryptjs';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client, { schema });

const passwordHash = await bcrypt.hash('password123', 10);

console.log('Seeding Turso DB...');

try {
  await db.insert(schema.users).values([
    { id: 'user-1', username: 'john.doe', name: 'John Doe', email: 'john@example.com', role: 'USER', photoUrl: 'https://i.pravatar.cc/150?u=user-1', isActive: true, passwordHash },
    { id: 'user-2', username: 'jane.admin', name: 'Jane Admin', email: 'jane@example.com', role: 'ADMIN', photoUrl: 'https://i.pravatar.cc/150?u=user-2', isActive: true, passwordHash },
    { id: 'user-3', username: 'mike.maintenance', name: 'Maintenance Mike', email: 'mike@example.com', role: 'MAINTENANCE', photoUrl: 'https://i.pravatar.cc/150?u=user-3', isActive: true, passwordHash },
  ]).onConflictDoNothing();
  console.log('Users inserted');
  
  await db.insert(schema.locations).values([
    { id: 'loc-1', name: 'BLOCO A' },
    { id: 'loc-2', name: 'BLOCO B' },
  ]).onConflictDoNothing();
  console.log('Locations inserted');
  
  await db.insert(schema.roomTypes).values([
    { id: 'type-1', name: 'Auditório' },
    { id: 'type-2', name: 'Sala de Aula' },
  ]).onConflictDoNothing();
  console.log('Room types inserted');
  
  console.log('✅ Seed completed!');
} catch (e) {
  console.error('Seed error:', e);
}
