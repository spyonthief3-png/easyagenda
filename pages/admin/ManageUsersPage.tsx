
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { User, ROLE } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import { Link } from 'react-router-dom';

const ManageUsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };
    
    const handleSaveUser = async (userData: Omit<User, 'id'> | User) => {
        if (!currentUser) return;
        try {
            if ('id' in userData && userData.id) {
                await api.updateUser(userData.id, userData, currentUser.id);
            } else {
                await api.createUser(userData, currentUser.id);
            }
            fetchUsers();
            handleCloseModal();
        } catch (error: any) {
            console.error("Failed to save user:", error);
            alert(`Erro ao salvar usuário: ${error.message}`);
        }
    };
    
    const handleDeleteUser = async (userId: string) => {
        if (!currentUser || userId === currentUser.id) {
            alert("Você não pode excluir sua própria conta.");
            return;
        }
        if(window.confirm("Tem certeza que deseja excluir este usuário?")) {
            try {
                await api.deleteUser(userId, currentUser.id);
                fetchUsers();
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert(`Erro ao excluir usuário: ${error}`);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Usuários</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Usuário
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* MOBILE LIST */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {users.map(user => (
                            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center gap-3">
                                    <img src={user.photoUrl} alt="" className="w-10 h-10 rounded-full bg-gray-100" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900">{user.name}</h3>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 uppercase text-[10px] font-bold tracking-wider">Perfil</span>
                                    <span className="font-medium text-gray-700">{user.role}</span>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => handleOpenModal(user)} className="flex-1 bg-indigo-50 text-indigo-700 font-bold py-2 rounded-lg text-sm border border-indigo-100 active:bg-indigo-100">Editar</button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.id)} 
                                        disabled={user.id === currentUser?.id}
                                        className="flex-1 bg-red-50 text-red-700 font-bold py-2 rounded-lg text-sm border border-red-100 active:bg-red-100 disabled:opacity-50"
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
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Perfil</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img src={user.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                                                <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold uppercase text-xs tracking-tighter">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {user.isActive ? <span className="text-green-600 font-bold text-xs uppercase">Ativo</span> : <span className="text-red-400 font-bold text-xs uppercase">Inativo</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right space-x-4">
                                            <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)} 
                                                disabled={user.id === currentUser?.id}
                                                className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <UserFormModal isOpen={isModalOpen} user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />
        </div>
    );
};


interface UserFormModalProps {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
    onSave: (userData: User | Omit<User, 'id'>) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        role: ROLE.USER,
        isActive: true,
        password: '',
    });
    
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive ?? true,
                password: '',
            });
        } else {
            setFormData({
                name: '', username: '', email: '', role: ROLE.USER, isActive: true, password: '',
            });
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { password, ...userDataToSave } = formData;
        const finalUserData = user ? { ...userDataToSave, id: user.id } : userDataToSave;
        onSave(finalUserData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuário' : 'Adicionar Usuário'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome Completo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João Silva" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome de usuário</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Ex: joao.silva" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{user ? "Nova Senha (opcional)" : "Senha"}</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" required={!user} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Perfil de Acesso</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all appearance-none">
                        <option value={ROLE.USER}>Usuário</option>
                        <option value={ROLE.MAINTENANCE}>Manutenção</option>
                        <option value={ROLE.ADMIN}>Administrador</option>
                    </select>
                </div>
                 <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                    <span className="text-sm font-bold text-gray-700">Usuário ativo no sistema</span>
                </label>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                    <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 order-2 sm:order-1 transition-colors">Cancelar</button>
                    <button type="submit" className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 order-1 sm:order-2 transition-colors">Salvar</button>
                </div>
            </form>
        </Modal>
    )
}

export default ManageUsersPage;
