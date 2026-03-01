// Validação de schemas com Zod
import { z } from 'zod';

// Login
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória')
});

// Criar usuário (admin)
export const createUserSchema = z.object({
    username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres'),
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    role: z.enum(['USER', 'ADMIN', 'MAINTENANCE']).optional().default('USER'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
    isActive: z.boolean().optional().default(true)
});

// Atualizar usuário
export const updateUserSchema = z.object({
    username: z.string().min(3).optional(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(['USER', 'ADMIN', 'MAINTENANCE']).optional(),
    photoUrl: z.string().url().optional(),
    isActive: z.boolean().optional()
});

// Alterar senha
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
});

// Booking
export const createBookingSchema = z.object({
    roomId: z.string().min(1, 'Sala obrigatória'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)'),
    periodCode: z.string().min(1, 'Período obrigatório'),
    title: z.string().min(1, 'Título obrigatório').max(200, 'Título muito longo'),
    notes: z.string().max(500, 'Notas muito longas').optional()
});

// Room
export const createRoomSchema = z.object({
    name: z.string().min(1, 'Nome da sala obrigatório'),
    locationId: z.string().min(1, 'Local obrigatório'),
    roomTypeId: z.string().min(1, 'Tipo de sala obrigatório'),
    capacity: z.number().int().positive('Capacidade deve ser positiva'),
    resources: z.record(z.unknown()).optional().default({}),
    isActive: z.boolean().optional().default(true)
});

// Location
export const createLocationSchema = z.object({
    name: z.string().min(1, 'Nome do local obrigatório')
});

// Room Type
export const createRoomTypeSchema = z.object({
    name: z.string().min(1, 'Nome do tipo obrigatório')
});

// Holiday
export const createHolidaySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    name: z.string().min(1, 'Nome do feriado obrigatório')
});

// Blackout
export const createBlackoutSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    periodId: z.number().int().optional(),
    roomId: z.string().optional(),
    reason: z.string().min(1, 'Motivo obrigatório')
});

// Blackout range
export const createBlackoutRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida'),
    roomId: z.string().optional(),
    reason: z.string().min(1, 'Motivo obrigatório')
});

// Issue Report
export const createIssueSchema = z.object({
    roomId: z.string().min(1, 'Sala obrigatória'),
    category: z.enum(['CLEANLINESS', 'EQUIPMENT_MALFUNCTION', 'DAMAGED_PROPERTY', 'OTHER']),
    patrimonyNumber: z.string().optional(),
    description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000),
    photoUrl: z.string().url().optional()
});

// Update Issue
export const updateIssueSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
    resolutionNotes: z.string().optional()
});

// Helper para validar e retornar erros
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        return { success: false, error: errors } as { success: false; error: string };
    }
    return { success: true, data: result.data } as { success: true; data: T };
}
