export enum ROLE {
    USER = 'USER',
    ADMIN = 'ADMIN',
    MAINTENANCE = 'MAINTENANCE',
}

export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    photoUrl?: string;
    passwordHash?: string;
    role: ROLE;
    isActive?: boolean;
}

export interface Location {
    id: string;
    name: string;
}

export interface RoomType {
    id: string;
    name: string;
}

export interface Room {
    id: string;
    name: string;
    location: Location;
    roomType: RoomType;
    capacity: number;
    resources: Record<string, any>;
    isActive: boolean;
}

export interface Period {
    id: number;
    code: string;
    label: string;
    startTime: string;
    endTime: string;
}

export enum BookingStatus {
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED'
}

export interface Booking {
    id: string;
    room: Room;
    user: User;
    date: string; // YYYY-MM-DD
    period: Period;
    title: string;
    notes?: string;
    status: BookingStatus;
}

export enum AvailabilityStatus {
    AVAILABLE = 'AVAILABLE',
    BOOKED = 'BOOKED',
    MY_BOOKING = 'MY_BOOKING',
    BLACKOUT = 'BLACKOUT',
    HOLIDAY = 'HOLIDAY',
    CLOSED = 'CLOSED', // For Sundays
}

export interface AvailabilitySlot {
    status: AvailabilityStatus;
    /** Presente apenas em BOOKED ou MY_BOOKING */
    booking?: {
        id: string;
        title: string;
        user: { name: string };
    };
    /** Presente apenas em BLACKOUT */
    blackout?: {
        reason: string;
        blockId?: string;
    };
    /** Presente apenas em HOLIDAY */
    holiday?: {
        name: string;
    };
}

export type DayAvailability = Record<string, Record<string, AvailabilitySlot>>; 

export interface Holiday {
    id: number;
    date: string; // YYYY-MM-DD
    name: string;
}

export interface Blackout {
    id: string;
    date: string; // YYYY-MM-DD
    periodId?: number | null;
    roomId?: string | null;
    reason: string;
    blockId?: string;
}

export type AuditAction = 
    | 'CREATE_BOOKING' 
    | 'CANCEL_BOOKING' 
    | 'CREATE_ROOM' 
    | 'UPDATE_ROOM' 
    | 'DELETE_ROOM' 
    | 'CREATE_LOCATION' 
    | 'UPDATE_LOCATION' 
    | 'DELETE_LOCATION' 
    | 'CREATE_ROOM_TYPE' 
    | 'UPDATE_ROOM_TYPE' 
    | 'DELETE_ROOM_TYPE' 
    | 'CREATE_USER' 
    | 'UPDATE_USER' 
    | 'DELETE_USER' 
    | 'CHANGE_PASSWORD' 
    | 'CREATE_HOLIDAY' 
    | 'DELETE_HOLIDAY' 
    | 'CREATE_BLACKOUT' 
    | 'DELETE_BLACKOUT' 
    | 'CREATE_DATE_RANGE_BLACKOUT' 
    | 'DELETE_DATE_RANGE_BLACKOUT' 
    | 'CREATE_ISSUE_REPORT' 
    | 'UPDATE_ISSUE_REPORT';

export interface AuditLog {
    id: number;
    actor: { id: string; name: string };
    action: AuditAction;
    entity: 'booking' | 'room' | 'user' | 'location' | 'roomType' | 'holiday' | 'blackout' | 'issueReport';
    entityId: string;
    createdAt: string;
}

export interface StatItem {
    label: string;
    value: number;
}

export interface DashboardStats {
    totalActiveUsers: number;
    totalRooms: number;
    totalConfirmedBookings: number;
    totalUpcomingBookings: number;
    bookingsPerRoom: StatItem[];
    topUsers: StatItem[];
    bookingsByDay: StatItem[];
    bookingsByLocation: StatItem[];
    bookingsByRoomType: StatItem[];
}

export enum IssueCategory {
    CLEANLINESS = 'CLEANLINESS',
    EQUIPMENT_MALFUNCTION = 'EQUIPMENT_MALFUNCTION',
    DAMAGED_PROPERTY = 'DAMAGED_PROPERTY',
    OTHER = 'OTHER',
}

export enum IssueStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
}

export interface IssueReport {
    id: string;
    room: Room;
    user: { id: string; name: string; email: string };
    category: IssueCategory;
    patrimonyNumber?: string;
    description: string;
    photoUrl?: string;
    status: IssueStatus;
    resolutionNotes?: string;
    createdAt: string;
    updatedAt: string;
    resolvedAt?: string;
}