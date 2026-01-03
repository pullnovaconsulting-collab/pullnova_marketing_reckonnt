/**
 * @fileoverview Página de Gestión de Contenido
 * @description CRUD completo de contenido de marketing
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as contenidoApi from '../services/contenidoApi';
import * as campanasApi from '../services/campanasApi';
import ContenidoModal from '../components/ContenidoModal';
import '../styles/Users.css';
import '../styles/Campanas.css';
import '../styles/Contenido.css';

const TIPO_ICONS = {
    post: '📝',
    imagen: '🖼️',
    video: '🎬',
    story: '📱'
};

const PLAT_ICONS = {
    instagram: '📸',
    facebook: '📘',
    linkedin: '💼',
    twitter: '🐦'
};

export default function ContenidoPage() {
    const { user: currentUser, logout } = useAuth();

    // Estado de datos
    const [contenidos, setContenidos] = useState([]);
    const [campanas, setCampanas] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
    });

    // Estado de UI
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingContenido, setEditingContenido] = useState(null);

    // Filtros
    const [filters, setFilters] = useState({
        estado: '',
        plataforma: '',
        tipo: '',
        campana_id: ''
    });

    const isEditor = currentUser?.rol === 'admin' || currentUser?.rol === 'editor';

    /**
     * Carga la lista de contenido
     */
    const fetchContenidos = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await contenidoApi.getContenidos({
                page,
                limit: pagination.limit,
                ...filters
            });

            setContenidos(response.data.data || []);
            setPagination({
                page: response.data.page || 1,
                limit: response.data.limit || 12,
                total: response.data.total || 0,
                pages: response.data.pages || 0
            });
        } catch (err) {
            setError(err.message || 'Error al cargar contenido');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, filters]);

    /**
     * Carga las campañas para el selector
     */
    const fetchCampanas = useCallback(async () => {
        try {
            const response = await campanasApi.getCampanas(1, 100);
            setCampanas(response.data.data || []);
        } catch (err) {
            console.error('Error cargando campañas:', err);
        }
    }, []);

    useEffect(() => {
        fetchContenidos();
        fetchCampanas();
    }, [fetchContenidos, fetchCampanas]);

    const handleCreate = () => {
        setEditingContenido(null);
        setModalOpen(true);
    };

    const handleEdit = (contenido) => {
        setEditingContenido(contenido);
        setModalOpen(true);
    };

    const handleSave = async (contenidoData) => {
        try {
            setSaving(true);
            setError(null);

            if (editingContenido) {
                await contenidoApi.updateContenido(editingContenido.id, contenidoData);
                setSuccess('Contenido actualizado exitosamente');
            } else {
                await contenidoApi.createContenido(contenidoData);
                setSuccess('Contenido creado exitosamente');
            }

            setModalOpen(false);
            setEditingContenido(null);
            fetchContenidos(pagination.page);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al guardar contenido');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (contenido) => {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar "${contenido.titulo}"?`
        );

        if (!confirmed) return;

        try {
            setError(null);
            await contenidoApi.deleteContenido(contenido.id);
            setSuccess('Contenido eliminado exitosamente');
            fetchContenidos(pagination.page);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al eliminar contenido');
        }
    };

    const handleEstadoChange = async (contenido, nuevoEstado) => {
        try {
            await contenidoApi.updateEstadoContenido(contenido.id, nuevoEstado);
            setSuccess('Estado actualizado');
            fetchContenidos(pagination.page);
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchContenidos(newPage);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getEstadoBadgeClass = (estado) => {
        const classes = {
            pendiente: 'badge-pendiente',
            aprobado: 'badge-aprobado',
            programado: 'badge-programado',
            publicado: 'badge-publicado',
            rechazado: 'badge-rechazado'
        };
        return `badge ${classes[estado] || 'badge-pendiente'}`;
    };

    const getPlataformaBadgeClass = (plataforma) => {
        const classes = {
            instagram: 'badge-instagram',
            facebook: 'badge-facebook',
            linkedin: 'badge-linkedin',
            twitter: 'badge-twitter'
        };
        return `badge ${classes[plataforma] || ''}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCampanaName = (campana_id) => {
        const campana = campanas.find(c => c.id === campana_id);
        return campana?.nombre || null;
    };

    return (
        <div className="users-page">
            {/* Header */}
            <header className="header">
                <div className="logo">
                    <div className="logo-icon">P</div>
                    <span className="logo-text">PULLNOVA</span>
                </div>
                <div className="header-right">
                    <div className="user-menu">
                        <span className="user-name">👤 {currentUser?.nombre}</span>
                        <button onClick={logout} className="logout-button">
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido principal */}
            <main className="users-container">
                <Link to="/" className="nav-back">
                    ← Volver al Dashboard
                </Link>

                <div className="page-header">
                    <h1 className="page-title">📝 Gestión de Contenido</h1>
                    {isEditor && (
                        <button className="btn-primary" onClick={handleCreate}>
                            + Nuevo Contenido
                        </button>
                    )}
                </div>

                {/* Alertas */}
                {success && <div className="alert alert-success">✓ {success}</div>}
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                {/* Filtros */}
                <div className="filters-bar-multi">
                    <div className="filter-group">
                        <span className="filter-label">Estado:</span>
                        <select
                            className="filter-select"
                            value={filters.estado}
                            onChange={(e) => handleFilterChange('estado', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="programado">Programado</option>
                            <option value="publicado">Publicado</option>
                            <option value="rechazado">Rechazado</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">Plataforma:</span>
                        <select
                            className="filter-select"
                            value={filters.plataforma}
                            onChange={(e) => handleFilterChange('plataforma', e.target.value)}
                        >
                            <option value="">Todas</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="twitter">Twitter</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">Tipo:</span>
                        <select
                            className="filter-select"
                            value={filters.tipo}
                            onChange={(e) => handleFilterChange('tipo', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="post">Post</option>
                            <option value="imagen">Imagen</option>
                            <option value="video">Video</option>
                            <option value="story">Story</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <span className="filter-label">Campaña:</span>
                        <select
                            className="filter-select"
                            value={filters.campana_id}
                            onChange={(e) => handleFilterChange('campana_id', e.target.value)}
                        >
                            <option value="">Todas</option>
                            {campanas.map(camp => (
                                <option key={camp.id} value={camp.id}>
                                    {camp.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando contenido...</span>
                    </div>
                ) : contenidos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <p>No hay contenido para mostrar</p>
                        {isEditor && (
                            <button className="btn-primary" onClick={handleCreate} style={{ marginTop: '1rem' }}>
                                Crear primer contenido
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="contenido-grid">
                        {contenidos.map(cont => (
                            <div key={cont.id} className="contenido-card">
                                <div className="contenido-card-header">
                                    <div className="contenido-tipo-badge">
                                        <span>{TIPO_ICONS[cont.tipo] || '📄'}</span>
                                        <span>{cont.tipo}</span>
                                    </div>
                                    <span className={getPlataformaBadgeClass(cont.plataforma)}>
                                        {PLAT_ICONS[cont.plataforma]} {cont.plataforma}
                                    </span>
                                </div>

                                <div className="contenido-card-body">
                                    <h3 className="contenido-title">{cont.titulo}</h3>

                                    {cont.copy_texto && (
                                        <p className="contenido-copy">{cont.copy_texto}</p>
                                    )}

                                    <div className="contenido-meta">
                                        <span className={getEstadoBadgeClass(cont.estado)}>
                                            {cont.estado}
                                        </span>

                                        {cont.campana_id && getCampanaName(cont.campana_id) && (
                                            <span className="campana-tag">
                                                📊 {getCampanaName(cont.campana_id)}
                                            </span>
                                        )}

                                        {cont.fecha_publicacion && (
                                            <span className="contenido-meta-item">
                                                📅 {formatDate(cont.fecha_publicacion)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {isEditor && (
                                    <div className="contenido-card-footer">
                                        <div className="quick-actions">
                                            {cont.estado === 'pendiente' && (
                                                <>
                                                    <button
                                                        className="quick-action-btn"
                                                        onClick={() => handleEstadoChange(cont, 'aprobado')}
                                                        title="Aprobar"
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        className="quick-action-btn"
                                                        onClick={() => handleEstadoChange(cont, 'rechazado')}
                                                        title="Rechazar"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            )}
                                            {cont.estado === 'aprobado' && (
                                                <button
                                                    className="quick-action-btn"
                                                    onClick={() => handleEstadoChange(cont, 'programado')}
                                                    title="Programar"
                                                >
                                                    📅
                                                </button>
                                            )}
                                        </div>

                                        <div className="campana-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(cont)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            {currentUser?.rol === 'admin' && (
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(cont)}
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Paginación */}
                {pagination.pages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            ← Anterior
                        </button>
                        <span className="pagination-info">
                            Página {pagination.page} de {pagination.pages}
                        </span>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </main>

            <footer className="footer">
                <p>PULLNOVA Marketing © 2024 - Sistema de Asistencia de Marketing IA - RECKONNT</p>
            </footer>

            <ContenidoModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingContenido(null);
                }}
                onSave={handleSave}
                contenido={editingContenido}
                campanas={campanas}
                loading={saving}
            />
        </div>
    );
}
