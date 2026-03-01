import React from 'react';
import type { DayAvailability, Room } from '../types';
import { AvailabilityStatus } from '../types';
import { getMonthGridDays, formatToYyyyMmDd } from '../utils/date';

interface MonthViewProps {
    selectedDate: Date;
    availability: Record<string, DayAvailability>;
    rooms: Room[];
    onDayClick: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ selectedDate, availability, rooms, onDayClick }) => {
    const monthDays = getMonthGridDays(selectedDate);
    const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const currentMonth = selectedDate.getMonth();

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
                {weekDayLabels.map(label => <div key={label}>{label}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                    const dateStr = formatToYyyyMmDd(day);
                    const dayAvailability = availability[dateStr];
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isToday = formatToYyyyMmDd(new Date()) === dateStr;
                    
                    let totalSlots = 0;
                    let availableSlots = 0;

                    if (dayAvailability && rooms.length > 0) {
                         for (const room of rooms) {
                            if (dayAvailability[room.id]) {
                                for (const periodCode in dayAvailability[room.id]) {
                                    totalSlots++;
                                    const slot = dayAvailability[room.id][periodCode];
                                    if (slot.status === AvailabilityStatus.AVAILABLE) {
                                        availableSlots++;
                                    }
                                }
                            }
                        }
                    }
                    
                    const availabilityPercentage = totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0;
                    
                    let bgColor = 'bg-gray-50 hover:bg-gray-200';
                    if (totalSlots > 0) {
                       if (availabilityPercentage === 100) bgColor = 'bg-green-100 hover:bg-green-200';
                       else if (availabilityPercentage > 0) bgColor = 'bg-yellow-100 hover:bg-yellow-200';
                       else bgColor = 'bg-red-100 hover:bg-red-200';
                    }
                     if (!isCurrentMonth) {
                        bgColor = 'bg-white hover:bg-gray-100';
                    }

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDayClick(day)}
                            className={`h-24 p-2 border rounded-md cursor-pointer transition-colors ${bgColor}`}
                        >
                            <span className={`
                                ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
                                ${isToday ? 'bg-indigo-600 text-white rounded-full px-2 py-1' : ''}
                            `}>
                                {day.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;