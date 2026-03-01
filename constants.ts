import { AvailabilityStatus } from './types';

export const STATUS_COLORS: Record<AvailabilityStatus, { bg: string, text: string, hover: string, border: string }> = {
    [AvailabilityStatus.AVAILABLE]: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        hover: 'hover:bg-green-200',
        border: 'border-green-200'
    },
    [AvailabilityStatus.BOOKED]: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        hover: 'hover:bg-red-100',
        border: 'border-red-200'
    },
    [AvailabilityStatus.MY_BOOKING]: {
        bg: 'bg-blue-200',
        text: 'text-blue-900',
        hover: 'hover:bg-blue-300',
        border: 'border-blue-300'
    },
    [AvailabilityStatus.BLACKOUT]: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        hover: 'hover:bg-yellow-100',
        border: 'border-yellow-200'
    },
    [AvailabilityStatus.HOLIDAY]: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        hover: 'hover:bg-purple-100',
        border: 'border-purple-200'
    },
    [AvailabilityStatus.CLOSED]: {
        bg: 'bg-gray-200',
        text: 'text-gray-500',
        hover: 'hover:bg-gray-200',
        border: 'border-gray-300'
    },
};

export const STATUS_LABELS: Record<AvailabilityStatus, string> = {
    [AvailabilityStatus.AVAILABLE]: 'Disponível',
    [AvailabilityStatus.BOOKED]: 'Ocupado',
    [AvailabilityStatus.MY_BOOKING]: 'Minha Reserva',
    [AvailabilityStatus.BLACKOUT]: 'Bloqueado',
    [AvailabilityStatus.HOLIDAY]: 'Feriado',
    [AvailabilityStatus.CLOSED]: 'Fechado',
};