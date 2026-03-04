import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const result = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='rooms'");
  console.log('Schema rooms:', result.rows[0].sql);
}

main();
