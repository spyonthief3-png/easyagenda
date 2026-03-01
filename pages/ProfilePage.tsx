import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const ProfilePage: React.FC = () => {
    const { user, login } = useAuth();
    
    const [userData, setUserData] = useState({
        name: user?.name || '',
        email: user?.email || '',
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    
    const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
    
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUserDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateData = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const updatedUser = await api.updateUser(user.id, { name: userData.name, email: userData.email }, user.id);
            login(updatedUser); 
            setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao atualizar dados: ${error.message}` });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        try {
            await api.changePassword(user.id, passwordData.currentPassword, passwordData.newPassword, user.id);
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao alterar senha: ${error.message}` });
        }
    };

    const handleChangePhoto = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const updatedUser = await api.updateUser(user.id, { photoUrl: photoUrl }, user.id);
            login(updatedUser);
            setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao atualizar foto: ${error.message}` });
        }
    };
    
    if (!user) {
        return <div>Carregando...</div>
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1>
            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Meus Dados</h2>
                        <form onSubmit={handleUpdateData} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                <input type="text" name="name" value={userData.name} onChange={handleUserDataChange} className="mt-1 w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" name="email" value={userData.email} onChange={handleUserDataChange} className="mt-1 w-full p-2 border rounded-md" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Usuário</label>
                                <input type="text" value={user.username} className="mt-1 w-full p-2 border rounded-md bg-gray-100" readOnly disabled />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">
                                Atualizar Dados
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Alterar Senha</h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Senha Atual</label>
                                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border rounded-md" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border rounded-md" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="mt-1 w-full p-2 border rounded-md" required />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">
                                Alterar Senha
                            </button>
                        </form>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold mb-4">Alterar Foto de Perfil</h2>
                        <form onSubmit={handleChangePhoto} className="space-y-4">
                            <div className="flex items-center space-x-4">
                               <img src={photoUrl} alt="Avatar" className="w-20 h-20 rounded-full" />
                               <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700">URL da Imagem</label>
                                    <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
                               </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">
                                Atualizar Foto
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;