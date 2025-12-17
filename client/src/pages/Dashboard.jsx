/**
 * @fileoverview Página Dashboard
 * @description Panel principal para usuarios autenticados
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [healthRes, statsRes] = await Promise.all([
                api.getHealth(),
                api.getStats()
            ]);

            setHealth(healthRes);
            setStats(statsRes);
        } catch (err) {
            setError('No se pudo conectar con el servidor.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const isConnected = health?.status === 'ok';

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <div className="logo-icon">P</div>
                    <span className="logo-text">PULLNOVA</span>
                </div>

                <div className="header-right">
                    <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        {loading ? 'Conectando...' : isConnected ? 'Conectado' : 'Desconectado'}
                    </div>

                    <div className="user-menu">
                        <span className="user-name">
                            👤 {user?.nombre || 'Usuario'}
                        </span>
                        <button onClick={handleLogout} className="logout-button">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="hero">
                <h1 className="hero-title">
                    Bienvenido, <span className="highlight">{user?.nombre || 'Usuario'}</span>
                </h1>
                <p className="hero-subtitle">
                    Sistema de Asistencia de Marketing con IA - Gestiona tus campañas,
                    contenido y métricas en un solo lugar.
                </p>

                {/* Stats Grid */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando datos...</span>
                    </div>
                ) : error ? (
                    <div className="error">
                        <p>⚠️ {error}</p>
                        <button onClick={fetchData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon users">👤</div>
                                <span className="stat-value">{stats?.stats?.usuarios || 0}</span>
                                <span className="stat-label">Usuarios</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon campaigns">📊</div>
                                <span className="stat-value">{stats?.stats?.campanas || 0}</span>
                                <span className="stat-label">Campañas</span>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon content">📝</div>
                                <span className="stat-value">{stats?.stats?.contenido || 0}</span>
                                <span className="stat-label">Contenido</span>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        {user?.rol === 'admin' && (
                            <div className="data-section" style={{ marginBottom: '1.5rem' }}>
                                <div className="data-header">
                                    <span>⚡</span>
                                    <h3>Acciones Rápidas</h3>
                                </div>
                                <div className="data-content">
                                    <div className="tables-list">
                                        <Link to="/usuarios" className="table-tag" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                            👥 Gestionar Usuarios
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Database Tables */}
                        <div className="data-section">
                            <div className="data-header">
                                <span>🗄️</span>
                                <h3>Tablas en la Base de Datos ({health?.database || 'railway'})</h3>
                            </div>
                            <div className="data-content">
                                {health?.tables?.length > 0 ? (
                                    <div className="tables-list">
                                        {health.tables.map((table, index) => (
                                            <span key={index} className="table-tag">{table}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        No hay tablas todavía. Ejecuta el script init.sql para crearlas.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="data-section">
                            <div className="data-header">
                                <span>👤</span>
                                <h3>Tu Información</h3>
                            </div>
                            <div className="data-content user-info-grid">
                                <div className="user-info-item">
                                    <span className="info-label">Nombre:</span>
                                    <span className="info-value">{user?.nombre}</span>
                                </div>
                                <div className="user-info-item">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{user?.email}</span>
                                </div>
                                <div className="user-info-item">
                                    <span className="info-label">Rol:</span>
                                    <span className="info-value role-badge">{user?.rol || 'viewer'}</span>
                                </div>
                                <div className="user-info-item">
                                    <span className="info-label">Estado:</span>
                                    <span className="info-value status-active">{user?.estado || 'activo'}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>PULLNOVA Marketing © 2024 - Sistema de Asistencia de Marketing IA - RECKONNT</p>
            </footer>
        </div>
    );
}
