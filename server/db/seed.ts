import { db } from './client.ts';
import { users, locations, roomTypes, rooms, periods, holidays } from './schema.ts';
import bcrypt from 'bcryptjs';

const main = async () => {
    console.log('🌱 Seeding database...');

    // Hash da senha padrão
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    console.log('Using password hash:', passwordHash);

    try {
        // Users
        console.log('Inserting users...');
        await db.insert(users).values([
            { id: 'user-1', username: 'john.doe', name: 'John Doe', email: 'john@example.com', role: 'USER', photoUrl: 'https://i.pravatar.cc/150?u=user-1', isActive: true, passwordHash: passwordHash },
            { id: 'user-2', username: 'jane.admin', name: 'Jane Admin', email: 'jane@example.com', role: 'ADMIN', photoUrl: 'https://i.pravatar.cc/150?u=user-2', isActive: true, passwordHash: passwordHash },
            { id: 'user-3', username: 'inactive.user', name: 'Inactive User', email: 'inactive@example.com', role: 'USER', photoUrl: 'https://i.pravatar.cc/150?u=user-3', isActive: false, passwordHash: passwordHash },
            { id: 'user-4', username: 'mike.maintenance', name: 'Maintenance Mike', email: 'mike@example.com', role: 'MAINTENANCE', photoUrl: 'https://i.pravatar.cc/150?u=user-4', isActive: true, passwordHash: passwordHash },
        ]).onConflictDoNothing();

        // Locations
        console.log('Inserting locations...');
        await db.insert(locations).values([
            { id: 'loc-1', name: 'BLOCO A' },
            { id: 'loc-2', name: 'BLOCO B - Segundo Andar' },
            { id: 'loc-3', name: 'BLOCO C' },
        ]).onConflictDoNothing();

        // Room Types
        console.log('Inserting room types...');
        await db.insert(roomTypes).values([
            { id: 'type-1', name: 'Auditório' },
            { id: 'type-2', name: 'Sala de Aula Teórica' },
            { id: 'type-3', name: 'Laboratório de Alta Tecnologia' },
            { id: 'type-4', name: 'Oficina Especializada' },
            { id: 'type-5', name: 'Biblioteca' },
            { id: 'type-6', name: 'Ambiente de Convivência' },
            { id: 'type-7', name: 'Unidade Móvel' },
        ]).onConflictDoNothing();

        // Rooms
        console.log('Inserting rooms...');
        await db.insert(rooms).values([
            { id: 'room-1', name: 'Grande Auditório', locationId: 'loc-1', roomTypeId: 'type-1', capacity: 100, resources: JSON.stringify({ projector: true, whiteboard: true }), isActive: true },
            { id: 'room-2', name: 'Laboratório de Informática II', locationId: 'loc-2', roomTypeId: 'type-3', capacity: 25, resources: JSON.stringify({ tv: true, 'video-conference': true }), isActive: true },
            { id: 'room-3', name: 'Sala Teórica 12', locationId: 'loc-2', roomTypeId: 'type-2', capacity: 30, resources: JSON.stringify({ whiteboard: true }), isActive: true },
            { id: 'room-4', name: 'Oficina Mecânica', locationId: 'loc-3', roomTypeId: 'type-4', capacity: 20, resources: JSON.stringify({}), isActive: true },
            { id: 'room-5', name: 'Sala Inativa', locationId: 'loc-1', roomTypeId: 'type-2', capacity: 20, resources: JSON.stringify({}), isActive: false },
        ]).onConflictDoNothing();

        // Periods
        console.log('Inserting periods...');
        await db.insert(periods).values([
            { id: 1, code: 'M1', label: 'Manhã 1', startTime: '08:00', endTime: '09:30' },
            { id: 2, code: 'M2', label: 'Manhã 2', startTime: '09:45', endTime: '11:15' },
            { id: 3, code: 'T1', label: 'Tarde 1', startTime: '13:00', endTime: '14:30' },
            { id: 4, code: 'T2', label: 'Tarde 2', startTime: '14:45', endTime: '16:15' },
            { id: 5, code: 'N1', label: 'Noite 1', startTime: '18:00', endTime: '19:30' },
            { id: 6, code: 'N2', label: 'Noite 2', startTime: '19:45', endTime: '21:15' },
        ]).onConflictDoNothing();

        // Holidays
        console.log('Inserting holidays...');
        // Needs a static date or calculate relative to now. Using the mock's relative calculation might be complex to hardcode.
        // I'll add a fixed holiday for testing.
        await db.insert(holidays).values([
            { date: '2026-12-25', name: 'Natal' }
        ]).onConflictDoNothing();

        console.log('🌱 Seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

main();
