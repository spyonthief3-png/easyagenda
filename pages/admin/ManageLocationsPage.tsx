
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { Location } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import { Link } from 'react-router-dom';

const ManageLocationsPage: React.FC = () => {
    const { user } = useAuth();
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);

    const fetchLocations = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getLocations();
            setLocations(data);
        } catch (error) {
            console.error("Failed to fetch locations:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const handleOpenModal = (loc: Location | null = null) => {
        setEditingLocation(loc);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
    };

    const handleSave = async (data: Omit<Location, 'id'> | Location) => {
        if (!user) return;
        try {
            if ('id' in data && data.id) {
                await api.updateLocation(data.id, data, user.id);
            } else {
                await api.createLocation(data, user.id);
            }
            fetchLocations();
            handleCloseModal();
        } catch (error: any) {
            console.error("Failed to save location:", error);
            alert(`Erro ao salvar localização: ${error.message}`);
        }
    };
    
    const handleDelete = async (locId: string) => {
        if (!user) return;
        if(window.confirm("Tem certeza que deseja excluir esta localização? Ela só pode ser excluída se não estiver em uso por nenhuma sala.")) {
            try {
                await api.deleteLocation(locId, user.id);
                fetchLocations();
            } catch (error: any) {
                console.error("Failed to delete location:", error);
                alert(`Erro ao excluir localização: ${error.message}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Localizações</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nova Localização
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
            ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-3">
                        {locations.length > 0 ? locations.map(loc => (
                            <div key={loc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-gray-800">{loc.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(loc)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-gray-400">Nenhuma localização cadastrada.</p>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Nome da Localização</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {locations.map(loc => (
                                    <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{loc.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right space-x-4">
                                            <button onClick={() => handleOpenModal(loc)} className="text-indigo-600 hover:text-indigo-900 transition-colors">Editar</button>
                                            <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-700 transition-colors">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            
            <FormModal isOpen={isModalOpen} item={editingLocation} onClose={handleCloseModal} onSave={handleSave} />
        </div>
    );
};

interface FormModalProps {
    isOpen: boolean;
    item: Location | null;
    onClose: () => void;
    onSave: (data: Location | Omit<Location, 'id'>) => void;
}

const FormModal: React.FC<FormModalProps> = ({ isOpen, item, onClose, onSave }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        setName(item?.name || '');
    }, [item, isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = item ? { ...item, name } : { name };
        onSave(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Editar Bloco' : 'Nova Localização'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome (Bloco/Unidade)</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bloco A" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" required />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors order-2 sm:order-1">Cancelar</button>
                    <button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-md order-1 sm:order-2">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default ManageLocationsPage;
