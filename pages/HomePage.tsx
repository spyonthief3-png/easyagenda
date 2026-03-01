import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatToYyyyMmDd, addDays, subDays, addMonths, getWeekDays, getMonthGridDays } from '../utils/date';
import { api } from '../services/api';
import type { Room, Period, DayAvailability, IssueCategory, Location, RoomType } from '../types';
import { useAuth } from '../hooks/useAuth';
import DatePicker from '../components/DatePicker';
import BookingGrid from '../components/BookingGrid';
import BookingModal from '../components/BookingModal';
import ReportIssueModal from '../components/ReportIssueModal';
import FilterBar, { Filters } from '../components/FilterBar';
import WeekView from '../components/WeekView';
import MonthView from '../components/MonthView';

type ViewMode = 'day' | 'week' | 'month';

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    
    // Data stores
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtering
    const [filters, setFilters] = useState<Filters>({ search: '', locationId: '', roomTypeId: ''});

    // Modals state
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ roomId: string; periodCode: string; date: Date } | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingRoom, setReportingRoom] = useState<{ id: string; name: string} | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    // Fetch calendar data based on view
    const fetchAvailability = useCallback(async (date: Date, view: ViewMode) => {
        if (!user) return;
        setIsLoading(true);

        try {
            let start: Date, end: Date;
            if (view === 'day') {
                start = end = date;
            } else if (view === 'week') {
                const weekDays = getWeekDays(date);
                start = weekDays[0];
                end = weekDays[6];
            } else { // month
                const monthDays = getMonthGridDays(date);
                start = monthDays[0];
                end = monthDays[monthDays.length - 1];
            }

            const data = await api.getCalendarAvailabilityForRange(start, end, user.id);
            setAvailability(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Failed to fetch availability:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial data fetch (rooms, periods, etc.)
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
    
    // Fetch availability when date or view changes
    useEffect(() => {
        fetchAvailability(selectedDate, viewMode);
    }, [selectedDate, viewMode, fetchAvailability]);

    const filteredRooms = useMemo(() => {
        return allRooms.filter(room => {
            const searchLower = filters.search.toLowerCase();
            return (
                (filters.search === '' || room.name.toLowerCase().includes(searchLower)) &&
                (filters.locationId === '' || room.location.id === filters.locationId) &&
                (filters.roomTypeId === '' || room.roomType.id === filters.roomTypeId)
            );
        });
    }, [allRooms, filters]);

    // Modal Handlers
    const handleSelectSlot = (roomId: string, periodCode: string, date: Date) => {
        setSelectedSlot({ roomId, periodCode, date });
        setIsBookingModalOpen(true);
    };

    const handleSubmitBooking = async (title: string, notes: string) => {
        if (!selectedSlot || !user) return;
        setIsSubmittingBooking(true);
        try {
            await api.createBooking({
                roomId: selectedSlot.roomId,
                periodCode: selectedSlot.periodCode,
                date: formatToYyyyMmDd(selectedSlot.date),
                title, notes, userId: user.id,
            });
            setIsBookingModalOpen(false);
            setSelectedSlot(null);
            fetchAvailability(selectedDate, viewMode); // Refresh grid
        } catch (error: any) {
            alert(`Falha ao agendar: ${error.message}`);
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const handleOpenReportModal = (roomId: string, roomName: string) => {
        setReportingRoom({ id: roomId, name: roomName });
        setIsReportModalOpen(true);
    };
    
    const handleSubmitReport = async (data: { category: IssueCategory; description: string; patrimony_number?: string; photo_url?: string; }) => {
        if (!reportingRoom || !user) return;
        setIsSubmittingReport(true);
        try {
            await api.createIssueReport({ ...data, roomId: reportingRoom.id }, user.id);
            alert('Problema reportado com sucesso!');
            setIsReportModalOpen(false);
            setReportingRoom(null);
        } catch (error: any) {
            alert(`Falha ao reportar problema: ${error.message}`);
        } finally {
            setIsSubmittingReport(false);
        }
    };
    
    // Date Navigation
    const handleDateNav = (direction: 'prev' | 'next') => {
        const d = selectedDate;
        const sign = direction === 'prev' ? -1 : 1;
        if (viewMode === 'day') setSelectedDate(addDays(d, sign));
        if (viewMode === 'week') setSelectedDate(addDays(d, 7 * sign));
        if (viewMode === 'month') setSelectedDate(addMonths(d, sign));
    }

    const renderView = () => {
        const dayAvailability = availability[formatToYyyyMmDd(selectedDate)] ?? null;
        switch (viewMode) {
            case 'day':
                return <BookingGrid rooms={filteredRooms} periods={periods} availability={dayAvailability} onSelectSlot={(roomId, periodCode) => handleSelectSlot(roomId, periodCode, selectedDate)} onReportProblem={handleOpenReportModal}/>;
            case 'week':
                return <WeekView selectedDate={selectedDate} availability={availability} rooms={filteredRooms} onDayClick={date => { setSelectedDate(date); setViewMode('day'); }} />;
            case 'month':
                 return <MonthView selectedDate={selectedDate} availability={availability} rooms={filteredRooms} onDayClick={date => { setSelectedDate(date); setViewMode('day'); }} />;
            default:
                return null;
        }
    }
    
    const ViewButton: React.FC<{ mode: ViewMode; children: React.ReactNode }> = ({ mode, children }) => (
        <button onClick={() => setViewMode(mode)} className={`px-4 py-2 text-sm font-medium rounded-md ${viewMode === mode ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Agendar uma Sala</h1>

            <FilterBar locations={locations} roomTypes={roomTypes} onFilterChange={setFilters} showSearch showLocation showRoomType />

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center space-x-2">
                   <ViewButton mode="day">Dia</ViewButton>
                   <ViewButton mode="week">Semana</ViewButton>
                   <ViewButton mode="month">Mês</ViewButton>
                </div>
                <DatePicker selectedDate={selectedDate} onDateChange={setSelectedDate} onPrev={() => handleDateNav('prev')} onNext={() => handleDateNav('next')} />
            </div>
            
            {isLoading && !Object.keys(availability).length ? <div className="text-center p-8">Carregando...</div> : renderView()}

            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} onSubmit={handleSubmitBooking} room={allRooms.find(r => r.id === selectedSlot?.roomId)} period={periods.find(p => p.code === selectedSlot?.periodCode)} date={selectedSlot?.date || new Date()} isLoading={isSubmittingBooking} />
            <ReportIssueModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSubmit={handleSubmitReport} roomName={reportingRoom?.name || ''} isLoading={isSubmittingReport} />
        </div>
    );
};

export default HomePage;