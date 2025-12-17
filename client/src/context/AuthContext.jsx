/**
 * @fileoverview Contexto de Autenticación
 * @description Provider de React Context para manejar el estado de autenticación
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

/**
 * Hook personalizado para acceder al contexto de autenticación
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

/**
 * Provider de autenticación
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isAuthenticated = !!token && !!user;

    /**
     * Verifica el token almacenado y carga el perfil del usuario
     */
    const checkAuth = useCallback(async () => {
        const storedToken = localStorage.getItem('token');

        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.getProfile();
            setUser(response.data.user);
            setToken(storedToken);
        } catch (err) {
            console.error('Error verificando autenticación:', err);
            // Token inválido o expirado
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    /**
     * Inicia sesión
     */
    const login = async (email, password) => {
        setError(null);
        try {
            const response = await api.login({ email, password });
            const { user: userData, token: newToken } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Registra un nuevo usuario
     */
    const register = async (nombre, email, password) => {
        setError(null);
        try {
            const response = await api.register({ nombre, email, password });
            const { user: userData, token: newToken } = response.data;

            localStorage.setItem('token', newToken);
            setToken(newToken);
            setUser(userData);

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Cierra sesión
     */
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setError(null);
    };

    /**
     * Limpia errores
     */
    const clearError = () => setError(null);

    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        checkAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
