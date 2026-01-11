/**
 * @fileoverview Layout Component
 * @description Layout principal con navegación persistente
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
    Sparkles,
    Calendar,
    CheckCircle,
    BarChart3,
    Settings,
    Users,
    Megaphone,
    FileText,
    LogOut,
    ChevronDown,
    User,
    Home
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import '../styles/Layout.css';

export default function Layout({ children, activeTab }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isAdmin = user?.rol === 'admin';
    const isEditor = user?.rol === 'admin' || user?.rol === 'editor';

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: '', icon: Home, show: isEditor },
        { path: '/campanas', label: 'Campañas', icon: Megaphone, show: isEditor },
        { path: '/contenido', label: 'Contenido', icon: FileText, show: isEditor },
        { path: '/calendario', label: 'Calendario', icon: Calendar, show: isEditor },
        { path: '/aprobaciones', label: 'Aprobaciones', icon: CheckCircle, show: false },
        { path: '/analytics', label: 'Analytics', icon: BarChart3, show: true },
    ];

    const dropdownItems = [
        { path: '/usuarios', label: 'Usuarios', icon: Users, show: isAdmin },
    ];

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="header-left">
                    <NavLink to="/" className="logo">
                        <div className="logo-icon">P</div>
                        <span className="logo-text">PULLNOVA</span>
                    </NavLink>

                    <nav className="main-nav">
                        {navItems.filter(item => item.show).map(item => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="header-right">
                    <ThemeToggle />

                    <div className="user-dropdown" ref={dropdownRef}>
                        <button
                            className="user-dropdown-trigger"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            <div className="user-avatar">
                                <User size={18} />
                            </div>
                            <span className="user-name">{user?.nombre || 'Usuario'}</span>
                            <ChevronDown size={16} className={`chevron ${dropdownOpen ? 'open' : ''}`} />
                        </button>

                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-header">
                                    <span className="dropdown-email">{user?.email}</span>
                                    <span className="dropdown-role">{user?.rol}</span>
                                </div>
                                <div className="dropdown-divider" />

                                {dropdownItems.filter(item => item.show).map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className="dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <item.icon size={16} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                ))}

                                <div className="dropdown-divider" />
                                <button className="dropdown-item logout" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="layout-main">
                {children}
            </main>

            <footer className="layout-footer">
                <p>© 2025 PULLNOVA - Sistema de Marketing con IA</p>
            </footer>
        </div>
    );
}
