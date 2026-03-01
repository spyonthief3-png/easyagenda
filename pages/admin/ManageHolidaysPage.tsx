
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { Holiday } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';
import { Link } from 'react-router-dom';

const ManageHolidaysPage: React.FC = () => {
    const { user } = useAuth();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newHolidayName, setNewHolidayName] = useState('');
    const [newHolidayDate, setNewHolidayDate] = useState('');

    const fetchHolidays = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getHolidays();
            setHolidays(data);
        } catch (error) {
            console.error("Failed to fetch holidays:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newHolidayDate || !newHolidayName) return;
        try {
            await api.createHoliday({ date: newHolidayDate, name: newHolidayName }, user.id);
            setNewHolidayDate('');
            setNewHolidayName('');
            fetchHolidays();
        } catch (error) {
            console.error("Failed to add holiday:", error);
            alert(`Erro ao adicionar feriado: ${error}`);
        }
    };
    
    const handleDeleteHoliday = async (holidayId: number) => {
        if (!user) return;
        if(window.confirm("Tem certeza que deseja excluir este feriado?")) {
            try {
                await api.deleteHoliday(holidayId, user.id);
                fetchHolidays();
            } catch (error) {
                console.error("Failed to delete holiday:", error);
                alert(`Erro ao excluir feriado: ${error}`);
            }
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Feriados</h1>
            </div>

             <div className="p-5 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider text-xs">Novo Feriado</h2>
                <form onSubmit={handleAddHoliday} className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 lg:col-span-1">
                        <label htmlFor="holidayName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome</label>
                        <input id="holidayName" type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="Ex: Natal" className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required/>
                    </div>
                     <div>
                        <label htmlFor="holidayDate" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                        <input id="holidayDate" type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500" required/>
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-all shadow-sm active:scale-95">
                            Adicionar
                        </button>
                    </div>
                </form>

                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-10 mb-4">Feriados Cadastrados</h3>
                 {isLoading ? (
                    <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : (
                    <div className="space-y-2">
                        {holidays.length > 0 ? holidays.map(holiday => (
                            <div key={holiday.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800 text-sm">{holiday.name}</span>
                                    <span className="text-xs text-gray-400 font-medium">{formatDate(new Date(holiday.date + 'T00:00:00'))}</span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteHoliday(holiday.id)} 
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        )) : (
                            <p className="text-center py-6 text-gray-400 text-sm font-medium">Nenhum feriado cadastrado.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageHolidaysPage;
