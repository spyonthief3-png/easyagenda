
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { Blackout, Room, Period } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

const ManageBlackoutsPage: React.FC = () => {
    // Fix: removed incorrect and redundant line 'const { user } = user;'
    const { user: currentUser } = useAuth();
    const [blackouts, setBlackouts] = useState<Blackout[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newBlackout, setNewBlackout] = useState({ date: '', reason: '', room_id: '', period_id: '' });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [blackoutsData, roomsData, periodsData] = await Promise.all([
                api.getBlackouts(),
                api.getRooms(true),
                api.getPeriods()
            ]);
            setBlackouts(blackoutsData);
            setRooms(roomsData);
            setPeriods(periodsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddBlackout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newBlackout.date || !newBlackout.reason) return;
        try {
            const payload = {
                date: newBlackout.date,
                reason: newBlackout.reason,
                roomId: newBlackout.room_id || null,
                periodId: newBlackout.period_id ? Number(newBlackout.period_id) : null,
            }
            await api.createBlackout(payload, currentUser.id);
            setNewBlackout({ date: '', reason: '', room_id: '', period_id: '' });
            fetchData();
        } catch (error) {
            console.error("Failed to add blackout:", error);
            alert(`Erro ao adicionar bloqueio: ${error}`);
        }
    };
    
    const handleDeleteBlackout = async (blackoutId: string) => {
        if (!currentUser) return;
        if(window.confirm("Tem certeza que deseja excluir este bloqueio?")) {
            try {
                await api.deleteBlackout(blackoutId, currentUser.id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete blackout:", error);
                alert(`Erro ao excluir bloqueio: ${error}`);
            }
        }
    };
    
    const getTargetDescription = (blackout: Blackout) => {
        const roomName = blackout.roomId ? rooms.find(r => r.id === blackout.roomId)?.name : 'Todas as salas';
        const periodLabel = blackout.periodId ? periods.find(p => p.id === blackout.periodId)?.label : 'Dia todo';
        return `${roomName} - ${periodLabel}`;
    }

    return (
        <div className="space-y-6">
             <div className="p-5 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs">Novo Bloqueio Pontual</h2>
                <form onSubmit={handleAddBlackout} className="flex flex-col space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 sm:space-y-0 lg:items-end">
                    <div className="sm:col-span-2">
                        <label htmlFor="blackoutReason" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Motivo</label>
                        <input id="blackoutReason" type="text" value={newBlackout.reason} onChange={e => setNewBlackout({...newBlackout, reason: e.target.value})} placeholder="Ex: Manutenção Elétrica" className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required/>
                    </div>
                    <div>
                        <label htmlFor="blackoutDate" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                        <input id="blackoutDate" type="date" value={newBlackout.date} onChange={e => setNewBlackout({...newBlackout, date: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required/>
                    </div>
                    <div>
                        <label htmlFor="blackoutRoom" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sala (opcional)</label>
                        <select id="blackoutRoom" value={newBlackout.room_id} onChange={e => setNewBlackout({...newBlackout, room_id: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Todas as Salas</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="blackoutPeriod" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Período (opcional)</label>
                        <select id="blackoutPeriod" value={newBlackout.period_id} onChange={e => setNewBlackout({...newBlackout, period_id: e.target.value})} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none">
                            <option value="">Dia Todo</option>
                            {periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-5 flex justify-end pt-2">
                        <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2.5 px-10 rounded-lg hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
                            Bloquear
                        </button>
                    </div>
                </form>

                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-10 mb-4">Bloqueios Ativos</h3>
                 {isLoading ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : (
                    <div className="space-y-2">
                        {blackouts.filter(b => !b.blockId).length > 0 ? blackouts.filter(b => !b.blockId).map(blackout => (
                            <div key={blackout.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm leading-tight">{blackout.reason}</span>
                                    <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mt-1">{getTargetDescription(blackout)}</span>
                                    <span className="text-xs text-gray-400 font-medium mt-0.5">{formatDate(new Date(blackout.date + 'T00:00:00'))}</span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteBlackout(blackout.id)} 
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )) : (
                            <p className="text-center py-6 text-gray-400 text-sm font-medium">Nenhum bloqueio pontual ativo.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageBlackoutsPage;
