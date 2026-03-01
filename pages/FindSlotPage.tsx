
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import type { Room, Period, DayAvailability, Location, RoomType } from '../types';
import { AvailabilityStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import DatePicker from '../components/DatePicker';
import BookingModal from '../components/BookingModal';
import { formatToYyyyMmDd, addDays, subDays } from '../utils/date';
import FilterBar, { Filters } from '../components/FilterBar';

interface AvailableSlot {
    roomId: string;
    roomName: string;
    roomLocation: string;
    periodId: number;
    periodCode: string;
    periodLabel: string;
    periodTime: string;
}

const FindSlotPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [filters, setFilters] = useState<Filters>({ search: '', locationId: '', roomTypeId: '' });
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

    const filteredRooms = useMemo(() => {
        return allRooms.filter(room => {
            return (
                (filters.locationId === '' || room.location.id === filters.locationId) &&
                (filters.roomTypeId === '' || room.roomType.id === filters.roomTypeId)
            );
        });
    }, [allRooms, filters]);

    const fetchAvailableSlots = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const availabilityData: DayAvailability = await api.getCalendarAvailability(selectedDate, user.id);
            const slots: AvailableSlot[] = [];
            
            const roomsToScan = filteredRooms.length > 0 ? filteredRooms : allRooms;

            for (const room of roomsToScan) {
                if (!availabilityData[room.id]) continue;
                for (const period of periods) {
                    const slotInfo = availabilityData[room.id][period.code];
                    if (slotInfo && slotInfo.status === AvailabilityStatus.AVAILABLE) {
                        slots.push({
                            roomId: room.id,
                            roomName: room.name,
                            roomLocation: room.location.name,
                            periodId: period.id,
                            periodCode: period.code,
                            periodLabel: period.label,
                            periodTime: `${period.startTime} - ${period.endTime}`,
                        });
                    }
                }
            }
            setAvailableSlots(slots);
        } catch (error) {
            console.error("Failed to fetch available slots:", error);
            setAvailableSlots([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, user, periods, filteredRooms, allRooms]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [roomsData, periodsData, locationsData, typesData] = await Promise.all([
                    api.getRooms(), 
                    api.getPeriods(),
                    api.getLocations(),
                    api.getRoomTypes()
                ]);
                setAllRooms(roomsData);
                setPeriods(periodsData);
                setLocations(locationsData);
                setRoomTypes(typesData);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (periods.length > 0 && allRooms.length > 0) {
            fetchAvailableSlots();
        }
    }, [fetchAvailableSlots, periods, allRooms]);

    const handleOpenModal = (slot: AvailableSlot) => {
        setSelectedSlot(slot);
        setIsModalOpen(true);
    };

    const handleSubmitBooking = async (title: string, notes: string) => {
        if (!selectedSlot || !user) return;
        setIsSubmitting(true);
        try {
            await api.createBooking({
                roomId: selectedSlot.roomId,
                periodCode: selectedSlot.periodCode,
                date: formatToYyyyMmDd(selectedDate),
                title, notes, userId: user.id,
            });
            setIsModalOpen(false);
            setSelectedSlot(null);
            fetchAvailableSlots(); // Refresh list
        } catch (error: any) {
            alert(`Falha ao agendar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const groupedSlots = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.roomId]) {
            acc[slot.roomId] = {
                roomName: slot.roomName,
                roomLocation: slot.roomLocation,
                periods: [],
            };
        }
        acc[slot.roomId].periods.push(slot);
        return acc;
    }, {} as Record<string, { roomName: string, roomLocation: string, periods: AvailableSlot[] }>);

    const handlePrevDay = () => {
        setSelectedDate(prev => subDays(prev, 1));
    };

    const handleNextDay = () => {
        setSelectedDate(prev => addDays(prev, 1));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Encontrar Horário</h1>
                <DatePicker 
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    onPrev={handlePrevDay}
                    onNext={handleNextDay}
                />
            </div>

            <FilterBar 
                locations={locations} 
                roomTypes={roomTypes} 
                onFilterChange={setFilters}
                showLocation
                showRoomType
            />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Buscando opções...</p>
                </div>
            ) : Object.keys(groupedSlots).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedSlots).map(([roomId, data]) => (
                         <div key={roomId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                             <div className="mb-4">
                                <h2 className="text-lg font-bold text-gray-900">{data.roomName}</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{data.roomLocation}</p>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {data.periods.map(slot => (
                                    <div key={slot.periodId} className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center transition-all hover:border-indigo-200">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{slot.periodLabel}</p>
                                        <p className="text-xs text-gray-500 font-medium mb-3">{slot.periodTime}</p>
                                        <button
                                            onClick={() => handleOpenModal(slot)}
                                            className="w-full bg-white text-indigo-600 border border-indigo-200 font-bold py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-xs shadow-sm active:scale-95"
                                        >
                                            Agendar
                                        </button>
                                    </div>
                                ))}
                             </div>
                         </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-700">Nenhum horário livre</h2>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">Tente selecionar outro dia ou ajustar os filtros de busca.</p>
                </div>
            )}
            
            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitBooking}
                room={allRooms.find(r => r.id === selectedSlot?.roomId)}
                period={periods.find(p => p.id === selectedSlot?.periodId)}
                date={selectedDate}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default FindSlotPage;
