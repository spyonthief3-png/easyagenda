
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { Blackout, Room } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';

interface MaintenanceBlock {
    blockId: string;
    roomName: string;
    reason: string;
    startDate: string;
    endDate: string;
}

const MaintenanceBlockPage: React.FC = () => {
    const { user } = useAuth();
    const [blocks, setBlocks] = useState<MaintenanceBlock[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formState, setFormState] = useState({
        roomId: '',
        reason: '',
        startDate: '',
        endDate: '',
    });
    const [error, setError] = useState<string | null>(null);

    const fetchMaintenanceBlocks = useCallback(async () => {
        setIsLoading(true);
        try {
            const [blackoutsData, roomsData] = await Promise.all([
                api.getBlackouts(),
                api.getRooms(true),
            ]);
            setRooms(roomsData);

            const grouped = blackoutsData.reduce((acc, blackout) => {
                if (blackout.blockId) {
                    if (!acc[blackout.blockId]) {
                        acc[blackout.blockId] = [];
                    }
                    acc[blackout.blockId].push(blackout);
                }
                return acc;
            }, {} as Record<string, Blackout[]>);

            const maintenanceBlocks: MaintenanceBlock[] = Object.entries(grouped).map(([blockId, blackouts]) => {
                const sorted = blackouts.sort((a, b) => a.date.localeCompare(b.date));
                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                const room = roomsData.find(r => r.id === first.roomId);
                
                return {
                    blockId,
                    roomName: room?.name || 'Sala Desconhecida',
                    reason: first.reason,
                    startDate: first.date,
                    endDate: last.date,
                };
            }).sort((a, b) => a.startDate.localeCompare(b.startDate));

            setBlocks(maintenanceBlocks);

        } catch (err) {
            console.error("Failed to fetch maintenance blocks:", err);
            setError("Falha ao carregar dados de bloqueio.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaintenanceBlocks();
    }, [fetchMaintenanceBlocks]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!user || !formState.roomId || !formState.reason || !formState.startDate || !formState.endDate) {
            setError("Todos os campos são obrigatórios.");
            return;
        }
        
        if (new Date(formState.startDate) > new Date(formState.endDate)) {
            setError("A data de início não pode ser posterior à data de término.");
            return;
        }

        try {
            await api.createDateRangeBlackout({
                startDate: formState.startDate,
                endDate: formState.endDate,
                roomId: formState.roomId,
                reason: formState.reason,
            }, user.id);

            setFormState({ roomId: '', reason: '', startDate: '', endDate: '' });
            fetchMaintenanceBlocks();
        } catch (err: any) {
            console.error("Failed to create block:", err);
            setError(err.message || "Ocorreu um erro ao criar o bloqueio.");
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (!user || !window.confirm("Tem certeza que deseja remover este bloqueio de manutenção?")) return;

        try {
            await api.deleteDateRangeBlackout(blockId, user.id);
            fetchMaintenanceBlocks();
        } catch (err) {
            console.error("Failed to delete block:", err);
            setError("Ocorreu um erro ao remover o bloqueio.");
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Interdição de Salas</h1>

            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Novo Bloqueio por Período</h2>
                {error && <p className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 mb-6">{error}</p>}
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:space-y-0">
                    <div className="sm:col-span-2 lg:col-span-3">
                        <label htmlFor="reason" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Motivo da Interdição</label>
                        <input id="reason" name="reason" type="text" value={formState.reason} onChange={handleInputChange} placeholder="Ex: Pintura e Reparo de Piso" className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                     <div>
                        <label htmlFor="roomId" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sala</label>
                        <select id="roomId" name="roomId" value={formState.roomId} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 appearance-none" required>
                            <option value="" disabled>Selecione...</option>
                            {rooms.filter(r => r.isActive).map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data Inicial</label>
                        <input id="startDate" name="startDate" type="date" value={formState.startDate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                     <div>
                        <label htmlFor="endDate" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Data Final</label>
                        <input id="endDate" name="endDate" type="date" value={formState.endDate} onChange={handleInputChange} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                        <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                            Bloquear Sala
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Bloqueios Ativos e Agendados</h2>
                {isLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
                ) : blocks.length > 0 ? (
                    <>
                        {/* MOBILE LIST */}
                        <div className="md:hidden space-y-4">
                            {blocks.map(block => (
                                <div key={block.blockId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{block.reason}</h3>
                                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-tighter mt-1">{block.roomName}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteBlock(block.blockId)} 
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover Bloqueio"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium pt-2 border-t border-gray-50 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {formatDate(new Date(block.startDate + 'T00:00:00'))} até {formatDate(new Date(block.endDate + 'T00:00:00'))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* DESKTOP TABLE */}
                        <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Motivo</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Sala</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Período</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {blocks.map(block => (
                                        <tr key={block.blockId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{block.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{block.roomName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                {formatDate(new Date(block.startDate + 'T00:00:00'))} — {formatDate(new Date(block.endDate + 'T00:00:00'))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right">
                                                <button onClick={() => handleDeleteBlock(block.blockId)} className="text-red-500 hover:text-red-700 transition-colors">Remover</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">Nenhum bloqueio programado.</div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceBlockPage;
