import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            // Navigation is handled by AuthContext updates or we can navigate here.
            // Usually better to navigate here on success.
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
        }
    };

    const handleForgotPassword = () => {
        alert("Funcionalidade de recuperação de senha não implementada neste mock. Por favor, entre em contato com o administrador.");
    };

    return (
        <div className="flex items-center justify-center mt-16">
            <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl px-8 pt-6 pb-8 mb-4">
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Login no EasyAgenda</h1>
                    {error && <p className="bg-red-100 text-red-700 text-sm p-3 rounded mb-4">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-400"
                            id="email"
                            type="email"
                            placeholder="ex: john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Senha
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-indigo-400"
                            id="password"
                            type="password"
                            placeholder="******************"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="text-right mb-6">
                        <button type="button" onClick={handleForgotPassword} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                            Esqueci minha senha
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                    <div className="text-center text-gray-500 text-xs mt-6 space-y-1">
                        <p>Dica: john@example.com (Usuário), jane@example.com (Admin)</p>
                        <p>mike@example.com (Manutenção). Senha: 'password'</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;