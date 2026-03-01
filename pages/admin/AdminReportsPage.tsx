
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { DashboardStats, StatItem, User, Room, Location, RoomType } from '../../types';
import { formatDate } from '../../utils/date';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center space-x-4">
        <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-gray-800">{value}</p>
        </div>
    </div>
);

const HorizontalBarChart: React.FC<{ title: string; data: StatItem[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0) || 1;
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{title}</h3>
            <div className="space-y-4">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-gray-600 truncate pr-2 uppercase" title={item.label}>{item.label}</span>
                            <span className="text-indigo-600">{item.value}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )) : <p className="text-gray-400 text-xs font-medium py-4 text-center">Nenhum dado disponível.</p>}
            </div>
        </div>
    );
};

const VerticalBarChart: React.FC<{ title: string; data: StatItem[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(item => item.value), 0) || 1;
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{title}</h3>
            <div className="flex items-end h-64 space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex flex-col items-center min-w-[60px] flex-1 group">
                        <div className="text-[10px] font-black text-indigo-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{item.value}</div>
                        <div className="w-full bg-gray-100 rounded-t-lg flex-grow flex items-end">
                            <div
                                className="w-full bg-indigo-500 group-hover:bg-indigo-600 transition-all rounded-t-lg"
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">
                            {item.label ? item.label.split('-').slice(1).reverse().join('/') : ''}
                        </span>
                    </div>
                )) : <p className="text-gray-400 text-xs font-medium w-full text-center py-10">Nenhum dado disponível.</p>}
            </div>
        </div>
    );
};


const AdminReportsPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

    const defaultFilters = {
        startDate: '',
        endDate: '',
        userId: '',
        roomId: '',
        locationId: '',
        roomTypeId: '',
    };
    const [filters, setFilters] = useState(defaultFilters);

    const fetchStats = useCallback(async (currentFilters: typeof filters) => {
        setIsLoading(true);
        try {
            const data = await api.getDashboardStats(currentFilters);
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [usersData, roomsData, locsData, typesData] = await Promise.all([
                    api.getUsers(),
                    api.getRooms(true),
                    api.getLocations(),
                    api.getRoomTypes()
                ]);
                setUsers(usersData);
                setRooms(roomsData);
                setLocations(locsData);
                setRoomTypes(typesData);
            } catch (error) {
                console.error("Failed to fetch filter data:", error);
            }
        };
        fetchDropdownData();
        fetchStats(defaultFilters); // Initial fetch
    }, [fetchStats]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
    };

    const handleApplyFilters = () => {
        fetchStats(filters);
    };

    const handleClearFilters = () => {
        setFilters(defaultFilters);
        fetchStats(defaultFilters);
    };


    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Relatórios</h1>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Início</label>
                        <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fim</label>
                        <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="locationId" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bloco</label>
                        <select id="locationId" name="locationId" value={filters.locationId} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Todas</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="roomTypeId" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo</label>
                        <select id="roomTypeId" name="roomTypeId" value={filters.roomTypeId} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Todos</option>
                            {roomTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="userId" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usuário</label>
                        <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Todos</option>
                            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="roomId" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sala</label>
                        <select id="roomId" name="roomId" value={filters.roomId} onChange={handleFilterChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Todas</option>
                            {rooms.filter(r => r.isActive).map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-2 flex gap-3 pt-2">
                        <button onClick={handleApplyFilters} className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 flex-1 transition-all shadow-sm active:scale-95">Filtrar</button>
                        <button onClick={handleClearFilters} className="bg-gray-100 text-gray-500 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-all">Limpar</button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
            ) : !stats ? (
                <div className="text-center p-12 text-red-400 font-bold bg-white rounded-xl border border-red-50">Falha ao carregar os dados.</div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <StatCard title="Usuários" value={stats.totalActiveUsers} icon={<UserIcon />} />
                        <StatCard title="Salas" value={stats.totalRooms} icon={<RoomIcon />} />
                        <StatCard title="Reservas" value={stats.totalConfirmedBookings} icon={<BookingIcon />} />
                        <StatCard title="Futuras" value={stats.totalUpcomingBookings} icon={<CalendarIcon />} />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        <HorizontalBarChart title="Uso por Bloco" data={stats.bookingsByLocation} />
                        <HorizontalBarChart title="Uso por Tipo de Sala" data={stats.bookingsByRoomType} />
                        <HorizontalBarChart title="Salas mais Reservadas" data={stats.bookingsPerRoom.slice(0, 10)} />
                        <HorizontalBarChart title="Usuários Ativos" data={stats.topUsers} />
                    </div>
                    <div className="grid grid-cols-1">
                        <VerticalBarChart title="Densidade de Reservas por Dia" data={stats.bookingsByDay} />
                    </div>
                </>
            )}
        </div>
    );
};

// SVG Icons for Stat Cards
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const RoomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
);
const BookingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


export default AdminReportsPage;
