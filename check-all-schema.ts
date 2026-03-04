import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const tables = ['users', 'rooms', 'locations', 'room_types', 'bookings'];
  for (const table of tables) {
    const result = await client.execute(`SELECT * FROM ${table} LIMIT 1`);
    console.log(`${table} columns:`, Object.keys(result.rows[0] || {}).join(', '));
  }
}

main();
