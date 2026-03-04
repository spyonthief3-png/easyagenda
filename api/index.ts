// Vercel Serverless Entry Point
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { createId } from '@paralleldrive/cuid2';

const app = express();

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : process.env.VERCEL_URL 
        ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL?.replace('.vercel.app', '-vercel.app')}`]
        : ['http://localhost:5173', 'http://localhost:3000'];

const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: isProduction ? true : allowedOrigins,
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});

app.use(limiter);
app.use(express.json());
app.use(cookieParser());

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ==================== DB HELPER ====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbClient: any = null;

async function getDbClient() {
    if (dbClient) return dbClient;
    
    const { createClient } = await import('@libsql/client');
    
    let dbUrl = process.env.TURSO_DATABASE_URL || process.env.EASYAGENDA_TURSO_DATABASE_URL || process.env.easyagenda_TURSO_DATABASE_URL;
    let dbToken = process.env.TURSO_AUTH_TOKEN || process.env.EASYAGENDA_TURSO_AUTH_TOKEN || process.env.easyagenda_TURSO_AUTH_TOKEN;
    
    dbUrl = dbUrl?.trim();
    dbToken = dbToken?.trim();
    
    dbClient = createClient({ url: dbUrl, authToken: dbToken });
    return dbClient;
}

// Helper para executar queries
async function dbQuery(sql: string, params: any[] = []) {
    const client = await getDbClient();
    const result = await client.execute({ sql, args: params });
    return result.rows;
}

async function dbRun(sql: string, params: any[] = []) {
    const client = await getDbClient();
    await client.execute({ sql, args: params });
}

// ==================== MIDDLEWARE ====================

function authenticate(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

function ensureAdmin(req: any, res: any, next: any) {
    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin only' });
        return;
    }
    next();
}

function ensureMaintenanceOrAdmin(req: any, res: any, next: any) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MAINTENANCE') {
        res.status(403).json({ error: 'Admin or Maintenance only' });
        return;
    }
    next();
}

// ==================== ROTAS ====================

// Health Check
app.get('/health', async (req, res) => {
    try {
        await dbQuery('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// ==================== AUTH ====================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = await dbQuery('SELECT * FROM users WHERE username = ? OR email = ?', [email, email]);
        const user = users[0];
        
        if (!user || !user.passwordHash || !await bcrypt.compare(password, String(user.passwordHash))) {
            res.status(401).json({ error: 'Email ou senha incorretos' });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email || user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email || user.username, role: user.role }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authenticate, async (req: any, res) => {
    try {
        const users = await dbQuery('SELECT id, name, username, email, role FROM users WHERE id = ?', [req.user.id]);
        if (!users[0]) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }
        const u = users[0];
        res.json({ id: u.id, name: u.name, email: u.email || u.username, role: u.role });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

// ==================== LOCATIONS ====================

app.get('/api/locations', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM locations');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/locations', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        await dbRun('INSERT INTO locations (id, name) VALUES (?, ?)', [id, req.body.name]);
        res.json({ id, name: req.body.name });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('UPDATE locations SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
        const rows = await dbQuery('SELECT * FROM locations WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM locations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== ROOM TYPES ====================

app.get('/api/room-types', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM room_types');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/room-types', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        await dbRun('INSERT INTO room_types (id, name) VALUES (?, ?)', [id, req.body.name]);
        res.json({ id, name: req.body.name });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('UPDATE room_types SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
        const rows = await dbQuery('SELECT * FROM room_types WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM room_types WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== ROOMS ====================

app.get('/api/rooms', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT r.*, l.name as locationName, rt.name as roomTypeName 
            FROM rooms r 
            LEFT JOIN locations l ON r.locationId = l.id 
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
        `);
        
        // Map to nested structure expected by frontend
        const rooms = rows.map((r: any) => ({
            ...r,
            resources: typeof r.resources === 'string' ? JSON.parse(r.resources) : r.resources,
            location: { id: r.locationId, name: r.locationName },
            roomType: { id: r.roomTypeId, name: r.roomTypeName }
        }));
        
        res.json(rooms);
    } catch (e: any) { console.error('Rooms error:', e); res.status(500).json({ error: e.message }); }
});

app.post('/api/rooms', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { name, locationId, roomTypeId, capacity, resources } = req.body;
        await dbRun(
            'INSERT INTO rooms (id, name, locationId, roomTypeId, capacity, resources, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, locationId, roomTypeId, capacity || 10, JSON.stringify(resources || []), 1]
        );
        const rows = await dbQuery(`
            SELECT r.*, l.name as locationName, rt.name as roomTypeName 
            FROM rooms r 
            LEFT JOIN locations l ON r.locationId = l.id 
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            WHERE r.id = ?
        `, [id]);
        
        const r: any = rows[0];
        const room = {
            ...r,
            resources: typeof r.resources === 'string' ? JSON.parse(r.resources) : r.resources,
            location: { id: r.locationId, name: r.locationName },
            roomType: { id: r.roomTypeId, name: r.roomTypeName }
        };
        
        res.json(room);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { name, locationId, roomTypeId, capacity, resources, isActive } = req.body;
        await dbRun(
            'UPDATE rooms SET name = ?, locationId = ?, roomTypeId = ?, capacity = ?, resources = ?, isActive = ? WHERE id = ?',
            [name, locationId, roomTypeId, capacity || 10, JSON.stringify(resources || []), isActive !== undefined ? (isActive ? 1 : 0) : 1, req.params.id]
        );
        const rows = await dbQuery(`
            SELECT r.*, l.name as locationName, rt.name as roomTypeName 
            FROM rooms r 
            LEFT JOIN locations l ON r.locationId = l.id 
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            WHERE r.id = ?
        `, [req.params.id]);
        
        const r: any = rows[0];
        const room = {
            ...r,
            resources: typeof r.resources === 'string' ? JSON.parse(r.resources) : r.resources,
            location: { id: r.locationId, name: r.locationName },
            roomType: { id: r.roomTypeId, name: r.roomTypeName }
        };
        
        res.json(room);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== USERS ====================

app.get('/api/users', authenticate, ensureAdmin, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT id, name, email, role, isActive FROM users');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun(
            'INSERT INTO users (id, username, name, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, email, name, email, hashedPassword, role || 'USER', 1]
        );
        res.json({ id, name, email, role: role || 'USER' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { name, email, password, role, isActive } = req.body;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await dbRun(
                'UPDATE users SET name = ?, email = ?, passwordHash = ?, role = ?, isActive = ? WHERE id = ?',
                [name, email, hashedPassword, role, isActive !== undefined ? (isActive ? 1 : 0) : 1, req.params.id]
            );
        } else {
            await dbRun(
                'UPDATE users SET name = ?, email = ?, role = ?, isActive = ? WHERE id = ?',
                [name, email, role, isActive !== undefined ? (isActive ? 1 : 0) : 1, req.params.id]
            );
        }
        const rows = await dbQuery('SELECT id, name, email, role, isActive FROM users WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id/password', authenticate, async (req: any, res) => {
    try {
        const { oldPass, newPass } = req.body;
        const users = await dbQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!users[0]) { res.status(404).json({ error: 'User not found' }); return; }
        
        // Only self or admin
        if (req.user.id !== req.params.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        
        if (!await bcrypt.compare(oldPass, String(users[0].passwordHash))) {
            res.status(400).json({ error: 'Senha atual incorreta' }); return;
        }
        
        const hashed = await bcrypt.hash(newPass, 10);
        await dbRun('UPDATE users SET passwordHash = ? WHERE id = ?', [hashed, req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== PERIODS ====================

app.get('/api/periods', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM periods ORDER BY startTime');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/periods', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { code, name, label, startTime, endTime } = req.body;
        await dbRun('INSERT INTO periods (code, label, startTime, endTime) VALUES (?, ?, ?, ?)', 
            [code || name, label || name, startTime, endTime]);
        const rows = await dbQuery('SELECT * FROM periods ORDER BY id DESC LIMIT 1');
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/periods/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { code, name, label, startTime, endTime } = req.body;
        await dbRun('UPDATE periods SET code = ?, label = ?, startTime = ?, endTime = ? WHERE id = ?', 
            [code || name, label || name, startTime, endTime, req.params.id]);
        const rows = await dbQuery('SELECT * FROM periods WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/periods/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM periods WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== BOOKINGS ====================

app.get('/api/bookings', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT b.*, 
                   r.name as roomName, r.locationId, r.roomTypeId, r.capacity, r.resources, r.isActive as roomIsActive,
                   l.name as locationName, 
                   rt.name as roomTypeName,
                   u.name as userName, u.email as userEmail,
                   p.label as periodLabel, p.startTime as periodStartTime, p.endTime as periodEndTime, p.code as periodCode
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN locations l ON r.locationId = l.id
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            LEFT JOIN users u ON b.userId = u.id
            LEFT JOIN periods p ON b.periodId = p.id
            ORDER BY b.date DESC
        `);
        
        const bookings = rows.map((b: any) => ({
            ...b,
            room: {
                id: b.roomId,
                name: b.roomName,
                locationId: b.locationId,
                roomTypeId: b.roomTypeId,
                capacity: b.capacity,
                resources: typeof b.resources === 'string' ? JSON.parse(b.resources) : b.resources,
                isActive: b.roomIsActive,
                location: { id: b.locationId, name: b.locationName },
                roomType: { id: b.roomTypeId, name: b.roomTypeName }
            },
            user: { id: b.userId, name: b.userName, email: b.userEmail },
            period: { id: b.periodId, code: b.periodCode, label: b.periodLabel, startTime: b.periodStartTime, endTime: b.periodEndTime }
        }));
        
        res.json(bookings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings/my', authenticate, async (req: any, res) => {
    try {
        const rows = await dbQuery(`
            SELECT b.*, 
                   r.name as roomName, r.locationId, r.roomTypeId, r.capacity, r.resources, r.isActive as roomIsActive,
                   l.name as locationName, 
                   rt.name as roomTypeName,
                   p.label as periodLabel, p.startTime as periodStartTime, p.endTime as periodEndTime, p.code as periodCode
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN locations l ON r.locationId = l.id
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            LEFT JOIN periods p ON b.periodId = p.id
            WHERE b.userId = ?
            ORDER BY b.date DESC
        `, [req.user.id]);

        const bookings = rows.map((b: any) => ({
            ...b,
            room: {
                id: b.roomId,
                name: b.roomName,
                locationId: b.locationId,
                roomTypeId: b.roomTypeId,
                capacity: b.capacity,
                resources: typeof b.resources === 'string' ? JSON.parse(b.resources) : b.resources,
                isActive: b.roomIsActive,
                location: { id: b.locationId, name: b.locationName },
                roomType: { id: b.roomTypeId, name: b.roomTypeName }
            },
            period: { id: b.periodId, code: b.periodCode, label: b.periodLabel, startTime: b.periodStartTime, endTime: b.periodEndTime }
        }));

        res.json(bookings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings', authenticate, async (req: any, res) => {
    try {
        const { roomId, date, periodId, periodCode, title, notes } = req.body;
        
        // Resolve periodId from periodCode if needed
        let resolvedPeriodId = periodId;
        if (!resolvedPeriodId && periodCode) {
            const periods = await dbQuery('SELECT id FROM periods WHERE code = ?', [periodCode]);
            if (periods[0]) resolvedPeriodId = periods[0].id;
        }
        
        // Check for conflicts
        const conflicts = await dbQuery(
            'SELECT * FROM bookings WHERE roomId = ? AND date = ? AND periodId = ? AND status = ?',
            [roomId, date, resolvedPeriodId, 'CONFIRMED']
        );
        
        if (conflicts.length > 0) {
            res.status(400).json({ error: 'Horário já reservado' });
            return;
        }
        
        const id = createId();
        await dbRun(
            'INSERT INTO bookings (id, userId, roomId, date, periodId, title, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, roomId, date, resolvedPeriodId, title || 'Reserva', notes || '', 'CONFIRMED']
        );
        
        const rows = await dbQuery(`
            SELECT b.*, r.name as roomName 
            FROM bookings b 
            LEFT JOIN rooms r ON b.roomId = r.id 
            WHERE b.id = ?
        `, [id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Booking error:', e); res.status(500).json({ error: e.message }); }
});

app.put('/api/bookings/:id', authenticate, async (req: any, res) => {
    try {
        const { status, notes } = req.body;
        
        const current = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!current[0]) {
            res.status(404).json({ error: 'Booking not found' }); return;
        }
        
        if (current[0].userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        
        await dbRun('UPDATE bookings SET status = ?, notes = ? WHERE id = ?', [status, notes || '', req.params.id]);
        const rows = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/bookings/:id', authenticate, async (req: any, res) => {
    try {
        const current = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!current[0]) {
            res.status(404).json({ error: 'Booking not found' }); return;
        }
        
        if (current[0].userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        
        await dbRun('DELETE FROM bookings WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== AVAILABILITY ====================

app.get('/api/availability', authenticate, async (req: any, res) => {
    try {
        const { date } = req.query;
        if (!date) { res.status(400).json({ error: 'date query param required' }); return; }
        
        const dateStr = String(date);
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();
        const currentUserId = req.user.id;

        const allRooms = await dbQuery('SELECT * FROM rooms WHERE isActive = 1');
        const allPeriods = await dbQuery('SELECT * FROM periods ORDER BY startTime');

        // 1. Check Sunday
        if (dayOfWeek === 0) {
            const result: any = {};
            for (const room of allRooms) {
                result[room.id] = {};
                for (const period of allPeriods) {
                    result[room.id][period.code] = { status: 'CLOSED' };
                }
            }
            res.json(result);
            return;
        }

        // 2. Check Holiday
        const holidays = await dbQuery('SELECT * FROM holidays WHERE date = ?', [dateStr]);
        if (holidays.length > 0) {
            const holiday = holidays[0];
            const result: any = {};
            for (const room of allRooms) {
                result[room.id] = {};
                for (const period of allPeriods) {
                    result[room.id][period.code] = {
                        status: 'HOLIDAY',
                        holiday: { name: holiday.name }
                    };
                }
            }
            res.json(result);
            return;
        }

        // 3. Fetch Blackouts and Bookings for this date
        const dayBlackouts = await dbQuery('SELECT * FROM blackouts WHERE date = ?', [dateStr]);
        const dayBookings = await dbQuery(
            'SELECT b.*, u.name as userName FROM bookings b LEFT JOIN users u ON b.userId = u.id WHERE b.date = ? AND b.status = ?', 
            [dateStr, 'CONFIRMED']
        );

        const result: any = {};
        for (const room of allRooms) {
            result[room.id] = {};
            for (const period of allPeriods) {
                // Check blackout
                const blackout = dayBlackouts.find((b: any) =>
                    (b.roomId === null || b.roomId === room.id) &&
                    (b.periodId === null || b.periodId === period.id)
                );

                if (blackout) {
                    result[room.id][period.code] = {
                        status: 'BLACKOUT',
                        blackout: { reason: blackout.reason, blockId: blackout.blockId }
                    };
                    continue;
                }

                // Check booking
                const booking = dayBookings.find((b: any) =>
                    b.roomId === room.id &&
                    b.periodId === period.id
                );

                if (booking) {
                    result[room.id][period.code] = {
                        status: booking.userId === currentUserId ? 'MY_BOOKING' : 'BOOKED',
                        booking: {
                            id: booking.id,
                            title: booking.title,
                            user: { name: booking.userName }
                        }
                    };
                } else {
                    result[room.id][period.code] = { status: 'AVAILABLE' };
                }
            }
        }
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== HOLIDAYS ====================

app.get('/api/holidays', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM holidays');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/holidays', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { date, name } = req.body;
        await dbRun('INSERT INTO holidays (date, name) VALUES (?, ?)', [date, name]);
        const rows = await dbQuery('SELECT * FROM holidays ORDER BY id DESC LIMIT 1');
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/holidays/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM holidays WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== BLACKOUTS ====================

app.get('/api/blackouts', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM blackouts');
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/blackouts', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { date, periodId, roomId, reason } = req.body;
        await dbRun('INSERT INTO blackouts (id, date, periodId, roomId, reason) VALUES (?, ?, ?, ?, ?)',
            [id, date, periodId || null, roomId || null, reason]);
        res.json({ id, date, periodId, roomId, reason });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/blackouts/range', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { startDate, endDate, roomId, reason } = req.body;
        const blockId = createId();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const id = createId();
            await dbRun('INSERT INTO blackouts (id, date, roomId, reason, blockId) VALUES (?, ?, ?, ?, ?)',
                [id, dateStr, roomId || null, reason, blockId]);
        }
        res.json({ success: true, blockId });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/blackouts/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM blackouts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/blackouts/range/:blockId', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM blackouts WHERE blockId = ?', [req.params.blockId]);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== DASHBOARD ====================

app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const totalRoomsResult = await dbQuery('SELECT COUNT(*) as count FROM rooms WHERE isActive = 1');
        const todayBookingsResult = await dbQuery('SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status = ?', [today, 'CONFIRMED']);
        const totalUsersResult = await dbQuery('SELECT COUNT(*) as count FROM users WHERE isActive = 1');
        
        const weekBookingsRows = await dbQuery(`
            SELECT b.*, 
                   r.name as roomName, r.locationId, r.roomTypeId,
                   l.name as locationName, 
                   rt.name as roomTypeName,
                   u.name as userName,
                   p.label as periodLabel, p.startTime as periodStartTime, p.endTime as periodEndTime
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN locations l ON r.locationId = l.id
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            LEFT JOIN users u ON b.userId = u.id
            LEFT JOIN periods p ON b.periodId = p.id
            WHERE b.date >= ? AND b.status = ?
            ORDER BY b.date ASC
            LIMIT 10
        `, [today, 'CONFIRMED']);

        const upcomingBookings = weekBookingsRows.map((b: any) => ({
            ...b,
            room: {
                id: b.roomId,
                name: b.roomName,
                location: { id: b.locationId, name: b.locationName },
                roomType: { id: b.roomTypeId, name: b.roomTypeName }
            },
            user: { id: b.userId, name: b.userName },
            period: { id: b.periodId, label: b.periodLabel, startTime: b.periodStartTime, endTime: b.periodEndTime }
        }));
        
        res.json({
            totalRooms: totalRoomsResult[0]?.count || 0,
            todayBookings: todayBookingsResult[0]?.count || 0,
            totalUsers: totalUsersResult[0]?.count || 0,
            upcomingBookings
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const totalRooms = await dbQuery('SELECT COUNT(*) as count FROM rooms WHERE isActive = 1');
        const todayBookings = await dbQuery('SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status = ?', [today, 'CONFIRMED']);
        const totalUsers = await dbQuery('SELECT COUNT(*) as count FROM users WHERE isActive = 1');
        
        res.json({
            totalRooms: totalRooms[0]?.count || 0,
            todayBookings: todayBookings[0]?.count || 0,
            totalUsers: totalUsers[0]?.count || 0
        });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/upcoming', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const rows = await dbQuery(`
            SELECT b.*, 
                   r.name as roomName, r.locationId, r.roomTypeId,
                   l.name as locationName, 
                   rt.name as roomTypeName,
                   u.name as userName,
                   p.label as periodLabel, p.startTime as periodStartTime, p.endTime as periodEndTime
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN locations l ON r.locationId = l.id
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            LEFT JOIN users u ON b.userId = u.id
            LEFT JOIN periods p ON b.periodId = p.id
            WHERE b.date >= ? AND b.status = ?
            ORDER BY b.date ASC
            LIMIT 10
        `, [today, 'CONFIRMED']);
        
        const upcomingBookings = rows.map((b: any) => ({
            ...b,
            room: {
                id: b.roomId,
                name: b.roomName,
                location: { id: b.locationId, name: b.locationName },
                roomType: { id: b.roomTypeId, name: b.roomTypeName }
            },
            user: { id: b.userId, name: b.userName },
            period: { id: b.periodId, label: b.periodLabel, startTime: b.periodStartTime, endTime: b.periodEndTime }
        }));

        res.json(upcomingBookings);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== ISSUES ====================

app.get('/api/issues', authenticate, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT i.*, 
                   r.name as roomName, r.locationId, r.roomTypeId,
                   l.name as locationName, 
                   rt.name as roomTypeName,
                   u.name as userName, u.email as userEmail
            FROM issue_reports i
            LEFT JOIN rooms r ON i.roomId = r.id
            LEFT JOIN locations l ON r.locationId = l.id
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
            LEFT JOIN users u ON i.userId = u.id
        `;
        const params: any[] = [];
        if (status) {
            query += ' WHERE i.status = ?';
            params.push(status);
        }
        query += ' ORDER BY i.createdAt DESC';
        
        const rows = await dbQuery(query, params);
        const issues = rows.map((i: any) => ({
            ...i,
            room: {
                id: i.roomId,
                name: i.roomName,
                location: { id: i.locationId, name: i.locationName },
                roomType: { id: i.roomTypeId, name: i.roomTypeName }
            },
            user: { id: i.userId, name: i.userName, email: i.userEmail }
        }));
        
        res.json(issues);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/issues', authenticate, async (req: any, res) => {
    try {
        const id = createId();
        const { roomId, category, description, patrimonyNumber, title } = req.body;
        await dbRun(
            'INSERT INTO issue_reports (id, userId, roomId, category, description, patrimonyNumber, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, roomId, category || 'OTHER', description || title, patrimonyNumber || null, 'OPEN']
        );
        res.json({ id, userId: req.user.id, roomId, category, description, status: 'OPEN' });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/issues/:id', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        const { status, resolutionNotes } = req.body;
        const resolvedAt = status === 'RESOLVED' ? new Date().toISOString() : null;
        await dbRun('UPDATE issue_reports SET status = ?, resolutionNotes = ?, resolvedAt = ?, updatedAt = ? WHERE id = ?', 
            [status, resolutionNotes || null, resolvedAt, new Date().toISOString(), req.params.id]);
        const rows = await dbQuery('SELECT * FROM issue_reports WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ==================== AUDIT LOGS ====================

app.get('/api/audit-logs', authenticate, ensureAdmin, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT al.*, u.name as actorNameCurrent
            FROM audit_logs al
            LEFT JOIN users u ON al.actorId = u.id
            ORDER BY al.createdAt DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default app;
