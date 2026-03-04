import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * LoginPage Component
 * Refactored by Rafael (Tech Leader)
 * - Improved UI with Glassmorphism and Tailwind v4
 * - Better accessibility and input handling
 * - Clean structure
 */
const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirecionamento após login (de onde o usuário veio ou home)
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
        }
    };

    const handleForgotPassword = () => {
        alert("A funcionalidade de recuperação de senha está em manutenção. Por favor, entre em contato com o administrador de TI.");
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[15%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <span className="text-white text-3xl font-bold italic">EA</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">EasyAgenda</h1>
                    <p className="text-gray-500 mt-2">Bem-vindo de volta! Faça login para continuar.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start gap-3 animate-shake">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1" htmlFor="email">
                                E-mail corporativo
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                                    </svg>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                    id="email"
                                    type="email"
                                    placeholder="exemplo@corporativo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
                                    Senha
                                </label>
                                <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                                    id="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className={`w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Autenticando...
                                </>
                            ) : (
                                'Acessar Painel'
                            )}
                        </button>
                    </form>

                    {/* Footer Info */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuário Demo</p>
                                <p className="text-xs text-gray-600 font-medium">john@example.com</p>
                            </div>
                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Demo</p>
                                <p className="text-xs text-gray-600 font-medium">jane@example.com</p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-4">
                            EasyAgenda v1.0 • Sistema Seguro de Agendamento
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
