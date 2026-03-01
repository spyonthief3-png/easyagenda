import React from 'react';
import type { DayAvailability, Room } from '../types';
import { AvailabilityStatus } from '../types';
import { getWeekDays, formatToYyyyMmDd } from '../utils/date';

interface WeekViewProps {
    selectedDate: Date;
    availability: Record<string, DayAvailability>;
    rooms: Room[];
    onDayClick: (date: Date) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDate, availability, rooms, onDayClick }) => {
    const weekDays = getWeekDays(selectedDate);
    const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-7 gap-4">
                {weekDays.map((day, index) => {
                    const dateStr = formatToYyyyMmDd(day);
                    const dayAvailability = availability[dateStr];
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
                    
                    let bgColor = 'bg-gray-100 hover:bg-gray-200';
                    if (totalSlots > 0) {
                       if (availabilityPercentage > 50) bgColor = 'bg-green-100 hover:bg-green-200';
                       else if (availabilityPercentage > 0) bgColor = 'bg-yellow-100 hover:bg-yellow-200';
                       else bgColor = 'bg-red-100 hover:bg-red-200';
                    }
                    
                    const isToday = formatToYyyyMmDd(new Date()) === dateStr;

                    return (
                        <div 
                            key={dateStr}
                            onClick={() => onDayClick(day)}
                            className={`p-4 rounded-md cursor-pointer transition-colors text-center h-40 flex flex-col justify-between ${bgColor}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">{weekDayLabels[index]}</span>
                                <span className={`font-bold ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>{day.getDate()}</span>
                            </div>
                            <div className="mt-2">
                                {totalSlots > 0 ? (
                                    <>
                                        <p className="text-lg font-bold text-gray-700">{availableSlots}</p>
                                        <p className="text-xs text-gray-500">horários livres</p>
                                    </>
                                ) : (
                                     <p className="text-sm text-gray-400">Sem dados</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeekView;