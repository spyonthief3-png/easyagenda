import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const bookings = await client.execute("SELECT * FROM bookings LIMIT 1");
  console.log('bookings:', bookings.rows[0]);
  
  const users = await client.execute("SELECT * FROM users LIMIT 1");
  console.log('users:', users.rows[0]);
}

main();
