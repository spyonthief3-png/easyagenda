import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import type { Room, Location, RoomType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';

const ManageRoomsPage: React.FC = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [roomsData, locationsData, typesData] = await Promise.all([
                api.getRooms(true),
                api.getLocations(),
                api.getRoomTypes()
            ]);
            setRooms(roomsData);
            setLocations(locationsData);
            setRoomTypes(typesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (room: Room | null = null) => {
        setEditingRoom(room);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRoom(null);
    };

    const handleSaveRoom = async (roomData: any) => {
        if (!user) return;
        try {
            if (roomData.id) {
                await api.updateRoom(roomData.id, roomData, user.id);
            } else {
                await api.createRoom(roomData, user.id);
            }
            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save room:", error);
            alert(`Erro ao salvar sala: ${error}`);
        }
    };
    
    const handleDeleteRoom = async (roomId: string) => {
        if (!user) return;
        if(window.confirm("Tem certeza que deseja excluir esta sala?")) {
            try {
                await api.deleteRoom(roomId, user.id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete room:", error);
                alert(`Erro ao excluir sala: ${error}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gerenciar Salas</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Nova Sala
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
            ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="md:hidden space-y-4">
                        {rooms.map(room => (
                            <div key={room.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{room.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">{room.roomType.name} • {room.location.name}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {room.isActive ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-bold">Capacidade:</span> {room.capacity} pessoas
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        onClick={() => handleOpenModal(room)} 
                                        className="flex-1 bg-indigo-50 text-indigo-700 font-bold py-2.5 rounded-lg border border-indigo-100 active:bg-indigo-100"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteRoom(room.id)} 
                                        className="flex-1 bg-red-50 text-red-700 font-bold py-2.5 rounded-lg border border-red-100 active:bg-red-100"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Localização</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rooms.map(room => (
                                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{room.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{room.roomType.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{room.location.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {room.isActive ? <span className="text-green-600 font-bold text-xs uppercase">Ativa</span> : <span className="text-red-400 font-bold text-xs uppercase">Inativa</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right space-x-4">
                                            <button onClick={() => handleOpenModal(room)} className="text-indigo-600 hover:text-indigo-900 transition-colors">Editar</button>
                                            <button onClick={() => handleDeleteRoom(room.id)} className="text-red-500 hover:text-red-700 transition-colors">Excluir</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            
            <RoomFormModal isOpen={isModalOpen} room={editingRoom} locations={locations} roomTypes={roomTypes} onClose={handleCloseModal} onSave={handleSaveRoom} />
        </div>
    );
};

interface RoomFormModalProps {
    isOpen: boolean;
    room: Room | null;
    locations: Location[];
    roomTypes: RoomType[];
    onClose: () => void;
    onSave: (roomData: any) => void;
}

const RoomFormModal: React.FC<RoomFormModalProps> = ({ isOpen, room, locations, roomTypes, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        locationId: '',
        roomTypeId: '',
        capacity: 0,
        resources: {
            projector: false,
            tv: false,
            whiteboard: false,
            'video-conference': false,
        },
        isActive: true,
    });
    
    useEffect(() => {
        if (room) {
            setFormData({
                name: room.name,
                locationId: room.location.id,
                roomTypeId: room.roomType.id,
                capacity: room.capacity,
                resources: {
                    projector: room.resources?.projector || false,
                    tv: room.resources?.tv || false,
                    whiteboard: room.resources?.whiteboard || false,
                    'video-conference': room.resources?.['video-conference'] || false,
                },
                isActive: room.isActive,
            });
        } else {
             setFormData({
                name: '', locationId: '', roomTypeId: '', capacity: 0,
                resources: { projector: false, tv: false, whiteboard: false, 'video-conference': false },
                isActive: true,
            });
        }
    }, [room, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             if(name in formData.resources) {
                setFormData(prev => ({ ...prev, resources: { ...prev.resources, [name]: checked } }));
             } else {
                setFormData(prev => ({ ...prev, [name]: checked }));
             }
        } else {
             setFormData(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value) || 0 : value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const roomData = room ? { ...formData, id: room.id } : formData;
        onSave(roomData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={room ? 'Editar Sala' : 'Adicionar Sala'}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Sala</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Sala 101" className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white" required />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Sala</label>
                        <select name="roomTypeId" value={formData.roomTypeId} onChange={handleChange} className="w-full p-3 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500" required>
                            <option value="" disabled>Selecione...</option>
                            {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Localização</label>
                        <select name="locationId" value={formData.locationId} onChange={handleChange} className="w-full p-3 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500" required>
                            <option value="" disabled>Selecione...</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Capacidade (Pessoas)</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="w-full p-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 bg-white" required />
                </div>

                <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">Recursos Disponíveis:</label>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                       {Object.keys(formData.resources).map(key => (
                            <label key={key} className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" name={key} checked={formData.resources[key as keyof typeof formData.resources]} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                                <span className="text-sm font-medium text-gray-600">{key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </label>
                       ))}
                    </div>
                </div>

                 <label className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-indigo-900">Sala ativa para agendamentos</span>
                </label>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 sticky bottom-0 bg-white">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors order-2 sm:order-1">Cancelar</button>
                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95 order-1 sm:order-2">Salvar Sala</button>
                </div>
            </form>
        </Modal>
    );
};

export default ManageRoomsPage;