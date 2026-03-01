
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { formatDate } from '../utils/date';
import type { Booking, IssueCategory, Location, RoomType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ReportIssueModal from '../components/ReportIssueModal';
import FilterBar, { Filters } from '../components/FilterBar';

const MyBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locations, setLocations] = useState<Location[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [filters, setFilters] = useState<Filters>({ search: '', locationId: '', roomTypeId: '' });

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportingBooking, setReportingBooking] = useState<Booking | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);

    const fetchMyBookings = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [bookingsData, locationsData, typesData] = await Promise.all([
                api.getMyBookings(user.id),
                api.getLocations(),
                api.getRoomTypes()
            ]);
            setAllBookings(bookingsData);
            setLocations(locationsData);
            setRoomTypes(typesData);
        } catch (error) {
            console.error("Falha ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMyBookings();
    }, [fetchMyBookings]);
    
    const filteredBookings = useMemo(() => {
        return allBookings.filter(booking => {
            return (
                (filters.locationId === '' || booking.room.location.id === filters.locationId) &&
                (filters.roomTypeId === '' || booking.room.roomType.id === filters.roomTypeId)
            );
        });
    }, [allBookings, filters]);

    const handleCancel = async (bookingId: string) => {
        if (!user) return;
        const reason = prompt("Por favor, informe o motivo do cancelamento (opcional):");
        if (reason === null) return;

        try {
            await api.cancelBooking(bookingId, user.id, reason || "Nenhum motivo informado");
            alert("Reserva cancelada com sucesso.");
            fetchMyBookings();
        } catch (error: any) {
            alert(`Falha ao cancelar a reserva: ${error.message}`);
        }
    };

    const handleOpenReportModal = (booking: Booking) => {
        setReportingBooking(booking);
        setIsReportModalOpen(true);
    };

    const handleSubmitReport = async (data: { category: IssueCategory; description: string; patrimony_number?: string; photo_url?: string; }) => {
        if (!reportingBooking || !user) return;
        setIsSubmittingReport(true);
        try {
            await api.createIssueReport({ ...data, roomId: reportingBooking.room.id, }, user.id);
            alert('Problema reportado com sucesso!');
            setIsReportModalOpen(false);
            setReportingBooking(null);
        } catch (error: any) {
            alert(`Falha ao reportar problema: ${error.message}`);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Carregando suas reservas...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Minhas Próximas Reservas</h1>

            <FilterBar 
                locations={locations} 
                roomTypes={roomTypes} 
                onFilterChange={setFilters}
                showLocation
                showRoomType
            />

            {filteredBookings.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBookings.map(booking => (
                        <div key={booking.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
                           <div>
                                <h2 className="text-xl font-bold text-indigo-700">{booking.title}</h2>
                                <p className="text-sm text-gray-500 mb-4">{booking.notes}</p>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><strong>Sala:</strong> {booking.room.name} ({booking.room.location.name})</p>
                                    <p><strong>Data:</strong> {formatDate(new Date(booking.date + 'T00:00:00'))}</p>
                                    {/* Fixed incorrect property names start_time and end_time to startTime and endTime */}
                                    <p><strong>Período:</strong> {booking.period.label} ({booking.period.startTime} - {booking.period.endTime})</p>
                                </div>
                           </div>
                           <div className="mt-6 space-y-2">
                                <button
                                 onClick={() => handleOpenReportModal(booking)}
                                 className="w-full bg-yellow-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2">
                                    Reportar Problema
                                </button>
                               <button 
                                onClick={() => handleCancel(booking.id)}
                                className="w-full bg-red-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                                   Cancelar Reserva
                               </button>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl text-gray-700">{allBookings.length > 0 ? 'Nenhuma reserva encontrada para os filtros selecionados.' : 'Você não possui reservas futuras.'}</h2>
                    <p className="text-gray-500 mt-2">{allBookings.length > 0 ? 'Tente ajustar ou limpar os filtros.' : 'Vá para a página de agendamento para reservar uma sala.'}</p>
                </div>
            )}

            <ReportIssueModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleSubmitReport}
                roomName={reportingBooking?.room.name || ''}
                isLoading={isSubmittingReport}
            />
        </div>
    );
};

export default MyBookingsPage;