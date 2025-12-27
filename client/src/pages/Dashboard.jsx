/**
 * @fileoverview Página Dashboard
 * @description Panel principal para usuarios autenticados
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import * as socialApi from '../services/socialApi';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [socialStatus, setSocialStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('social_success')) {
            alert('¡Cuenta conectada exitosamente!');
            fetchData();
            navigate('/', { replace: true });
        } else if (params.get('social_error')) {
            alert('Error conectando cuenta: ' + (params.get('message') || 'Desconocido'));
            navigate('/', { replace: true });
        }
    }, [location]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [healthRes, statsRes, socialRes] = await Promise.all([
                api.getHealth(),
                api.getStats(),
                user?.rol === 'admin' || user?.rol === 'editor' 
                    ? socialApi.getStatus().catch(() => null) 
                    : Promise.resolve(null)
            ]);

            setHealth(healthRes);
            setStats(statsRes);
            if (socialRes?.data) {
                setSocialStatus(socialRes.data);
            }
        } catch (err) {
            setError('No se pudo conectar con el servidor.');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (platform) => {
        try {
            const res = await socialApi.getAuthUrl(platform);
            if (res.data?.auth_url) {
                window.location.href = res.data.auth_url;
            }
        } catch (error) {
            console.error(`Error conectando ${platform}:`, error);
            alert(`Error al conectar con ${platform}`);
        }
    };

    const handleDisconnect = async (id) => {
        if (!window.confirm('¿Estás seguro de desconectar esta cuenta?')) return;
        
        try {
            await socialApi.disconnectAccount(id);
            fetchData(); // Recargar datos
        } catch (error) {
            console.error('Error desconectando:', error);
            alert('Error al desconectar la cuenta');
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
                        {(user?.rol === 'admin' || user?.rol === 'editor') && (
                            <div className="data-section" style={{ marginBottom: '1.5rem' }}>
                                <div className="data-header">
                                    <span>⚡</span>
                                    <h3>Acciones Rápidas</h3>
                                </div>
                                <div className="data-content">
                                    <div className="tables-list">
                                        <Link to="/campanas" className="table-tag" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                            📊 Gestionar Campañas
                                        </Link>
                                        <Link to="/contenido" className="table-tag" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                            📝 Gestionar Contenido
                                        </Link>
                                        <Link to="/ia" className="table-tag" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                            🤖 Asistente IA
                                        </Link>
                                        {user?.rol === 'admin' && (
                                            <Link to="/usuarios" className="table-tag" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                                                👥 Gestionar Usuarios
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Redes Sociales */}
                        {(user?.rol === 'admin' || user?.rol === 'editor') && (
                            <div className="data-section" style={{ marginBottom: '1.5rem' }}>
                                <div className="data-header">
                                    <span>🌐</span>
                                    <h3>Conexiones Sociales</h3>
                                </div>
                                <div className="data-content">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                        {/* Facebook / Instagram */}
                                        <div className="stat-card" style={{ alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem' }}>📘</span>
                                                <strong>Meta (FB/IG)</strong>
                                            </div>
                                            
                                            {socialStatus?.cuentas?.some(c => c.plataforma === 'facebook' || c.plataforma === 'instagram') ? (
                                                <div style={{ width: '100%' }}>
                                                    {socialStatus.cuentas
                                                        .filter(c => c.plataforma === 'facebook' || c.plataforma === 'instagram')
                                                        .map(cuenta => (
                                                            <div key={cuenta.id} className="connected-account">
                                                                <span>{cuenta.plataforma === 'facebook' ? '📘' : '📸'} {cuenta.nombre}</span>
                                                                <button 
                                                                    onClick={() => handleDisconnect(cuenta.id)}
                                                                    className="disconnect-btn"
                                                                    title="Desconectar"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))
                                                    }
                                                    <button 
                                                        onClick={() => handleConnect('meta')}
                                                        className="btn-secondary"
                                                        style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.9rem' }}
                                                    >
                                                        ↻ Reconectar / Agregar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleConnect('meta')}
                                                    className="btn-primary"
                                                    style={{ width: '100%' }}
                                                >
                                                    Conectar Facebook
                                                </button>
                                            )}
                                        </div>

                                        {/* LinkedIn */}
                                        <div className="stat-card" style={{ alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem' }}>💼</span>
                                                <strong>LinkedIn</strong>
                                            </div>

                                            {socialStatus?.cuentas?.some(c => c.plataforma === 'linkedin') ? (
                                                <div style={{ width: '100%' }}>
                                                    {socialStatus.cuentas
                                                        .filter(c => c.plataforma === 'linkedin')
                                                        .map(cuenta => (
                                                            <div key={cuenta.id} className="connected-account">
                                                                <span>💼 {cuenta.nombre}</span>
                                                                <button 
                                                                    onClick={() => handleDisconnect(cuenta.id)}
                                                                    className="disconnect-btn"
                                                                    title="Desconectar"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        ))
                                                    }
                                                    <button 
                                                        onClick={() => handleConnect('linkedin')}
                                                        className="btn-secondary"
                                                        style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.9rem' }}
                                                    >
                                                        ↻ Reconectar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleConnect('linkedin')}
                                                    className="btn-primary"
                                                    style={{ width: '100%' }}
                                                >
                                                    Conectar LinkedIn
                                                </button>
                                            )}
                                        </div>
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
