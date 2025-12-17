/**
 * @fileoverview Modal de Usuario
 * @description Componente modal para crear/editar usuarios
 */

import { useState, useEffect } from 'react';

const ROLES = [
    { value: 'viewer', label: 'Viewer' },
    { value: 'editor', label: 'Editor' },
    { value: 'admin', label: 'Admin' }
];

const ESTADOS = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' }
];

export default function UserModal({ isOpen, onClose, onSave, user, loading }) {
    const isEditing = !!user;

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'viewer',
        estado: 'activo'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                nombre: user.nombre || '',
                email: user.email || '',
                password: '',
                rol: user.rol || 'viewer',
                estado: user.estado || 'activo'
            });
        } else {
            setFormData({
                nombre: '',
                email: '',
                password: '',
                rol: 'viewer',
                estado: 'activo'
            });
        }
        setErrors({});
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!isEditing && !formData.password) {
            newErrors.password = 'La contraseña es requerida';
        } else if (!isEditing && formData.password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        const dataToSave = { ...formData };

        // No enviar password vacío en edición
        if (isEditing && !dataToSave.password) {
            delete dataToSave.password;
        }

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="nombre">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                className="form-input"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                            {errors.nombre && (
                                <span className="form-error">{errors.nombre}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="correo@ejemplo.com"
                            />
                            {errors.email && (
                                <span className="form-error">{errors.email}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">
                                Contraseña {!isEditing && '*'}
                                {isEditing && <span style={{ fontWeight: 'normal', fontSize: '0.8rem' }}> (dejar vacío para mantener)</span>}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                            />
                            {errors.password && (
                                <span className="form-error">{errors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="rol">
                                Rol
                            </label>
                            <select
                                id="rol"
                                name="rol"
                                className="form-select"
                                value={formData.rol}
                                onChange={handleChange}
                            >
                                {ROLES.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {isEditing && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="estado">
                                    Estado
                                </label>
                                <select
                                    id="estado"
                                    name="estado"
                                    className="form-select"
                                    value={formData.estado}
                                    onChange={handleChange}
                                >
                                    {ESTADOS.map(estado => (
                                        <option key={estado.value} value={estado.value}>
                                            {estado.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
