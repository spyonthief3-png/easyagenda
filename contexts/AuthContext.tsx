import React, { createContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Recupera token do localStorage ao iniciar
        const savedToken = localStorage.getItem('authToken');
        if (savedToken) {
            setAuthToken(savedToken);
        }

        const checkSession = async () => {
            try {
                const currentUser = await api.getCurrentUser();
                setUser(currentUser);
            } catch (e) {
                // Not authenticated - clear token
                setAuthToken(null);
                localStorage.removeItem('authToken');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { user, token } = await api.login({ email, password });
            // Armazena token para próximas requisições
            if (token) {
                setAuthToken(token);
                localStorage.setItem('authToken', token);
            }
            setUser(user);
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await api.logout();
            setAuthToken(null);
            localStorage.removeItem('authToken');
            setUser(null);
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};
