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

// CORS - permite origens do ambiente ou usa curingas para Vercel
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : process.env.VERCEL_URL 
        ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL?.replace('.vercel.app', '-vercel.app')}`]
        : ['http://localhost:5173', 'http://localhost:3000'];

// Em produção Vercel, permite qualquer origem pois usa cookie httpOnly
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

// ==================== ROTAS ====================

// Debug endpoint
app.get('/debug', async (req, res) => {
    const dbUrl = process.env.TURSO_DATABASE_URL || process.env.EASYAGENDA_TURSO_DATABASE_URL || process.env.easyagenda_TURSO_DATABASE_URL;
    res.json({ 
        status: 'ok',
        env: { TURSO_URL: !!dbUrl, urlPreview: dbUrl?.substring(0, 30) }
    });
});

// Health Check
app.get('/health', async (req, res) => {
    try {
        await dbQuery('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (error: any) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Auth
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // O banco usa username, mas aceitamos email como login
        const users = await dbQuery('SELECT * FROM users WHERE username = ? OR email = ?', [email, email]);
        const user = users[0];
        
        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            res.status(401).json({ error: 'Email ou senha incorretos' });
            return;
        }

        const token = jwt.sign({ id: user.id, email: user.email || user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email || user.username, role: user.role }
        });
    } catch (error: any) {
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

// Locations
app.get('/api/locations', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM locations');
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/locations', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        await dbRun('INSERT INTO locations (id, name, address) VALUES (?, ?, ?)', [id, req.body.name, req.body.address || '']);
        res.json({ id, ...req.body });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('UPDATE locations SET name = ?, address = ? WHERE id = ?', [req.body.name, req.body.address || '', req.params.id]);
        const rows = await dbQuery('SELECT * FROM locations WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM locations WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Room Types
app.get('/api/room-types', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM room_types');
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/room-types', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        await dbRun('INSERT INTO room_types (id, name) VALUES (?, ?)', [id, req.body.name]);
        res.json({ id, name: req.body.name });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('UPDATE room_types SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
        const rows = await dbQuery('SELECT * FROM room_types WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM room_types WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Rooms
app.get('/api/rooms', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT r.*, l.name as location_name, rt.name as room_type_name 
            FROM rooms r 
            LEFT JOIN locations l ON r.locationId = l.id 
            LEFT JOIN room_types rt ON r.roomTypeId = rt.id
        `);
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/rooms', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { name, locationId, roomTypeId, capacity } = req.body;
        await dbRun(
            'INSERT INTO rooms (id, name, locationId, roomTypeId, capacity) VALUES (?, ?, ?, ?, ?)',
            [id, name, locationId, roomTypeId, capacity || 10]
        );
        const rows = await dbQuery('SELECT * FROM rooms WHERE id = ?', [id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { name, locationId, roomTypeId, capacity } = req.body;
        await dbRun(
            'UPDATE rooms SET name = ?, locationId = ?, roomTypeId = ?, capacity = ? WHERE id = ?',
            [name, locationId, roomTypeId, capacity || 10, req.params.id]
        );
        const rows = await dbQuery('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Users (admin only)
app.get('/api/users', authenticate, ensureAdmin, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT id, name, email, role, isActive FROM users');
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/users', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbRun(
            'INSERT INTO users (id, name, email, passwordHash, role, isActive) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, role || 'USER', 1]
        );
        res.json({ id, name, email, role: role || 'USER' });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/users/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { name, email, password, role, isActive } = req.body;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await dbRun(
                'UPDATE users SET name = ?, email = ?, password = ?, role = ?, isActive = ? WHERE id = ?',
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
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/users/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Bookings
app.get('/api/bookings', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT b.*, r.name as room_name, u.name as user_name, u.email as user_email
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN users u ON b.userId = u.id
            ORDER BY b.date DESC
        `);
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/bookings', authenticate, async (req, res) => {
    try {
        const { roomId, date, periodId, notes } = req.body;
        
        // Check for conflicts
        const conflicts = await dbQuery(
            'SELECT * FROM bookings WHERE roomId = ? AND date = ? AND periodId = ? AND status = ?',
            [roomId, date, periodId, 'CONFIRMED']
        );
        
        if (conflicts.length > 0) {
            res.status(400).json({ error: 'Horário já reservado' });
            return;
        }
        
        const id = createId();
        await dbRun(
            'INSERT INTO bookings (id, userId, roomId, date, periodId, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.user.id, roomId, date, periodId, notes || '', 'CONFIRMED']
        );
        
        const rows = await dbQuery(`
            SELECT b.*, r.name as room_name 
            FROM bookings b 
            LEFT JOIN rooms r ON b.roomId = r.id 
            WHERE b.id = ?
        `, [id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/bookings/:id', authenticate, async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        // Get current booking
        const current = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!current[0]) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        
        // Only owner or admin can update
        if (current[0].userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        
        await dbRun('UPDATE bookings SET status = ?, notes = ? WHERE id = ?', [status, notes || '', req.params.id]);
        const rows = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/bookings/:id', authenticate, async (req, res) => {
    try {
        const current = await dbQuery('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!current[0]) {
            res.status(404).json({ error: 'Booking not found' });
            return;
        }
        
        if (current[0].userId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        
        await dbRun('DELETE FROM bookings WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Periods
app.get('/api/periods', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM periods ORDER BY start_time');
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/periods', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { name, start_time, end_time } = req.body;
        await dbRun('INSERT INTO periods (id, name, start_time, end_time) VALUES (?, ?, ?, ?)', [id, name, start_time, end_time]);
        res.json({ id, name, start_time, end_time });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/periods/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const { name, start_time, end_time } = req.body;
        await dbRun('UPDATE periods SET name = ?, start_time = ?, end_time = ? WHERE id = ?', [name, start_time, end_time, req.params.id]);
        const rows = await dbQuery('SELECT * FROM periods WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/periods/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM periods WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Holidays
app.get('/api/holidays', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM holidays');
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/holidays', authenticate, ensureAdmin, async (req, res) => {
    try {
        const id = createId();
        const { date, name } = req.body;
        await dbRun('INSERT INTO holidays (id, date, name) VALUES (?, ?, ?)', [id, date, name]);
        res.json({ id, date, name });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.delete('/api/holidays/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await dbRun('DELETE FROM holidays WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Dashboard
app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const totalRooms = await dbQuery('SELECT COUNT(*) as count FROM rooms');
        const todayBookings = await dbQuery('SELECT COUNT(*) as count FROM bookings WHERE date = ? AND status = ?', [today, 'CONFIRMED']);
        const totalUsers = await dbQuery('SELECT COUNT(*) as count FROM users WHERE isActive = 1');
        
        res.json({
            totalRooms: totalRooms[0]?.count || 0,
            todayBookings: todayBookings[0]?.count || 0,
            totalUsers: totalUsers[0]?.count || 0
        });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.get('/api/dashboard/upcoming', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const rows = await dbQuery(`
            SELECT b.*, r.name as room_name, u.name as user_name
            FROM bookings b
            LEFT JOIN rooms r ON b.roomId = r.id
            LEFT JOIN users u ON b.userId = u.id
            WHERE b.date >= ? AND b.date <= ? AND b.status = ?
            ORDER BY b.date ASC
            LIMIT 10
        `, [today, nextWeek, 'CONFIRMED']);
        
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Issues
app.get('/api/issues', authenticate, async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT i.*, r.name as room_name, u.name as user_name
            FROM issue_reports i
            LEFT JOIN rooms r ON i.roomId = r.id
            LEFT JOIN users u ON i.userId = u.id
            ORDER BY i.createdAt DESC
        `);
        res.json(rows);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.post('/api/issues', authenticate, async (req, res) => {
    try {
        const id = createId();
        const { roomId, title, description } = req.body;
        await dbRun(
            'INSERT INTO issue_reports (id, userId, roomId, title, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, req.user.id, roomId, title, description || '', 'OPEN']
        );
        res.json({ id, userId: req.user.id, roomId, title, description, status: 'OPEN' });
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

app.put('/api/issues/:id', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        await dbRun('UPDATE issue_reports SET status = ? WHERE id = ?', [status, req.params.id]);
        const rows = await dbQuery('SELECT * FROM issue_reports WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (e: any) { console.error('Room query error:', e); res.status(500).json({ error: e.message || 'Failed' }); }
});

// Middleware de autenticação
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

export default app;
