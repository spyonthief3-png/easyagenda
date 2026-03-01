import React, { useState } from 'react';
import type { Room, Period, DayAvailability } from '../types';
import { AvailabilityStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface BookingGridProps {
    rooms: Room[];
    periods: Period[];
    availability: DayAvailability | null;
    onSelectSlot: (roomId: string, periodCode: string) => void;
    onReportProblem: (roomId: string, roomName: string) => void;
}

const BookingGrid: React.FC<BookingGridProps> = ({ rooms, periods, availability, onSelectSlot, onReportProblem }) => {
    const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

    const toggleRoom = (roomId: string) => {
        setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
    };

    if (!availability) {
        return (
            <div className="flex flex-col justify-center items-center p-10 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-600 font-medium">Carregando disponibilidade...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {/* MOBILE VIEW: Card List with Accordion */}
            <div className="md:hidden space-y-3">
                {rooms.map(room => {
                    const isExpanded = expandedRooms[room.id];
                    return (
                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div 
                                className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                                onClick={() => toggleRoom(room.id)}
                            >
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900">{room.name}</div>
                                    <div className="text-xs text-gray-500">{room.roomType.name} • {room.location.name}</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onReportProblem(room.id, room.name); }}
                                        className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <svg 
                                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                                    <div className="grid grid-cols-2 gap-2">
                                        {periods.map(period => {
                                            const slot = availability[room.id]?.[period.code];
                                            const status = slot?.status || AvailabilityStatus.CLOSED;
                                            const colors = STATUS_COLORS[status];
                                            const isAvailable = status === AvailabilityStatus.AVAILABLE;

                                            return (
                                                <button
                                                    key={period.id}
                                                    onClick={() => isAvailable && onSelectSlot(room.id, period.code)}
                                                    disabled={!isAvailable}
                                                    className={`p-3 rounded-lg border text-left flex flex-col transition-all active:scale-95 ${colors.bg} ${colors.text} ${colors.border} ${!isAvailable ? 'opacity-70 grayscale-[0.3]' : 'shadow-sm'}`}
                                                >
                                                    <span className="font-bold text-[10px] uppercase tracking-wider">{period.label}</span>
                                                    <span className="text-xxs opacity-70 mb-1">{period.startTime} - {period.endTime}</span>
                                                    <span className="font-bold text-xs truncate w-full">
                                                        {slot?.booking?.title || slot?.blackout?.reason || slot?.holiday?.name || STATUS_LABELS[status]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Informações da Sala</div>
                                    <div className="mt-1 text-xs text-gray-600">
                                        Capacidade: {room.capacity} lugares | {Object.entries(room.resources).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Sem recursos'}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* DESKTOP VIEW: Traditional Grid */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Sala
                            </th>
                            {periods.map(period => (
                                <th key={period.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex flex-col items-center">
                                        <span>{period.label}</span>
                                        <span className="font-normal text-gray-400 text-xxs">{period.startTime} - {period.endTime}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rooms.map(room => (
                            <tr key={room.id} className="hover:bg-gray-50">
                                <td className="sticky left-0 bg-white hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex justify-between items-start">
                                        <div className="max-w-[150px]">
                                            <div className="font-bold text-base text-gray-800 truncate">{room.name}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5 truncate uppercase tracking-tighter">{room.roomType.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5 truncate">{room.location.name}</div>
                                        </div>
                                        <button 
                                            onClick={() => onReportProblem(room.id, room.name)}
                                            className="ml-2 p-1 text-yellow-500 hover:bg-yellow-100 rounded-full transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                                {periods.map(period => {
                                    const slot = availability[room.id]?.[period.code];
                                    const status = slot?.status || AvailabilityStatus.CLOSED;
                                    const colors = STATUS_COLORS[status];
                                    const isClickable = status === AvailabilityStatus.AVAILABLE;

                                    return (
                                        <td key={period.id} className="px-1 py-1 min-w-[120px]">
                                            <button
                                                onClick={() => isClickable && onSelectSlot(room.id, period.code)}
                                                disabled={!isClickable}
                                                className={`w-full h-20 p-2 rounded border text-center flex flex-col justify-center items-center transition-all ${colors.bg} ${colors.text} ${colors.border} ${isClickable ? `${colors.hover} cursor-pointer hover:shadow-sm` : 'cursor-not-allowed opacity-80'}`}
                                            >
                                                <span className="font-bold text-[10px] uppercase tracking-tighter">{STATUS_LABELS[status]}</span>
                                                <span className="text-[10px] mt-1 font-medium truncate w-full">
                                                    {slot?.booking?.title || slot?.blackout?.reason || slot?.holiday?.name || ''}
                                                </span>
                                                <span className="text-[9px] opacity-60 truncate w-full">
                                                    {slot?.booking?.user.name || ''}
                                                </span>
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BookingGrid;