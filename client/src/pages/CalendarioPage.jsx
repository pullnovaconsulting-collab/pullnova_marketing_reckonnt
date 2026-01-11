/**
 * @fileoverview Página de Calendario de Publicaciones
 * @description Vista de calendario para programación de contenido
 */

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar, ChevronLeft, ChevronRight, Clock, Instagram, Facebook, Linkedin, Twitter, RefreshCw } from 'lucide-react';
import * as publicacionesApi from '../services/publicacionesApi';
import '../styles/Hub.css';

export default function CalendarioPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch scheduled posts from API
    useEffect(() => {
        fetchScheduledPosts();
    }, [currentDate]);

    const fetchScheduledPosts = async () => {
        try {
            setLoading(true);
            const mes = currentDate.getMonth() + 1;
            const anio = currentDate.getFullYear();
            const response = await publicacionesApi.getCalendario(mes, anio);

            if (response?.data?.publicaciones) {
                // Transform API data to match expected format
                const posts = response.data.publicaciones.map(pub => ({
                    id: pub.id,
                    date: pub.fecha_programada?.split('T')[0] || pub.fecha_programada,
                    title: pub.contenido_titulo || pub.titulo || 'Publicación programada',
                    platform: pub.plataforma?.toLowerCase() || 'instagram',
                    time: pub.fecha_programada?.split('T')[1]?.substring(0, 5) || '12:00',
                    estado: pub.estado
                }));
                setScheduledPosts(posts);
            }
        } catch (err) {
            console.error('Error loading scheduled posts:', err);
            // Fallback to demo data if API fails
            setScheduledPosts([
                { id: 1, date: '2026-01-13', title: 'Promoción de Producto', platform: 'instagram', time: '10:00' },
                { id: 2, date: '2026-01-15', title: 'Tips de Marketing', platform: 'facebook', time: '14:00' },
                { id: 3, date: '2026-01-18', title: 'Webinar Anuncio', platform: 'linkedin', time: '09:00' },
                { id: 4, date: '2026-01-20', title: 'Nuevo Producto', platform: 'instagram', time: '16:00' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const getPostsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return scheduledPosts.filter(post => post.date === dateStr);
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const getPlatformIcon = (platform) => {
        const icons = {
            instagram: <Instagram size={14} />,
            facebook: <Facebook size={14} />,
            linkedin: <Linkedin size={14} />,
            twitter: <Twitter size={14} />
        };
        return icons[platform] || null;
    };

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

    const today = new Date();
    const isToday = (day) => {
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    return (
        <Layout>
            <div className="calendario-page">
                <div className="page-header">
                    <h1 className="page-title">
                        <Calendar size={28} /> Calendario de Publicaciones
                    </h1>
                    <p className="page-subtitle">Programa y visualiza tu contenido por fecha</p>
                </div>

                <div className="calendario-container">
                    {/* Calendar Grid */}
                    <div className="calendario-grid-large">
                        <div className="calendario-header">
                            <button className="nav-btn" onClick={() => navigateMonth(-1)}>
                                <ChevronLeft size={24} />
                            </button>
                            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                            <button className="nav-btn" onClick={() => navigateMonth(1)}>
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="calendario-days-header">
                            {dayNames.map(day => (
                                <div key={day} className="day-header">{day}</div>
                            ))}
                        </div>

                        <div className="calendario-days-grid">
                            {getDaysInMonth(currentDate).map((day, index) => {
                                const posts = getPostsForDay(day);
                                return (
                                    <div
                                        key={index}
                                        className={`day-cell ${day ? 'has-day' : ''} ${isToday(day) ? 'today' : ''} ${selectedDate === day ? 'selected' : ''}`}
                                        onClick={() => day && setSelectedDate(day)}
                                    >
                                        {day && (
                                            <>
                                                <span className="day-number">{day}</span>
                                                {posts.length > 0 && (
                                                    <div className="day-posts">
                                                        {posts.map(post => (
                                                            <div key={post.id} className={`post-indicator ${post.platform}`}>
                                                                {getPlatformIcon(post.platform)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar with scheduled posts */}
                    <div className="calendario-sidebar">
                        <h3><Clock size={20} /> {selectedDate ? `Publicaciones del día ${selectedDate}` : 'Próximas Publicaciones'}</h3>
                        <div className="scheduled-posts-list">
                            {(selectedDate ? getPostsForDay(selectedDate) : scheduledPosts).length > 0 ? (
                                (selectedDate ? getPostsForDay(selectedDate) : scheduledPosts).map(post => (
                                    <div key={post.id} className="scheduled-post-card">
                                        <div className={`post-platform-icon ${post.platform}`}>
                                            {getPlatformIcon(post.platform)}
                                        </div>
                                        <div className="post-info">
                                            <span className="post-title">{post.title}</span>
                                            <span className="post-datetime">{post.date} - {post.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-posts-message">No hay publicaciones para este día.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
