/**
 * @fileoverview Página de Gestión de Campañas
 * @description CRUD completo de campañas de marketing
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as campanasApi from '../services/campanasApi';
import CampanaModal from '../components/CampanaModal';
import { Megaphone, Plus, Grid, List, Pencil, Trash2, Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import '../styles/Users.css';
import '../styles/Campanas.css';

const PLATAFORMAS_ICONS = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    twitter: Twitter,
    tiktok: Twitter
};

export default function CampanasPage() {
    const { user: currentUser, logout } = useAuth();

    // Estado de datos
    const [campanas, setCampanas] = useState([]);
    const [stats, setStats] = useState(null);
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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCampana, setEditingCampana] = useState(null);

    // Filtros
    const [filterEstado, setFilterEstado] = useState('');

    const isEditor = currentUser?.rol === 'admin' || currentUser?.rol === 'editor';

    /**
     * Carga la lista de campañas
     */
    const fetchCampanas = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const [campanasRes, statsRes] = await Promise.all([
                campanasApi.getCampanas(page, pagination.limit, filterEstado),
                isEditor ? campanasApi.getCampanasStats().catch(() => null) : Promise.resolve(null)
            ]);

            setCampanas(campanasRes.data.data || []);
            setPagination({
                page: campanasRes.data.page || 1,
                limit: campanasRes.data.limit || 12,
                total: campanasRes.data.total || 0,
                pages: campanasRes.data.pages || 0
            });

            if (statsRes?.data?.stats) {
                setStats(statsRes.data.stats);
            }
        } catch (err) {
            setError(err.message || 'Error al cargar campañas');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, filterEstado, isEditor]);

    useEffect(() => {
        fetchCampanas();
    }, [fetchCampanas]);

    const handleCreate = () => {
        setEditingCampana(null);
        setModalOpen(true);
    };

    const handleEdit = (campana) => {
        setEditingCampana(campana);
        setModalOpen(true);
    };

    const handleSave = async (campanaData) => {
        try {
            setSaving(true);
            setError(null);

            if (editingCampana) {
                await campanasApi.updateCampana(editingCampana.id, campanaData);
                setSuccess('Campaña actualizada exitosamente');
            } else {
                await campanasApi.createCampana(campanaData);
                setSuccess('Campaña creada exitosamente');
            }

            setModalOpen(false);
            setEditingCampana(null);
            fetchCampanas(pagination.page);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al guardar campaña');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (campana) => {
        const confirmed = window.confirm(
            `¿Estás seguro de eliminar la campaña "${campana.nombre}"?`
        );

        if (!confirmed) return;

        try {
            setError(null);
            await campanasApi.deleteCampana(campana.id);
            setSuccess('Campaña eliminada exitosamente');
            fetchCampanas(pagination.page);

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error al eliminar campaña');
        }
    };

    const handleEstadoChange = async (campana, nuevoEstado) => {
        try {
            await campanasApi.updateEstadoCampana(campana.id, nuevoEstado);
            setSuccess('Estado actualizado');
            fetchCampanas(pagination.page);
            setTimeout(() => setSuccess(null), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchCampanas(newPage);
        }
    };

    const getEstadoBadgeClass = (estado) => {
        const classes = {
            borrador: 'badge-borrador',
            activa: 'badge-activa',
            pausada: 'badge-pausada',
            completada: 'badge-completada'
        };
        return `badge ${classes[estado] || 'badge-borrador'}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const parsePlataformas = (plataformas) => {
        if (!plataformas) return [];
        if (typeof plataformas === 'string') {
            try {
                return JSON.parse(plataformas);
            } catch {
                return [];
            }
        }
        return plataformas;
    };

    return (
        <Layout>
            <div className="users-page">
                <div className="page-header">
                    <h1 className="page-title"><Megaphone size={24} /> Gestión de Campañas</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                                onClick={() => setViewMode('table')}
                            >
                                <List size={16} />
                            </button>
                        </div>
                        {isEditor && (
                            <button className="btn-primary" onClick={handleCreate}>
                                <Plus size={18} /> Nueva Campaña
                            </button>
                        )}
                    </div>
                </div>

                {/* Alertas */}
                {success && <div className="alert alert-success">✓ {success}</div>}
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                {/* Stats */}
                {stats && (
                    <div className="campanas-stats">
                        <div className="stat-mini">
                            <div className="stat-mini-value">{stats.total || 0}</div>
                            <div className="stat-mini-label">Total</div>
                        </div>
                        <div className="stat-mini">
                            <div className="stat-mini-value" style={{ color: 'var(--success-green)' }}>
                                {stats.activas || 0}
                            </div>
                            <div className="stat-mini-label">Activas</div>
                        </div>
                        <div className="stat-mini">
                            <div className="stat-mini-value" style={{ color: '#f97316' }}>
                                {stats.pausadas || 0}
                            </div>
                            <div className="stat-mini-label">Pausadas</div>
                        </div>
                        <div className="stat-mini">
                            <div className="stat-mini-value" style={{ color: '#9ca3af' }}>
                                {stats.borradores || 0}
                            </div>
                            <div className="stat-mini-label">Borradores</div>
                        </div>
                    </div>
                )}

                {/* Filtros */}
                <div className="filters-bar">
                    <select
                        className="filter-select"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="borrador">Borrador</option>
                        <option value="activa">Activa</option>
                        <option value="pausada">Pausada</option>
                        <option value="completada">Completada</option>
                    </select>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando campañas...</span>
                    </div>
                ) : campanas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <p>No hay campañas para mostrar</p>
                        {isEditor && (
                            <button className="btn-primary" onClick={handleCreate} style={{ marginTop: '1rem' }}>
                                Crear primera campaña
                            </button>
                        )}
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Vista de Grid */
                    <div className="campanas-grid">
                        {campanas.map(campana => (
                            <div key={campana.id} className="campana-card">
                                <div className="campana-header">
                                    <h3 className="campana-title">{campana.nombre}</h3>
                                    <span className={getEstadoBadgeClass(campana.estado)}>
                                        {campana.estado}
                                    </span>
                                </div>

                                {campana.descripcion && (
                                    <p className="campana-descripcion">{campana.descripcion}</p>
                                )}

                                <div className="campana-meta">
                                    {campana.fecha_inicio && (
                                        <span className="campana-meta-item">
                                            📅 {formatDate(campana.fecha_inicio)}
                                            {campana.fecha_fin && ` - ${formatDate(campana.fecha_fin)}`}
                                        </span>
                                    )}
                                    {campana.presupuesto > 0 && (
                                        <span className="campana-meta-item">
                                            💰 {formatCurrency(campana.presupuesto)}
                                        </span>
                                    )}
                                </div>

                                {parsePlataformas(campana.plataformas).length > 0 && (
                                    <div className="campana-plataformas">
                                        {parsePlataformas(campana.plataformas).map(p => (
                                            <span key={p} className="plataforma-icon" title={p}>
                                                {PLATAFORMAS_ICONS[p] || '🌐'}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="campana-footer">
                                    <span className="campana-kpi">
                                        KPI: {campana.kpi_principal || 'alcance'}
                                    </span>
                                    {isEditor && (
                                        <div className="campana-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(campana)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            {currentUser?.rol === 'admin' && (
                                                <button
                                                    className="btn-icon danger"
                                                    onClick={() => handleDelete(campana)}
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Vista de Tabla */
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Estado</th>
                                    <th>Fechas</th>
                                    <th>Presupuesto</th>
                                    <th>KPI</th>
                                    {isEditor && <th>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {campanas.map(campana => (
                                    <tr key={campana.id}>
                                        <td>
                                            <strong>{campana.nombre}</strong>
                                            {campana.objetivo && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {campana.objetivo}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={getEstadoBadgeClass(campana.estado)}>
                                                {campana.estado}
                                            </span>
                                        </td>
                                        <td>
                                            {campana.fecha_inicio ? (
                                                <>
                                                    {formatDate(campana.fecha_inicio)}
                                                    {campana.fecha_fin && <> → {formatDate(campana.fecha_fin)}</>}
                                                </>
                                            ) : '-'}
                                        </td>
                                        <td>{formatCurrency(campana.presupuesto)}</td>
                                        <td>{campana.kpi_principal || 'alcance'}</td>
                                        {isEditor && (
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        className="btn-secondary"
                                                        onClick={() => handleEdit(campana)}
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    {currentUser?.rol === 'admin' && (
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => handleDelete(campana)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                </div>

            <CampanaModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingCampana(null);
                }}
                onSave={handleSave}
                campana={editingCampana}
                loading={saving}
            />
        </Layout>
    );
}
