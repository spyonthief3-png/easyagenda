
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Booking, BookingStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';
import { Link } from 'react-router-dom';

const ManageBookingsPage: React.FC = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error("Failed to fetch bookings:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

     const handleCancel = async (bookingId: string) => {
        if (!user) return;
        const reason = prompt("Por favor, informe o motivo do cancelamento (opcional):");
        if (reason === null) return;

        try {
            await api.cancelBooking(bookingId, user.id, reason || "Cancelado pelo Administrador");
            alert("Reserva cancelada com sucesso.");
            fetchBookings();
        } catch (error: any) {
            alert(`Falha ao cancelar a reserva: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gerenciar Reservas</h1>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
            ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-4">
                        {bookings.length > 0 ? bookings.map(booking => (
                            <div key={booking.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{booking.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">{booking.user.name}</p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {booking.status === BookingStatus.CONFIRMED ? 'Ativa' : 'Cancelada'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sala</p>
                                        <p className="text-xs font-bold text-gray-700 truncate">{booking.room.name}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data / Período</p>
                                        <p className="text-xs font-bold text-gray-700 truncate">
                                            {formatDate(new Date(booking.date + 'T00:00:00'))} <span className="text-indigo-500">({booking.period.code})</span>
                                        </p>
                                    </div>
                                </div>
                                {booking.status === BookingStatus.CONFIRMED && (
                                    <div className="pt-1">
                                        <button 
                                            onClick={() => handleCancel(booking.id)} 
                                            className="w-full bg-white text-red-500 font-bold py-2.5 rounded-lg border border-red-100 active:bg-red-50 transition-colors text-sm shadow-sm"
                                        >
                                            Cancelar Reserva
                                        </button>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">Nenhuma reserva registrada.</div>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Título</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Usuário</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Sala</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Data / Período</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookings.map(booking => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{booking.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{booking.user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{booking.room.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(new Date(booking.date + 'T00:00:00'))} <span className="font-bold text-indigo-600">({booking.period.code})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${booking.status === BookingStatus.CONFIRMED ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {booking.status === BookingStatus.CONFIRMED ? 'Confirmada' : 'Cancelada'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                                            {booking.status === BookingStatus.CONFIRMED && (
                                                <button onClick={() => handleCancel(booking.id)} className="text-red-500 hover:text-red-700 transition-colors">Cancelar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageBookingsPage;
