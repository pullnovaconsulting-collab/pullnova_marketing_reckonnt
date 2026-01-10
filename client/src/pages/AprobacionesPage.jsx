/**
 * @fileoverview Página de Aprobaciones
 * @description Vista para aprobar/rechazar contenido pendiente
 */

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { CheckCircle, XCircle, Clock, Eye, Pencil, Instagram, Facebook, Linkedin, Twitter, Filter } from 'lucide-react';
import * as contenidoApi from '../services/contenidoApi';
import '../styles/Hub.css';

export default function AprobacionesPage() {
    const [pendingContent, setPendingContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos');
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPendingContent();
    }, []);

    const fetchPendingContent = async () => {
        try {
            setLoading(true);
            const response = await contenidoApi.getContenidos({ estado: 'pendiente', limit: 50 });
            setPendingContent(response.data.data || []);
        } catch (err) {
            console.error('Error loading content:', err);
            // Fallback to demo data
            setPendingContent([
                { id: 1, titulo: 'Promoción Black Friday', plataforma: 'instagram', tipo: 'imagen', copy_texto: 'Descubre nuestras ofertas exclusivas...', created_at: '2026-01-08' },
                { id: 2, titulo: 'Tips de Marketing Digital', plataforma: 'linkedin', tipo: 'post', copy_texto: '5 estrategias para mejorar tu presencia...', created_at: '2026-01-07' },
                { id: 3, titulo: 'Nuevo Producto Lanzamiento', plataforma: 'facebook', tipo: 'video', copy_texto: 'Presentamos nuestra nueva línea de...', created_at: '2026-01-06' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await contenidoApi.updateEstadoContenido(id, 'aprobado');
            setSuccess('Contenido aprobado exitosamente');
            setPendingContent(prev => prev.filter(item => item.id !== id));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Error al aprobar contenido');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleReject = async (id) => {
        try {
            await contenidoApi.updateEstadoContenido(id, 'rechazado');
            setSuccess('Contenido rechazado');
            setPendingContent(prev => prev.filter(item => item.id !== id));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Error al rechazar contenido');
            setTimeout(() => setError(null), 3000);
        }
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            instagram: <Instagram size={18} />,
            facebook: <Facebook size={18} />,
            linkedin: <Linkedin size={18} />,
            twitter: <Twitter size={18} />
        };
        return icons[platform] || null;
    };

    const filteredContent = filter === 'todos' 
        ? pendingContent 
        : pendingContent.filter(item => item.plataforma === filter);

    return (
        <Layout>
            <div className="aprobaciones-page">
                <div className="page-header">
                    <h1 className="page-title">
                        <CheckCircle size={28} /> Cola de Aprobaciones
                    </h1>
                    <p className="page-subtitle">Revisa y aprueba contenido pendiente</p>
                </div>

                {/* Alerts */}
                {success && <div className="alert alert-success">✓ {success}</div>}
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                {/* Filters */}
                <div className="aprobaciones-filters">
                    <div className="filter-group">
                        <Filter size={18} />
                        <button 
                            className={`filter-btn ${filter === 'todos' ? 'active' : ''}`}
                            onClick={() => setFilter('todos')}
                        >
                            Todos ({pendingContent.length})
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'instagram' ? 'active' : ''}`}
                            onClick={() => setFilter('instagram')}
                        >
                            <Instagram size={16} /> Instagram
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'facebook' ? 'active' : ''}`}
                            onClick={() => setFilter('facebook')}
                        >
                            <Facebook size={16} /> Facebook
                        </button>
                        <button 
                            className={`filter-btn ${filter === 'linkedin' ? 'active' : ''}`}
                            onClick={() => setFilter('linkedin')}
                        >
                            <Linkedin size={16} /> LinkedIn
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>Cargando contenido pendiente...</span>
                    </div>
                ) : filteredContent.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={64} className="empty-icon" />
                        <h3>¡Todo al día!</h3>
                        <p>No hay contenido pendiente de aprobación</p>
                    </div>
                ) : (
                    <div className="aprobaciones-grid">
                        {filteredContent.map(item => (
                            <div key={item.id} className="approval-card">
                                <div className="approval-card-header">
                                    <div className={`platform-badge ${item.plataforma}`}>
                                        {getPlatformIcon(item.plataforma)}
                                        <span>{item.plataforma}</span>
                                    </div>
                                    <span className="content-type">{item.tipo}</span>
                                </div>
                                
                                <div className="approval-card-body">
                                    <h3>{item.titulo}</h3>
                                    <p className="content-preview">{item.copy_texto}</p>
                                    <span className="content-date">
                                        <Clock size={14} /> {item.created_at}
                                    </span>
                                </div>
                                
                                <div className="approval-card-actions">
                                    <button 
                                        className="action-btn approve"
                                        onClick={() => handleApprove(item.id)}
                                    >
                                        <CheckCircle size={18} /> Aprobar
                                    </button>
                                    <button 
                                        className="action-btn reject"
                                        onClick={() => handleReject(item.id)}
                                    >
                                        <XCircle size={18} /> Rechazar
                                    </button>
                                    <button className="action-btn edit">
                                        <Pencil size={18} /> Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
