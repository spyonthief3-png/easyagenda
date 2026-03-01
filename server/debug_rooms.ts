
import { db } from './db/client';
import { rooms } from './db/schema'; // Ensure schema is loaded implicitly via client
import { eq } from 'drizzle-orm';

async function main() {
    console.log('--- DEBUG ROOMS START ---');
    try {
        console.log('Fetching rooms...');
        const allRooms = await db.query.rooms.findMany({
            with: { location: true, roomType: true }
        });
        console.log(`Fetched ${allRooms.length} rooms.`);

        console.log('Sample room:', allRooms[0]);
        console.log('Sample resources type:', typeof allRooms[0]?.resources);

        // Simulate the mapping logic
        const parsed = allRooms.map(r => {
            try {
                return {
                    ...r,
                    resources: typeof r.resources === 'string' ? JSON.parse(r.resources) : r.resources
                };
            } catch (err) {
                console.error('Error parsing resources for room:', r.id, r.resources);
                throw err;
            }
        });

        console.log('Successfully mapped rooms.');
    } catch (e) {
        console.error('ERROR in DEBUG_ROOMS:', e);
    }
    console.log('--- DEBUG ROOMS END ---');
}

main();
