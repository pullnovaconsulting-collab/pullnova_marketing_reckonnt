/**
 * @fileoverview Aplicación Principal PULLNOVA Marketing
 * @description App con autenticación, rutas protegidas y dashboard
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import CampanasPage from './pages/CampanasPage';
import ContenidoPage from './pages/ContenidoPage';
import IAPage from './pages/IAPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CalendarioPage from './pages/CalendarioPage';
import AprobacionesPage from './pages/AprobacionesPage';
import './App.css';

/**
 * Componente principal de la aplicación
 */
function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <span>Cargando PULLNOVA...</span>
            </div>
        );
    }

    return (
        <Routes>
            {/* Rutas públicas */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
                }
            />
            <Route
                path="/register"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
                }
            />

            {/* Rutas protegidas */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/usuarios"
                element={
                    <ProtectedRoute>
                        <UsersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/campanas"
                element={
                    <ProtectedRoute>
                        <CampanasPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/contenido"
                element={
                    <ProtectedRoute>
                        <ContenidoPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/ia"
                element={
                    <ProtectedRoute>
                        <IAPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <AnalyticsDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/calendario"
                element={
                    <ProtectedRoute>
                        <CalendarioPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/aprobaciones"
                element={
                    <ProtectedRoute>
                        <AprobacionesPage />
                    </ProtectedRoute>
                }
            />

            {/* Ruta catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

/**
 * App envuelta con providers
 */
function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
