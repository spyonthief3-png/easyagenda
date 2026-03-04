import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  try {
    // Testar query simples
    const rooms = await client.execute("SELECT * FROM rooms LIMIT 3");
    console.log('Rooms:', JSON.stringify(rooms.rows, null, 2));
    
    const users = await client.execute("SELECT id, name, email FROM users LIMIT 3");
    console.log('\nUsers:', JSON.stringify(users.rows, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
