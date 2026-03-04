import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
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
    photoUrl: text('photoUrl'), // Real column in Turso: photoUrl
    passwordHash: text('passwordHash'), // Real column in Turso: passwordHash
    role: text('role').notNull().default(ROLE.USER),
    isActive: boolean('isActive').default(true), // Real column in Turso: isActive
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`), // Real column in Turso: createdAt
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
    locationId: text('locationId').notNull().references(() => locations.id),
    roomTypeId: text('roomTypeId').notNull().references(() => roomTypes.id),
    capacity: integer('capacity').notNull(),
    resources: text('resources', { mode: 'json' }).notNull(), 
    isActive: boolean('isActive').default(true),
});

export const periods = sqliteTable('periods', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    startTime: text('startTime').notNull(),
    endTime: text('endTime').notNull(),
});

export const bookings = sqliteTable('bookings', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    roomId: text('roomId').notNull().references(() => rooms.id),
    userId: text('userId').notNull().references(() => users.id),
    date: text('date').notNull(), 
    periodId: integer('periodId').notNull().references(() => periods.id),
    title: text('title').notNull(),
    notes: text('notes'),
    status: text('status').notNull().default(BOOKING_STATUS.CONFIRMED),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
});

export const holidays = sqliteTable('holidays', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), 
    name: text('name').notNull(),
});

export const blackouts = sqliteTable('blackouts', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    date: text('date').notNull(), 
    periodId: integer('periodId').references(() => periods.id),
    roomId: text('roomId').references(() => rooms.id),
    reason: text('reason').notNull(),
    blockId: text('blockId'), 
});

export const issueReports = sqliteTable('issue_reports', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    roomId: text('roomId').notNull().references(() => rooms.id),
    userId: text('userId').notNull().references(() => users.id),
    category: text('category').notNull(),
    patrimonyNumber: text('patrimonyNumber'),
    description: text('description').notNull(),
    photoUrl: text('photoUrl'),
    status: text('status').notNull().default(ISSUE_STATUS.OPEN),
    resolutionNotes: text('resolutionNotes'),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`),
    resolvedAt: text('resolvedAt'),
});

export const auditLogs = sqliteTable('audit_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    actorId: text('actorId').notNull().references(() => users.id),
    actorName: text('actorName').notNull(), 
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entityId').notNull(),
    createdAt: text('createdAt').default(sql`CURRENT_TIMESTAMP`),
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
