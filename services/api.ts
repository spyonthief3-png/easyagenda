import { formatToYyyyMmDd, addDays } from '../utils/date';
import type { User, Room, Period, Booking, DayAvailability, Holiday, Blackout, AuditLog, DashboardStats, IssueReport, Location, RoomType } from '../types';
import { IssueStatus as IssueStatusEnum } from '../types';

// URL da API - usa variável de ambiente ou relativa em produção
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Armazena token em memória
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
    authToken = token;
};

const fetchClient = async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    
    // Adiciona token no header Authorization se disponível
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Request failed: ${response.statusText}`);
    }

    return response.json();
};

export const api = {
    // Locations
    getLocations: async (): Promise<Location[]> => fetchClient('/locations'),
    createLocation: async (data: Omit<Location, 'id'>, actorId: string): Promise<Location> => {
        return fetchClient('/locations', { method: 'POST', body: JSON.stringify(data) });
    },
    updateLocation: async (id: string, data: Partial<Location>, actorId: string): Promise<Location> => {
        return fetchClient(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteLocation: async (id: string, actorId: string): Promise<{ success: boolean }> => {
        return fetchClient(`/locations/${id}`, { method: 'DELETE' });
    },

    // Room Types
    getRoomTypes: async (): Promise<RoomType[]> => fetchClient('/room-types'),
    createRoomType: async (data: Omit<RoomType, 'id'>, actorId: string): Promise<RoomType> => fetchClient('/room-types', { method: 'POST', body: JSON.stringify(data) }),
    updateRoomType: async (id: string, data: Partial<RoomType>, actorId: string): Promise<RoomType> => fetchClient(`/room-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteRoomType: async (id: string, actorId: string): Promise<{ success: boolean }> => fetchClient(`/room-types/${id}`, { method: 'DELETE' }),

    // Rooms
    getRooms: async (includeInactive = false): Promise<Room[]> => {
        // Backend returns all rooms? check logic.
        return fetchClient('/rooms');
    },
    createRoom: async (roomData: any, actorId: string): Promise<Room> => {
        return fetchClient('/rooms', { method: 'POST', body: JSON.stringify(roomData) });
    },
    updateRoom: async (roomId: string, roomData: Partial<Room>, actorId: string): Promise<Room> => {
        return fetchClient(`/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(roomData) });
    },
    deleteRoom: async (roomId: string, actorId: string): Promise<{ success: boolean }> => {
        return fetchClient(`/rooms/${roomId}`, { method: 'DELETE' });
    },

    // Users
    getUsers: async (): Promise<User[]> => fetchClient('/users'),
    createUser: async (userData: Omit<User, 'id'>, actorId: string): Promise<User> => fetchClient('/users', { method: 'POST', body: JSON.stringify(userData) }),
    updateUser: async (userId: string, userData: Partial<User>, actorId: string): Promise<User> => fetchClient(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }),
    deleteUser: async (userId: string, actorId: string): Promise<{ success: boolean }> => fetchClient(`/users/${userId}`, { method: 'DELETE' }),
    changePassword: async (userId: string, oldPass: string, newPass: string, actorId: string): Promise<{ success: boolean }> => {
        return fetchClient(`/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ oldPass, newPass }) });
    },

    // Periods
    getPeriods: async (): Promise<Period[]> => fetchClient('/periods'),

    // Holidays
    getHolidays: async (): Promise<Holiday[]> => fetchClient('/holidays'),
    createHoliday: async (holidayData: Omit<Holiday, 'id'>, actorId: string): Promise<Holiday> => fetchClient('/holidays', { method: 'POST', body: JSON.stringify(holidayData) }),
    deleteHoliday: async (holidayId: number, actorId: string): Promise<{ success: boolean }> => fetchClient(`/holidays/${holidayId}`, { method: 'DELETE' }),

    // Blackouts
    getBlackouts: async (): Promise<Blackout[]> => fetchClient('/blackouts'),
    createBlackout: async (blackoutData: Omit<Blackout, 'id'>, actorId: string): Promise<Blackout> => fetchClient('/blackouts', { method: 'POST', body: JSON.stringify(blackoutData) }),
    deleteBlackout: async (blackoutId: string, actorId: string): Promise<{ success: boolean }> => fetchClient(`/blackouts/${blackoutId}`, { method: 'DELETE' }),
    createDateRangeBlackout: async (details: { startDate: string, endDate: string, roomId: string, reason: string }, actorId: string): Promise<{ success: boolean }> => {
        return fetchClient('/blackouts/range', { method: 'POST', body: JSON.stringify(details) });
    },
    deleteDateRangeBlackout: async (blockId: string, actorId: string): Promise<{ success: boolean }> => {
        return fetchClient(`/blackouts/range/${blockId}`, { method: 'DELETE' });
    },

    // Audit Logs
    getAuditLogs: async (): Promise<AuditLog[]> => fetchClient('/audit-logs'),

    // Bookings
    getCalendarAvailability: async (dateOrStr: Date | string, currentUserId: string): Promise<DayAvailability> => {
        const date = typeof dateOrStr === 'string' ? new Date(dateOrStr + 'T00:00:00') : dateOrStr;
        const dateStr = formatToYyyyMmDd(date);
        return fetchClient(`/availability?date=${dateStr}`);
    },
    getCalendarAvailabilityForRange: async (startDate: Date, endDate: Date, currentUserId: string): Promise<Record<string, DayAvailability>> => {
        const rangeData: Record<string, DayAvailability> = {};
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = formatToYyyyMmDd(currentDate);
            // Sequential is fine for now, or use Promise.all
            rangeData[dateStr] = await api.getCalendarAvailability(currentDate, currentUserId);
            currentDate = addDays(currentDate, 1);
        }
        return rangeData;
    },
    createBooking: async (bookingDetails: { roomId: string, date: string, periodCode: string, title: string, notes?: string, userId: string }): Promise<Booking> => {
        return fetchClient('/bookings', { method: 'POST', body: JSON.stringify(bookingDetails) });
    },
    getMyBookings: async (userId: string): Promise<Booking[]> => fetchClient('/bookings/my'),
    getAllBookings: async (): Promise<Booking[]> => fetchClient('/bookings'),
    cancelBooking: async (bookingId: string, userId: string, reason: string): Promise<{ success: boolean }> => {
        return fetchClient(`/bookings/${bookingId}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
    },

    // Dashboard
    getDashboardStats: async (filters: any = {}): Promise<DashboardStats> => {
        // Pass filters as query params
        const params = new URLSearchParams(filters).toString();
        return fetchClient(`/dashboard?${params}`);
    },

    // Issue Reports
    getIssueReports: async (filters: { status?: IssueStatusEnum } = {}): Promise<IssueReport[]> => {
        const params = new URLSearchParams(filters as any).toString();
        return fetchClient(`/issues?${params}`);
    },
    createIssueReport: async (reportData: any, actorId: string): Promise<IssueReport> => {
        return fetchClient('/issues', { method: 'POST', body: JSON.stringify(reportData) });
    },
    updateIssueReport: async (reportId: string, updateData: any, actorId: string): Promise<IssueReport> => {
        return fetchClient(`/issues/${reportId}`, { method: 'PUT', body: JSON.stringify(updateData) });
    },

    // Auth
    login: async (credentials: { email: string, password: string }): Promise<{ user: User, token: string }> => {
        return fetchClient('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    },
    logout: async (): Promise<{ success: boolean }> => {
        return fetchClient('/auth/logout', { method: 'POST' });
    },
    getCurrentUser: async (): Promise<User> => {
        return fetchClient('/auth/me');
    },
};