/**
 * @fileoverview Marketing Intelligence Hub
 * @description Panel principal para crear, aprobar y programar contenido
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as api from '../services/api';
import * as socialApi from '../services/socialApi';
import * as iaApi from '../services/iaApi';
import * as campanasApi from '../services/campanasApi';
import {
    FileText,
    Clock,
    CheckCircle,
    Calendar,
    Sparkles,
    Image,
    Send,
    ChevronLeft,
    ChevronRight,
    Instagram,
    Linkedin,
    Facebook,
    RefreshCw,
    Link2,
    Unlink
} from 'lucide-react';
import '../styles/Hub.css';

export default function Dashboard() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Stats
    const [stats, setStats] = useState({
        generados: 0,
        pendientes: 0,
        aprobados: 0,
        programados: 0
    });

    // IA Generator
    const [generating, setGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState(null);
    const [campanas, setCampanas] = useState([]);
    const [copyForm, setCopyForm] = useState({
        plataforma: 'instagram',
        descripcion: '',
        campana_id: ''
    });

    // Calendar
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [scheduledPosts, setScheduledPosts] = useState([]);

    // Approval Queue
    const [pendingContent, setPendingContent] = useState([]);

    // Social Connections
    const [socialStatus, setSocialStatus] = useState(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const isEditor = user?.rol === 'admin' || user?.rol === 'editor';

    useEffect(() => {
        fetchInitialData();
        handleSocialCallback();
    }, []);

    const handleSocialCallback = () => {
        const params = new URLSearchParams(location.search);
        if (params.get('social_success')) {
            setSuccess('¡Cuenta conectada exitosamente!');
            navigate('/', { replace: true });
            setTimeout(() => setSuccess(null), 3000);
        } else if (params.get('social_error')) {
            setError('Error conectando cuenta: ' + (params.get('message') || 'Desconocido'));
            navigate('/', { replace: true });
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [statsRes, campanasRes] = await Promise.all([
                api.getStats(),
                isEditor ? campanasApi.getCampanas(1, 50) : Promise.resolve({ data: { data: [] } })
            ]);

            setStats({
                generados: statsRes?.data?.stats?.contenido_generado || 0,
                campanas: statsRes?.data?.stats?.campanas_activas || 0,
                pendientes: statsRes?.data?.stats?.pendientes || 0,
                programados: statsRes?.data?.stats?.programadas || 0
            });

            setCampanas(campanasRes.data?.data || []);

            // Mock pending content for demo
            setPendingContent([
                {
                    id: 1,
                    plataforma: 'linkedin',
                    titulo: 'AI-Powered Marketing',
                    imagen: null,
                    fecha: 'Hace 2 horas',
                    estado: 'pendiente'
                },
                {
                    id: 2,
                    plataforma: 'instagram',
                    titulo: 'Transforma tu estrategia',
                    imagen: null,
                    fecha: 'Hace 4 horas',
                    estado: 'pendiente'
                }
            ]);

        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    // Fetch social status
    const fetchSocialStatus = async () => {
        try {
            const res = await socialApi.getStatus();
            if (res?.data) {
                setSocialStatus(res.data);
            }
        } catch (err) {
            console.error('Error loading social status:', err);
        }
    };

    // Load social status on mount for editors
    useEffect(() => {
        if (isEditor) {
            fetchSocialStatus();
        }
    }, [isEditor]);

    const handleConnect = async (platform) => {
        try {
            const res = await socialApi.getAuthUrl(platform);
            if (res.data?.auth_url) {
                window.location.href = res.data.auth_url;
            }
        } catch (err) {
            console.error(`Error conectando ${platform}:`, err);
            setError(`Error al conectar con ${platform}`);
        }
    };

    const handleDisconnect = async (id) => {
        if (!window.confirm('¿Estás seguro de desconectar esta cuenta?')) return;

        try {
            await socialApi.disconnectAccount(id);
            setSuccess('Cuenta desconectada');
            fetchSocialStatus();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error desconectando:', err);
            setError('Error al desconectar la cuenta');
        }
    };

    const handleGenerarContenido = async () => {
        if (!copyForm.descripcion.trim()) {
            setError('Por favor, describe el contenido que deseas generar');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setGeneratedContent(null);

            const res = await iaApi.generarCopy({
                tema: copyForm.descripcion,
                plataforma: copyForm.plataforma,
                objetivo: 'promocionar',
                tono: 'profesional',
                modelo: 'openai',
                guardar: false,
                campana_id: copyForm.campana_id
            });

            setGeneratedContent(res.data.generacion?.contenido || res.data.contenido);
            setSuccess('¡Contenido generado exitosamente!');
            setStats(prev => ({ ...prev, generados: prev.generados + 1 }));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error generando contenido');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerarImagen = async () => {
        if (!copyForm.descripcion.trim()) {
            setError('Por favor, describe la imagen que deseas generar');
            return;
        }

        try {
            setGenerating(true);
            setError(null);

            const promptRes = await iaApi.generarPromptImagen({
                descripcion: copyForm.descripcion,
                estilo: 'moderno y profesional',
                colores: 'azules y blancos corporativos'
            });

            const prompt = promptRes.data.prompt || promptRes.data.contenido || copyForm.descripcion;

            const res = await iaApi.generarImagen({
                prompt: prompt,
                size: '1024x1024',
                quality: 'standard',
                style: 'vivid'
            });

            if (res.data?.url || res.data?.url_imagen || res.data?.data?.[0]?.url) {
                setSuccess('¡Imagen generada exitosamente!');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err.message || 'Error generando imagen');
        } finally {
            setGenerating(false);
        }
    };

    const handleApprove = (id) => {
        setPendingContent(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({
            ...prev,
            pendientes: prev.pendientes - 1,
            aprobados: prev.aprobados + 1
        }));
        setSuccess('Contenido aprobado');
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleReject = (id) => {
        setPendingContent(prev => prev.filter(item => item.id !== id));
        setStats(prev => ({ ...prev, pendientes: prev.pendientes - 1 }));
    };

    // Calendar helpers
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, isCurrentMonth: true, isToday: i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({ day: i, isCurrentMonth: false });
        }

        return days;
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'instagram': return <Instagram size={16} />;
            case 'linkedin': return <Linkedin size={16} />;
            case 'facebook': return <Facebook size={16} />;
            default: return <FileText size={16} />;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="loading">
                    <div className="spinner"></div>
                    <span>Cargando datos...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="hub">
                {/* Header */}
                <div className="hub-header">
                    <div>
                        <h1 className="hub-title">Centro de Inteligencia de Marketing</h1>
                        <p className="hub-subtitle">Sistema de Asistencia de Marketing con IA - Gestiona tus campañas,
                            contenido y métricas en un solo lugar.</p>
                    </div>
                </div>

                {/* Alerts */}
                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {/* KPI Cards */}
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                            <Sparkles size={24} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-value">{stats.campanas}</span>
                            <span className="kpi-label">Campañas Activas</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                            <FileText size={24} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-value">{stats.generados}</span>
                            <span className="kpi-label">Contenido Generado</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent)' }}>
                            <Calendar size={24} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-value">{stats.programados}</span>
                            <span className="kpi-label">Publicaciones Programadas</span>
                        </div>
                    </div>
                    <div className="kpi-card">
                        <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                            <Clock size={24} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-value">{stats.pendientes}</span>
                            <span className="kpi-label">Publicaciones Pendientes</span>
                        </div>
                    </div>
                </div>

                {/* Social Connections Section */}
                {isEditor && (
                    <div className="hub-section social-connections-section">
                        <div className="section-header">
                            <Link2 size={20} />
                            <h2>Conexiones de Redes Sociales</h2>
                        </div>
                        <p className="section-description">Conecta tus cuentas para publicar contenido directamente</p>

                        <div className="social-grid">
                            {/* Meta (Facebook/Instagram) */}
                            <div className="social-card">
                                <div className="social-card-header">
                                    <div className="social-icon meta">
                                        <Facebook size={20} />
                                        <Instagram size={20} />
                                    </div>
                                    <span className="social-name">Meta (FB/IG)</span>
                                </div>
                                <div className="social-card-body">
                                    {socialStatus?.cuentas?.filter(c => c.plataforma === 'facebook' || c.plataforma === 'instagram').length > 0 ? (
                                        <>
                                            {socialStatus.cuentas
                                                .filter(c => c.plataforma === 'facebook' || c.plataforma === 'instagram')
                                                .map(cuenta => (
                                                    <div key={cuenta.id} className="connected-account">
                                                        <span className="account-name">
                                                            {cuenta.plataforma === 'facebook' ? <Facebook size={14} /> : <Instagram size={14} />}
                                                            {cuenta.nombre}
                                                        </span>
                                                        <button
                                                            className="btn-disconnect"
                                                            onClick={() => handleDisconnect(cuenta.id)}
                                                            title="Desconectar"
                                                        >
                                                            <Unlink size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                            <button
                                                onClick={() => handleConnect('meta')}
                                                className="btn-secondary btn-small"
                                            >
                                                <RefreshCw size={14} /> Agregar otra cuenta
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect('meta')}
                                            className="btn-primary"
                                        >
                                            Conectar Facebook
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* LinkedIn */}
                            <div className="social-card">
                                <div className="social-card-header">
                                    <div className="social-icon linkedin">
                                        <Linkedin size={20} />
                                    </div>
                                    <span className="social-name">LinkedIn</span>
                                </div>
                                <div className="social-card-body">
                                    {socialStatus?.cuentas?.filter(c => c.plataforma === 'linkedin').length > 0 ? (
                                        <>
                                            {socialStatus.cuentas
                                                .filter(c => c.plataforma === 'linkedin')
                                                .map(cuenta => (
                                                    <div key={cuenta.id} className="connected-account">
                                                        <span className="account-name">
                                                            <Linkedin size={14} />
                                                            {cuenta.nombre}
                                                        </span>
                                                        <button
                                                            className="btn-disconnect"
                                                            onClick={() => handleDisconnect(cuenta.id)}
                                                            title="Desconectar"
                                                        >
                                                            <Unlink size={14} />
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                            <button
                                                onClick={() => handleConnect('linkedin')}
                                                className="btn-secondary btn-small"
                                            >
                                                <RefreshCw size={14} /> Reconectar
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect('linkedin')}
                                            className="btn-primary"
                                        >
                                            Conectar LinkedIn
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content - 2 Column Layout */}
                <div className="hub-grid">
                    {/* Left Column - AI Generator */}
                    <div className="hub-section">
                        <div className="section-header">
                            <Sparkles size={20} />
                            <h2>Generador de Contenido con IA</h2>
                        </div>
                        <p className="section-description">Crea contenido optimizado para tus redes sociales en segundos</p>

                        <div className="generator-form">
                            <div className="form-group">
                                <label className="form-label">Plataforma</label>
                                <select
                                    className="form-select"
                                    value={copyForm.plataforma}
                                    onChange={(e) => setCopyForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                >
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="twitter">Twitter/X</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción del contenido</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Ej: Promoción de nuevo producto, tips de marketing digital, anuncio de evento..."
                                    rows={4}
                                    value={copyForm.descripcion}
                                    onChange={(e) => setCopyForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                />
                            </div>

                            <div className="generator-actions">
                                <button
                                    className="btn-primary"
                                    onClick={handleGenerarContenido}
                                    disabled={generating || !copyForm.descripcion.trim()}
                                >
                                    {generating ? <RefreshCw size={18} className="spinning" /> : <Sparkles size={18} />}
                                    <span>{generating ? 'Generando...' : 'Generar Contenido'}</span>
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleGenerarImagen}
                                    disabled={generating || !copyForm.descripcion.trim()}
                                >
                                    <Image size={18} />
                                    <span>Generar Imagen</span>
                                </button>
                            </div>

                            {generatedContent && (
                                <div className="generated-result">
                                    <h4>Contenido Generado</h4>
                                    <p>{generatedContent}</p>
                                    <div className="result-actions">
                                        <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                                            Copiar
                                        </button>
                                        <button className="btn-primary">
                                            <Send size={16} />
                                            Guardar y Programar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Calendar */}
                    <div className="hub-section">
                        <div className="section-header">
                            <Calendar size={20} />
                            <h2>Calendario de Publicaciones</h2>
                        </div>
                        <p className="section-description">Publicaciones programadas para los próximos días</p>

                        <div className="calendar">
                            <div className="calendar-header">
                                <button className="calendar-nav" onClick={() => navigateMonth(-1)}>
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="calendar-month">
                                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </span>
                                <button className="calendar-nav" onClick={() => navigateMonth(1)}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <div className="calendar-weekdays">
                                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>

                            <div className="calendar-days">
                                {getDaysInMonth(currentDate).map((day, index) => (
                                    <div
                                        key={index}
                                        className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                                        onClick={() => day.isCurrentMonth && setSelectedDate(day.day)}
                                    >
                                        {day.day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="upcoming-posts">
                            <h4>Próximas publicaciones</h4>
                            <div className="posts-summary">
                                <div className="summary-item">
                                    <span>Esta semana</span>
                                    <span className="summary-value">12</span>
                                </div>
                                <div className="summary-item">
                                    <span>Próxima semana</span>
                                    <span className="summary-value">8</span>
                                </div>
                                <div className="summary-item">
                                    <span>Este mes</span>
                                    <span className="summary-value">{stats.programados}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approval Queue */}
                {isEditor && pendingContent.length > 0 && (
                    <div className="hub-section approval-section">
                        <div className="section-header">
                            <CheckCircle size={20} />
                            <h2>Cola de Aprobación</h2>
                        </div>
                        <p className="section-description">Revisa y aprueba el contenido generado antes de publicar</p>

                        <div className="approval-queue">
                            {pendingContent.map(item => (
                                <div key={item.id} className="approval-card">
                                    <div className="approval-platform">
                                        {getPlatformIcon(item.plataforma)}
                                        <span className="platform-name">{item.plataforma}</span>
                                        <span className="approval-time">{item.fecha}</span>
                                        <span className="badge badge-warning">Pendiente</span>
                                    </div>

                                    <div className="approval-content">
                                        <div className="approval-preview">
                                            {item.imagen ? (
                                                <img src={item.imagen} alt={item.titulo} />
                                            ) : (
                                                <div className="preview-placeholder">
                                                    <Image size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="approval-info">
                                            <h4>{item.titulo}</h4>
                                            <p>Nuevas tendencias en marketing digital 2025. Descubre cómo la IA está cambiando el juego...</p>
                                        </div>
                                    </div>

                                    <div className="approval-actions">
                                        <button className="btn-approve" onClick={() => handleApprove(item.id)}>
                                            <CheckCircle size={16} />
                                            Aprobar
                                        </button>
                                        <button className="btn-reject" onClick={() => handleReject(item.id)}>
                                            Rechazar
                                        </button>
                                        <button className="btn-edit">
                                            Editar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
