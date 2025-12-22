/**
 * @fileoverview Página de Registro
 * @description Formulario de registro de nuevos usuarios
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function RegisterPage() {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return false;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (nombre.trim().length < 2) {
            setError('El nombre debe tener al menos 2 caracteres');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const result = await register(nombre.trim(), email, password);

            if (result.success) {
                navigate('/', { replace: true });
            } else {
                setError(result.error || 'Error al registrar usuario');
            }
        } catch (err) {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <div className="logo-icon">P</div>
                        <span className="logo-text">PULLNOVA</span>
                    </div>
                    <h1 className="auth-title">Crear cuenta</h1>
                    <p className="auth-subtitle">Únete a la plataforma de marketing con IA</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="nombre" className="form-label">
                            Nombre completo
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            className="form-input"
                            placeholder="Juan Pérez"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirmar contraseña
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-input"
                            placeholder="Repite tu contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="button-spinner"></span>
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear cuenta'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        ¿Ya tienes cuenta?{' '}
                        <Link to="/login" className="auth-link">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>

            <div className="auth-decoration">
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
                <div className="decoration-circle circle-3"></div>
            </div>
        </div>
    );
}
