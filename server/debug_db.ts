
import { db } from './db/client';
import * as schema from './db/schema';

console.log('--- DEBUG START ---');
console.log('Schema keys:', Object.keys(schema));
console.log('DB Query API keys:', db.query ? Object.keys(db.query) : 'db.query is undefined');
if (db.query && db.query.users) {
    console.log('db.query.users exists');
} else {
    console.log('db.query.users MISSING');
}
console.log('--- DEBUG END ---');
