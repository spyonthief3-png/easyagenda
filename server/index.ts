import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from './db/client';
import { users, locations, roomTypes, rooms, bookings, periods, holidays, blackouts, issueReports, auditLogs } from './db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { formatToYyyyMmDd, addDays } from './utils/date';
import { validateBody, loginSchema, createUserSchema, createBookingSchema, createRoomSchema, createLocationSchema, createRoomTypeSchema, createHolidaySchema, createBlackoutSchema, createBlackoutRangeSchema, createIssueSchema, updateIssueSchema } from './validations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-123';

// CORS - permite localhost em dev, variável em produção
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Rate limiting - proteção contra ataques
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requisições por IP
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Health check (sem rate limit)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(cookieParser());

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


// TYPES
interface AuthRequest extends express.Request {
    user?: { id: string; role: string };
}

// AUTH MIDDLEWARE
const authenticate = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const ensureAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Forbidden: Admin only' });
        return;
    }
    next();
};

const ensureMaintenanceOrAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'MAINTENANCE') {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    next();
};

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    try {
        // Validar input com Zod
        const validation = validateBody(loginSchema, req.body);
        if (!validation.success || !validation.data) {
            res.status(400).json({ error: validation.error || 'Dados inválidos' });
            return;
        }

        const email = validation.data.email;
        const password = validation.data.password;

        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            res.status(401).json({ error: 'Credenciais inválidas' });
            return;
        }

        // Verificar se usuário está ativo
        if (!user.isActive) {
            res.status(401).json({ error: 'Usuário inativo. Contate o administrador.' });
            return;
        }

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

        // Cookie seguro em produção
        const isProduction = process.env.NODE_ENV === 'production';
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) {
        console.error('LOGIN ERROR:', e);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, req.user!.id)
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: 'Internal Error' });
    }
});

// --- RESOURCES (CRUD) ---

// LOCATIONS
app.get('/api/locations', authenticate, async (req, res) => {
    try {
        const all = await db.query.locations.findMany();
        res.json(all);
    } catch (e) { res.status(500).json({ error: 'Failed to fetch' }); }
});
app.post('/api/locations', authenticate, ensureAdmin, async (req, res) => {
    try {
        const newItem = { ...req.body, id: createId() };
        await db.insert(locations).values(newItem);
        res.json(newItem);
    } catch (e) { res.status(500).json({ error: 'Failed to create' }); }
});
app.put('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.update(locations).set(req.body).where(eq(locations.id, req.params.id));
        const updated = await db.query.locations.findFirst({ where: eq(locations.id, req.params.id) });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});
app.delete('/api/locations/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.delete(locations).where(eq(locations.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete' }); }
});

// ROOM TYPES
app.get('/api/room-types', authenticate, async (req, res) => {
    try {
        const all = await db.query.roomTypes.findMany();
        res.json(all);
    } catch (e) { res.status(500).json({ error: 'Failed to fetch' }); }
});
app.post('/api/room-types', authenticate, ensureAdmin, async (req, res) => {
    try {
        const newItem = { ...req.body, id: createId() };
        await db.insert(roomTypes).values(newItem);
        res.json(newItem);
    } catch (e) { res.status(500).json({ error: 'Failed to create' }); }
});
app.put('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.update(roomTypes).set(req.body).where(eq(roomTypes.id, req.params.id));
        const updated = await db.query.roomTypes.findFirst({ where: eq(roomTypes.id, req.params.id) });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});
app.delete('/api/room-types/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.delete(roomTypes).where(eq(roomTypes.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete' }); }
});

// ROOMS
app.get('/api/rooms', authenticate, async (req, res) => {
    try {
        const allRooms = await db.query.rooms.findMany({
            with: { location: true, roomType: true }
        });
        // Check if resources is string, parse it if needed (driver handles JSON usually, but be safe)
        const parsed = allRooms.map(r => ({
            ...r,
            resources: typeof r.resources === 'string' ? JSON.parse(r.resources) : r.resources
        }));
        res.json(parsed);
    } catch (e) {
        console.error('Error fetching rooms:', e);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});
app.post('/api/rooms', authenticate, ensureAdmin, async (req, res) => {
    try {
        // Ensure resources is valid JSON string if needed
        const data = { ...req.body, id: createId() };
        if (typeof data.resources !== 'string') data.resources = JSON.stringify(data.resources);

        await db.insert(rooms).values(data);
        const created = await db.query.rooms.findFirst({ where: eq(rooms.id, data.id), with: { location: true, roomType: true } });
        res.json(created);
    } catch (e) { res.status(500).json({ error: 'Failed to create' }); }
});
app.put('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.resources && typeof data.resources !== 'string') data.resources = JSON.stringify(data.resources);

        await db.update(rooms).set(data).where(eq(rooms.id, req.params.id));
        const updated = await db.query.rooms.findFirst({ where: eq(rooms.id, req.params.id), with: { location: true, roomType: true } });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Failed to update' }); }
});
app.delete('/api/rooms/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.delete(rooms).where(eq(rooms.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to delete' }); }
});

// USERS
app.get('/api/users', authenticate, async (req, res) => {
    try {
        const all = await db.query.users.findMany();
        res.json(all);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/users', authenticate, ensureAdmin, async (req, res) => {
    try {
        // Generate hash for default password (or provided password)
        const plainPassword = req.body.password || 'password123';
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        
        const { password, ...userData } = req.body;
        const data = { ...userData, id: createId(), passwordHash };
        
        await db.insert(users).values(data);
        
        // Don't return passwordHash
        const { passwordHash: _, ...result } = data;
        res.json(result);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.put('/api/users/:id', authenticate, async (req, res) => {
    try {
        // Allow admin OR self
        if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        // Prevent role change if not admin
        if (req.user?.role !== 'ADMIN') {
            delete updateData.role;
        }
        // Prevent password change via this route (use specific route)
        delete updateData.passwordHash;

        await db.update(users).set(updateData).where(eq(users.id, req.params.id));
        const updated = await db.query.users.findFirst({ where: eq(users.id, req.params.id) });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/users/:id/password', authenticate, async (req, res) => {
    try {
        // Allow admin OR self
        if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.id) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const { currentPassword, newPassword } = req.body;

        const user = await db.query.users.findFirst({ where: eq(users.id, req.params.id) });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password
        const user = await db.query.users.findFirst({ where: eq(users.id, req.params.id) });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Verify current password with bcrypt
        if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
            res.status(400).json({ error: 'Senha atual incorreta' });
            return;
        }

        // Hash new password
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to update password' }); }
});
app.delete('/api/users/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.delete(users).where(eq(users.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Availability logic
app.get('/api/availability', authenticate, async (req: AuthRequest, res) => {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
        res.status(400).json({ error: 'Data obrigatória (date)' });
        return;
    }

    try {
        const dateObj = new Date(date + 'T00:00:00');
        const dateStr = formatToYyyyMmDd(dateObj);
        const dayOfWeek = dateObj.getDay();
        const currentUserId = req.user!.id;

        const allRooms = await db.query.rooms.findMany({
            where: eq(rooms.isActive, true)
        });
        const allPeriods = await db.query.periods.findMany();

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
        const holiday = await db.query.holidays.findFirst({
            where: eq(holidays.date, dateStr)
        });

        if (holiday) {
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
        const dayBlackouts = await db.query.blackouts.findMany({
            where: eq(blackouts.date, dateStr)
        });

        const dayBookings = await db.query.bookings.findMany({
            where: and(eq(bookings.date, dateStr), eq(bookings.status, 'CONFIRMED')),
            with: { user: true }
        });

        const result: any = {};
        for (const room of allRooms) {
            result[room.id] = {};
            for (const period of allPeriods) {
                // Check blackout
                const blackout = dayBlackouts.find(b =>
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
                const booking = dayBookings.find(b =>
                    b.roomId === room.id &&
                    b.periodId === period.id
                );

                if (booking) {
                    result[room.id][period.code] = {
                        status: booking.userId === currentUserId ? 'MY_BOOKING' : 'BOOKED',
                        booking: {
                            id: booking.id,
                            title: booking.title,
                            user: { name: booking.user.name }
                        }
                    };
                } else {
                    result[room.id][period.code] = { status: 'AVAILABLE' };
                }
            }
        }
        res.json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});


// Bookings
app.get('/api/bookings', authenticate, async (req, res) => {
    try {
        const allBookings = await db.query.bookings.findMany({
            with: {
                room: { with: { location: true, roomType: true } },
                user: true,
                period: true
            },
            orderBy: (bookings, { desc }) => [desc(bookings.date)]
        });
        res.json(allBookings);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.get('/api/bookings/my', authenticate, async (req: AuthRequest, res) => {
    try {
        const myBookings = await db.query.bookings.findMany({
            where: and(
                eq(bookings.userId, req.user!.id),
                eq(bookings.status, 'CONFIRMED')
            ),
            with: {
                room: { with: { location: true, roomType: true } },
                user: true,
                period: true
            },
            orderBy: (bookings, { desc }) => [desc(bookings.date)]
        });
        res.json(myBookings);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch my bookings' });
    }
});

app.post('/api/bookings', authenticate, async (req: AuthRequest, res) => {
    const { roomId, date, periodCode, title, notes } = req.body;
    try {
        const period = await db.query.periods.findFirst({ where: eq(periods.code, periodCode) });
        if (!period) { res.status(400).json({ error: 'Invalid period code' }); return; }

        const periodId = period.id;

        // Check conflicts
        const existing = await db.query.bookings.findFirst({
            where: and(eq(bookings.roomId, roomId), eq(bookings.date, date), eq(bookings.periodId, periodId), eq(bookings.status, 'CONFIRMED'))
        });
        if (existing) { res.status(409).json({ error: 'Conflict' }); return; }

        const newBooking = {
            id: createId(), roomId, userId: req.user!.id, date, periodId, title, notes, status: 'CONFIRMED' as const
        };

        await db.insert(bookings).values(newBooking);
        const created = await db.query.bookings.findFirst({ where: eq(bookings.id, newBooking.id), with: { room: true, user: true, period: true } });
        res.json(created);
    } catch (e) { res.status(500).json({ error: 'Failed to create booking' }); }
});

app.delete('/api/bookings/:id', authenticate, async (req: AuthRequest, res) => {
    const { id } = req.params;
    try {
        const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, id) });
        if (!booking) { res.status(404).json({ error: 'Not found' }); return; }
        if (booking.userId !== req.user!.id && req.user!.role !== 'ADMIN') { res.status(403).json({ error: 'Forbidden' }); return; }

        await db.update(bookings).set({ status: 'CANCELLED' }).where(eq(bookings.id, id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed to cancel booking' }); }
});

// Periods
app.get('/api/periods', authenticate, async (req, res) => {
    const allPeriods = await db.query.periods.findMany();
    res.json(allPeriods);
});

// Holidays
app.get('/api/holidays', authenticate, async (req, res) => {
    const allHolidays = await db.query.holidays.findMany({ orderBy: (holidays, { asc }) => [asc(holidays.date)] });
    res.json(allHolidays);
});
app.post('/api/holidays', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.insert(holidays).values(req.body);
        res.json(req.body);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.delete('/api/holidays/:id', authenticate, ensureAdmin, async (req, res) => {
    try {
        await db.delete(holidays).where(eq(holidays.id, Number(req.params.id)));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Blackouts
app.get('/api/blackouts', authenticate, async (req, res) => {
    const all = await db.query.blackouts.findMany({ orderBy: (blackouts, { asc }) => [asc(blackouts.date)] });
    res.json(all);
});
app.post('/api/blackouts', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        const data = { ...req.body, id: createId() };
        await db.insert(blackouts).values(data);
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/blackouts/range', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        const { startDate, endDate, roomId, reason } = req.body;
        const blockId = createId();
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');

        let current = start;
        const newBlackouts = [];

        while (current <= end) {
            newBlackouts.push({
                id: createId(),
                date: formatToYyyyMmDd(current),
                roomId: roomId === 'all' ? null : roomId, // Handle 'all' logic
                reason,
                blockId
            });
            current = addDays(current, 1);
        }

        if (newBlackouts.length > 0) {
            await db.insert(blackouts).values(newBlackouts);
        }

        res.json({ success: true, count: newBlackouts.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create blackout range' });
    }
});

app.delete('/api/blackouts/range/:blockId', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        await db.delete(blackouts).where(eq(blackouts.blockId, req.params.blockId));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.delete('/api/blackouts/:id', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        await db.delete(blackouts).where(eq(blackouts.id, req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Audit Logs
app.get('/api/audit-logs', authenticate, async (req, res) => {
    try {
        const logs = await db.query.auditLogs.findMany({ orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)] });
        res.json(logs);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Dashboard
app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, userId, roomId, locationId, roomTypeId } = req.query;

        // Build generic filter
        const conditions = [eq(bookings.status, 'CONFIRMED')];

        if (startDate && typeof startDate === 'string') conditions.push(sql`${bookings.date} >= ${startDate}`);
        if (endDate && typeof endDate === 'string') conditions.push(sql`${bookings.date} <= ${endDate}`);
        if (userId && typeof userId === 'string') conditions.push(eq(bookings.userId, userId));
        if (roomId && typeof roomId === 'string') conditions.push(eq(bookings.roomId, roomId));
        // Note: locationId and roomTypeId filters would require joining tables if filtering AT DATABASE LEVEL.
        // For simplicity with this ORM setup, we might filter in memory or do more complex queries.
        // Let's fetch all confirmed bookings first and filter in memory for complex relations if volume is low, 
        // OR use advanced Drizzle queries. Given local sqlite, fetching all confirmed bookings and processing is fine for MVP.

        const allBookings = await db.query.bookings.findMany({
            where: and(...conditions),
            with: {
                room: { with: { location: true, roomType: true } },
                user: true
            }
        });

        // Filter by Room props if needed (since basic filtering above handled ID specific ones)
        let filteredBookings = allBookings;
        if (locationId) filteredBookings = filteredBookings.filter(b => b.room.locationId === locationId);
        if (roomTypeId) filteredBookings = filteredBookings.filter(b => b.room.roomTypeId === roomTypeId);


        const activeUsersCount = (await db.query.users.findMany({ where: eq(users.isActive, true) })).length;
        const activeRoomsCount = (await db.query.rooms.findMany({ where: eq(rooms.isActive, true) })).length;

        const todayStr = formatToYyyyMmDd(new Date());
        const upcomingBookings = filteredBookings.filter(b => b.date >= todayStr).length;

        // Aggregations
        const byLocation: Record<string, number> = {};
        const byRoomType: Record<string, number> = {};
        const byRoom: Record<string, number> = {};
        const byUser: Record<string, number> = {};
        const byDay: Record<string, number> = {};

        filteredBookings.forEach(b => {
            // Location
            const locName = b.room.location.name;
            byLocation[locName] = (byLocation[locName] || 0) + 1;

            // Room Type
            const typeName = b.room.roomType.name;
            byRoomType[typeName] = (byRoomType[typeName] || 0) + 1;

            // Room
            const roomName = b.room.name;
            byRoom[roomName] = (byRoom[roomName] || 0) + 1;

            // User
            const userName = b.user.name;
            byUser[userName] = (byUser[userName] || 0) + 1;

            // Day
            byDay[b.date] = (byDay[b.date] || 0) + 1;
        });

        // Format for frontend
        const formatStat = (obj: Record<string, number>) =>
            Object.entries(obj)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value);

        res.json({
            totalActiveUsers: activeUsersCount,
            totalRooms: activeRoomsCount,
            totalConfirmedBookings: filteredBookings.length,
            totalUpcomingBookings: upcomingBookings,
            bookingsByLocation: formatStat(byLocation),
            bookingsByRoomType: formatStat(byRoomType),
            bookingsPerRoom: formatStat(byRoom),
            topUsers: formatStat(byUser).slice(0, 10),
            bookingsByDay: formatStat(byDay).sort((a, b) => a.label.localeCompare(b.label)), // Date sort
        });
    } catch (e) {
        console.error('Dashboard Error:', e);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// Issues
app.get('/api/issues', authenticate, async (req, res) => {
    try {
        const issues = await db.query.issueReports.findMany({
            with: { room: { with: { location: true, roomType: true } }, user: true },
            orderBy: (issueReports, { desc }) => [desc(issueReports.createdAt)]
        });
        res.json(issues);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.post('/api/issues', authenticate, async (req, res) => {
    try {
        const data = { ...req.body, id: createId(), userId: req.user!.id, status: 'OPEN' };
        await db.insert(issueReports).values(data);
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});
app.put('/api/issues/:id', authenticate, ensureMaintenanceOrAdmin, async (req, res) => {
    try {
        await db.update(issueReports).set(req.body).where(eq(issueReports.id, req.params.id));
        res.json(req.body);
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
