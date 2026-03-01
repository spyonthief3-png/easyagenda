
import { db } from './db/client';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- DEBUG LOGIN START ---');
    try {
        console.log('Checking db.query.users...');
        if (!db.query.users) {
            console.error('CRITICAL: db.query.users is UNDEFINED');
        } else {
            console.log('db.query.users exists.');
        }

        console.log('Attempting to fetch users...');
        const allUsers = await db.query.users.findMany();
        console.log(`Fetched ${allUsers.length} users.`);
        if (allUsers.length > 0) {
            console.log('First user:', allUsers[0]);
        }

    } catch (e) {
        console.error('ERROR in DEBUG_LOGIN:', e);
    }
    console.log('--- DEBUG LOGIN END ---');
}

main();
