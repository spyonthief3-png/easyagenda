import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const ROLE = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    MAINTENANCE: 'MAINTENANCE',
} as const;

export const BOOKING_STATUS = {
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
} as const;

export const ISSUE_CATEGORY = {
    CLEANLINESS: 'CLEANLINESS',
    EQUIPMENT_MALFUNCTION: 'EQUIPMENT_MALFUNCTION',
    DAMAGED_PROPERTY: 'DAMAGED_PROPERTY',
    OTHER: 'OTHER',
} as const;

export const ISSUE_STATUS = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
} as const;

// Helper for boolean
const boolean = (name: string) => integer(name, { mode: 'boolean' });

// Tables

export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    username: text('username').notNull().unique(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    photoUrl: text('photo_url'),
    passwordHash: text('password_hash'),
    role: text('role').notNull().default(ROLE.USER),
    isActive: boolean('is_active').default(true),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const locations = sqliteTable('locations', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
});

export const roomTypes = sqliteTable('room_types', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
});

export const rooms = sqliteTable('rooms', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    locationId: text('location_id').notNull().references(() => locations.id),
    roomTypeId: text('room_type_id').notNull().references(() => roomTypes.id),
    capacity: integer('capacity').notNull(),
    resources: text('resources', { mode: 'json' }).notNull(), // Stored as JSON string
    isActive: boolean('is_active').default(true),
});

export const periods = sqliteTable('periods', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
});

export const bookings = sqliteTable('bookings', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    roomId: text('room_id').notNull().references(() => rooms.id),
    userId: text('user_id').notNull().references(() => users.id),
    date: text('date').notNull(), // YYYY-MM-DD
    periodId: integer('period_id').notNull().references(() => periods.id),
    title: text('title').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default(BOOKING_STATUS.CONFIRMED),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const holidays = sqliteTable('holidays', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), // YYYY-MM-DD
    name: text('name').notNull(),
});

export const blackouts = sqliteTable('blackouts', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    date: text('date').notNull(), // YYYY-MM-DD
    periodId: integer('period_id').references(() => periods.id),
    roomId: text('room_id').references(() => rooms.id),
    reason: text('reason').notNull(),
    blockId: text('block_id'), // For grouping blackouts
});

export const issueReports = sqliteTable('issue_reports', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    roomId: text('room_id').notNull().references(() => rooms.id),
    userId: text('user_id').notNull().references(() => users.id),
    category: text('category').notNull(),
    patrimonyNumber: text('patrimony_number'),
    description: text('description').notNull(),
    photoUrl: text('photo_url'),
    status: text('status').notNull().default(ISSUE_STATUS.OPEN),
    resolutionNotes: text('resolution_notes'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: text('resolved_at'),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    actorId: text('actor_id').notNull().references(() => users.id),
    actorName: text('actor_name').notNull(), // Snapshot in case user changes name
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id').notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// RELATIONS
import { relations } from 'drizzle-orm';

export const roomsRelations = relations(rooms, ({ one, many }) => ({
    location: one(locations, {
        fields: [rooms.locationId],
        references: [locations.id],
    }),
    roomType: one(roomTypes, {
        fields: [rooms.roomTypeId],
        references: [roomTypes.id],
    }),
    bookings: many(bookings),
    blackouts: many(blackouts),
    issueReports: many(issueReports),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
    rooms: many(rooms),
}));

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
    rooms: many(rooms),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
    room: one(rooms, {
        fields: [bookings.roomId],
        references: [rooms.id],
    }),
    user: one(users, {
        fields: [bookings.userId],
        references: [users.id],
    }),
    period: one(periods, {
        fields: [bookings.periodId],
        references: [periods.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    bookings: many(bookings),
    issueReports: many(issueReports),
    auditLogs: many(auditLogs),
}));

export const periodsRelations = relations(periods, ({ many }) => ({
    bookings: many(bookings),
    blackouts: many(blackouts),
}));

export const blackoutsRelations = relations(blackouts, ({ one }) => ({
    room: one(rooms, {
        fields: [blackouts.roomId],
        references: [rooms.id],
    }),
    period: one(periods, {
        fields: [blackouts.periodId],
        references: [periods.id],
    }),
}));

export const issueReportsRelations = relations(issueReports, ({ one }) => ({
    room: one(rooms, {
        fields: [issueReports.roomId],
        references: [rooms.id],
    }),
    user: one(users, {
        fields: [issueReports.userId],
        references: [users.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    actor: one(users, {
        fields: [auditLogs.actorId],
        references: [users.id],
    }),
}));

