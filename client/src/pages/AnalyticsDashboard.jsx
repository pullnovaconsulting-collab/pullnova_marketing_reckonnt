/**
 * @fileoverview Analytics Dashboard Page
 * @description Comprehensive analytics dashboard with charts and KPIs
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    Target,
    Clock,
    DollarSign,
    Calendar,
    Search,
    X,
    Trophy
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import * as dashboardApi from '../services/dashboardApi';
import '../styles/AnalyticsDashboard.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function AnalyticsDashboard() {
    const { user, logout } = useAuth();
    const [periodo, setPeriodo] = useState('semana');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [kpisData, setKpisData] = useState(null);
    const [comparativaData, setComparativaData] = useState(null);
    
    // Date filters
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [filtrosAplicados, setFiltrosAplicados] = useState(false);

    // Compute date range based on periodo or custom dates
    const getDateRange = () => {
        const hoy = new Date();
        const formatDate = (d) => d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        if (filtrosAplicados && fechaDesde && fechaHasta) {
            return {
                desde: fechaDesde,
                hasta: fechaHasta,
                label: `${new Date(fechaDesde).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })} - ${new Date(fechaHasta).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
            };
        }
        
        let diasAtras = 7;
        if (periodo === 'mes') diasAtras = 30;
        if (periodo === 'trimestre') diasAtras = 90;
        
        const desde = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        return {
            desde: desde.toISOString().split('T')[0],
            hasta: hoy.toISOString().split('T')[0],
            label: `${formatDate(desde)} - ${formatDate(hoy)}`
        };
    };

    const dateRange = getDateRange();

    useEffect(() => {
        fetchAllData();
    }, [periodo, filtrosAplicados]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);

            const range = getDateRange();
            const [dashboard, kpis, comparativa] = await Promise.all([
                dashboardApi.getDashboardStats(),
                dashboardApi.getKPIs(periodo),
                dashboardApi.getComparativa(range.desde, range.hasta),
            ]);

            setDashboardData(dashboard.data);
            setKpisData(kpis.data);
            setComparativaData(comparativa.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Chart configurations
    const lineChartData = {
        labels: dashboardData?.tendencia_7_dias?.map(d => {
            const date = new Date(d.fecha);
            return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        }) || [],
        datasets: [
            {
                label: 'Likes',
                data: dashboardData?.tendencia_7_dias?.map(d => d.likes) || [],
                borderColor: 'rgb(99, 102, 241)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Impresiones',
                data: dashboardData?.tendencia_7_dias?.map(d => d.impresiones) || [],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#94a3b8' }
            },
            title: {
                display: true,
                text: 'Tendencia Últimos 7 Días',
                color: '#f1f5f9',
                font: { size: 16, weight: 'bold' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            y: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const barChartData = {
        labels: ['Instagram', 'Facebook', 'LinkedIn'],
        datasets: [
            {
                label: 'Publicaciones',
                data: [
                    comparativaData?.comparativa?.instagram?.total_posts || 0,
                    comparativaData?.comparativa?.facebook?.total_posts || 0,
                    comparativaData?.comparativa?.linkedin?.total_posts || 0,
                ],
                backgroundColor: [
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                ],
                borderColor: [
                    'rgb(236, 72, 153)',
                    'rgb(59, 130, 246)',
                    'rgb(14, 165, 233)',
                ],
                borderWidth: 2,
                borderRadius: 8,
            },
        ],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Publicaciones por Plataforma',
                color: '#f1f5f9',
                font: { size: 16, weight: 'bold' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            },
            y: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            }
        }
    };

    const doughnutData = {
        labels: dashboardData?.por_plataforma?.map(p => p.plataforma) || ['Sin datos'],
        datasets: [
            {
                data: dashboardData?.por_plataforma?.map(p => p.total_posts) || [1],
                backgroundColor: [
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(14, 165, 233, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                ],
                borderColor: [
                    'rgb(236, 72, 153)',
                    'rgb(59, 130, 246)',
                    'rgb(14, 165, 233)',
                    'rgb(249, 115, 22)',
                ],
                borderWidth: 2,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', padding: 20 }
            },
            title: {
                display: true,
                text: 'Distribución por Plataforma',
                color: '#f1f5f9',
                font: { size: 16, weight: 'bold' }
            }
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    const handleApplyFilters = () => {
        if (fechaDesde && fechaHasta) {
            setFiltrosAplicados(true);
        }
    };

    const handleClearFilters = () => {
        setFechaDesde('');
        setFechaHasta('');
        setFiltrosAplicados(false);
    };

    return (
        <Layout>
            <div className="analytics-dashboard">
                {/* Header */}
                <div className="analytics-page-header">
                    <div className="header-title">
                        <h1><BarChart3 size={28} /> Dashboard Analytics</h1>
                        <p>Métricas y rendimiento de tus campañas</p>
                    </div>
                    <div className="period-selector">
                        <button 
                            className={`period-btn ${periodo === 'semana' && !filtrosAplicados ? 'active' : ''}`}
                            onClick={() => { setPeriodo('semana'); setFiltrosAplicados(false); }}
                        >
                            Semana
                        </button>
                        <button 
                            className={`period-btn ${periodo === 'mes' && !filtrosAplicados ? 'active' : ''}`}
                            onClick={() => { setPeriodo('mes'); setFiltrosAplicados(false); }}
                        >
                            Mes
                        </button>
                        <button 
                            className={`period-btn ${periodo === 'trimestre' && !filtrosAplicados ? 'active' : ''}`}
                            onClick={() => { setPeriodo('trimestre'); setFiltrosAplicados(false); }}
                        >
                            Trimestre
                        </button>
                    </div>
                </div>

            {/* Filters Section */}
            <section className="filters-section">
                <div className="filters-container">
                    <div className="filter-group">
                        <label><Calendar size={16} /> Desde:</label>
                        <input 
                            type="date" 
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="date-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label><Calendar size={16} /> Hasta:</label>
                        <input 
                            type="date" 
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="date-input"
                        />
                    </div>
                    <div className="filter-actions">
                        <button 
                            className="filter-btn apply"
                            onClick={handleApplyFilters}
                            disabled={!fechaDesde || !fechaHasta}
                        >
                            <Search size={16} /> Aplicar Filtro
                        </button>
                        {filtrosAplicados && (
                            <button 
                                className="filter-btn clear"
                                onClick={handleClearFilters}
                            >
                                <X size={16} /> Limpiar
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Date Range Indicator */}
                <div className="date-range-indicator">
                    <span className="date-range-label"><BarChart3 size={16} /> Mostrando datos del período:</span>
                    <span className="date-range-value">{dateRange.label}</span>
                    {filtrosAplicados && (
                        <span className="filter-badge">Filtro personalizado</span>
                    )}
                </div>
            </section>

            {/* Main Content */}
            <main className="analytics-main">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Cargando analytics...</span>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <p>⚠️ {error}</p>
                        <button onClick={fetchAllData}>Reintentar</button>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <section className="kpi-section">
                            <div className="kpi-grid">
                                <div className="kpi-card kpi-publications">
                                    <div className="kpi-header">
                                        <span className="kpi-label">Total Publicaciones</span>
                                        <span className="kpi-period">{periodo}</span>
                                    </div>
                                    <div className="kpi-value">
                                        {formatNumber(kpisData?.kpis?.publicaciones_totales || 0)}
                                    </div>
                                    <div className="kpi-footer">
                                        <span className="kpi-trend positive">
                                            ↑ {kpisData?.kpis?.publicaciones_por_semana || 0}/semana
                                        </span>
                                        <div className="kpi-mini-chart">
                                            <svg viewBox="0 0 60 20">
                                                <polyline
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    points="0,15 10,12 20,14 30,8 40,10 50,5 60,7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="kpi-card kpi-engagement">
                                    <div className="kpi-header">
                                        <span className="kpi-label">Total Engagement</span>
                                        <span className="kpi-period">{periodo}</span>
                                    </div>
                                    <div className="kpi-value">
                                        {formatNumber(kpisData?.kpis?.engagement_total || 0)}
                                    </div>
                                    <div className="kpi-footer">
                                        <span className="kpi-trend positive">
                                            ~{kpisData?.kpis?.engagement_promedio_por_post || 0}/post
                                        </span>
                                        <div className="kpi-mini-chart">
                                            <svg viewBox="0 0 60 20">
                                                <polyline
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    points="0,18 10,15 20,10 30,12 40,6 50,8 60,3"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="kpi-card kpi-reach">
                                    <div className="kpi-header">
                                        <span className="kpi-label">Alcance Total</span>
                                        <span className="kpi-period">{periodo}</span>
                                    </div>
                                    <div className="kpi-value">
                                        {formatNumber(kpisData?.kpis?.alcance_total || 0)}
                                    </div>
                                    <div className="kpi-footer">
                                        <span className="kpi-trend positive">
                                            ~{formatNumber(kpisData?.kpis?.alcance_promedio_por_post || 0)}/post
                                        </span>
                                        <div className="kpi-mini-chart">
                                            <svg viewBox="0 0 60 20">
                                                <polyline
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    points="0,10 10,8 20,12 30,5 40,7 50,3 60,6"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="kpi-card kpi-rate">
                                    <div className="kpi-header">
                                        <span className="kpi-label">Tasa Engagement</span>
                                        <span className="kpi-period">{periodo}</span>
                                    </div>
                                    <div className="kpi-value">
                                        {kpisData?.kpis?.tasa_engagement || '0%'}
                                    </div>
                                    <div className="kpi-footer">
                                        <span className="kpi-trend positive">
                                            Meta: {kpisData?.kpis?.cumplimiento_frecuencia || '0%'}
                                        </span>
                                        <div className="kpi-gauge">
                                            <svg viewBox="0 0 36 18">
                                                <path
                                                    d="M3 18 A 15 15 0 0 1 33 18"
                                                    fill="none"
                                                    stroke="rgba(255,255,255,0.2)"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M3 18 A 15 15 0 0 1 33 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeDasharray="47"
                                                    strokeDashoffset={47 - (47 * parseFloat(kpisData?.kpis?.tasa_engagement || 0) / 100)}
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Charts Section */}
                        <section className="charts-section">
                            <div className="chart-card chart-line">
                                <div className="chart-container">
                                    <Line data={lineChartData} options={lineChartOptions} />
                                </div>
                            </div>

                            <div className="chart-card chart-bar">
                                <div className="chart-container">
                                    <Bar data={barChartData} options={barChartOptions} />
                                </div>
                            </div>

                            <div className="chart-card chart-doughnut">
                                <div className="chart-container">
                                    <Doughnut data={doughnutData} options={doughnutOptions} />
                                </div>
                            </div>
                        </section>

                        {/* Stats Summary */}
                        <section className="summary-section">
                            <div className="summary-card">
                            <div className="summary-icon"><Clock size={24} /></div>
                                <div className="summary-content">
                                    <span className="summary-value">{kpisData?.kpis?.tiempo_ahorrado_horas || 0}h</span>
                                    <span className="summary-label">Tiempo Ahorrado</span>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon"><DollarSign size={24} /></div>
                                <div className="summary-content">
                                    <span className="summary-value">{kpisData?.kpis?.costo_ahorrado_estimado || '$0'}</span>
                                    <span className="summary-label">Ahorro Estimado</span>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon"><Target size={24} /></div>
                                <div className="summary-content">
                                    <span className="summary-value">{kpisData?.kpis?.meta_semanal || 4}</span>
                                    <span className="summary-label">Meta Semanal</span>
                                </div>
                            </div>
                            <div className="summary-card">
                                <div className="summary-icon"><TrendingUp size={24} /></div>
                                <div className="summary-content">
                                    <span className="summary-value">{dashboardData?.resumen?.engagement_promedio || '0%'}</span>
                                    <span className="summary-label">Engagement Promedio</span>
                                </div>
                            </div>
                        </section>

                        {/* Top Content Table */}
                        <section className="table-section">
                            <div className="table-card">
                                <div className="table-header">
                                    <h3><Trophy size={20} /> Top Contenidos por Engagement</h3>
                                </div>
                                <div className="table-content">
                                    {dashboardData?.top_contenidos?.length > 0 ? (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Título</th>
                                                    <th>Plataforma</th>
                                                    <th>Likes</th>
                                                    <th>Comentarios</th>
                                                    <th>Engagement</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dashboardData.top_contenidos.map((content, index) => (
                                                    <tr key={content.contenido_id}>
                                                        <td className="rank">
                                                            <span className={`rank-badge rank-${index + 1}`}>
                                                                {index + 1}
                                                            </span>
                                                        </td>
                                                        <td className="title">{content.titulo || 'Sin título'}</td>
                                                        <td>
                                                            <span className={`platform-badge ${content.plataforma}`}>
                                                                {content.plataforma}
                                                            </span>
                                                        </td>
                                                        <td>{formatNumber(content.likes)}</td>
                                                        <td>{formatNumber(content.comentarios)}</td>
                                                        <td className="engagement">
                                                            <span className="engagement-value">
                                                                {parseFloat(content.tasa_engagement || 0).toFixed(2)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="empty-state">
                                            <p>No hay datos de contenido aún</p>
                                            <span>Los datos aparecerán cuando tengas publicaciones con métricas</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>

            </div>
        </Layout>
    );
}
