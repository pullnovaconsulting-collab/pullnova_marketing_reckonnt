/**
 * @fileoverview Modal de Campaña
 * @description Componente modal para crear/editar campañas de marketing
 */

import { useState, useEffect } from 'react';

const ESTADOS = [
    { value: 'borrador', label: 'Borrador', color: 'gray' },
    { value: 'activa', label: 'Activa', color: 'green' },
    { value: 'pausada', label: 'Pausada', color: 'orange' },
    { value: 'completada', label: 'Completada', color: 'blue' }
];

const KPIS = [
    { value: 'alcance', label: 'Alcance' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'leads', label: 'Leads' }
];

const PLATAFORMAS = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' }
];

export default function CampanaModal({ isOpen, onClose, onSave, campana, loading }) {
    const isEditing = !!campana;

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        objetivo: '',
        estado: 'borrador',
        fecha_inicio: '',
        fecha_fin: '',
        presupuesto: '',
        plataformas: [],
        kpi_principal: 'alcance'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (campana) {
            let parsedPlataformas = [];
            try {
                if (Array.isArray(campana.plataformas)) {
                    parsedPlataformas = campana.plataformas;
                } else if (typeof campana.plataformas === 'string') {
                    // Intentar parsear si es string
                    if (campana.plataformas.trim().startsWith('[') || campana.plataformas.trim().startsWith('{')) {
                        parsedPlataformas = JSON.parse(campana.plataformas);
                    } else {
                        // Si no es JSON valido, quizas es vacio o invalido
                        parsedPlataformas = [];
                    }
                }
            } catch (e) {
                console.error('Error parsing plataformas:', e);
                parsedPlataformas = [];
            }

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                try {
                    return new Date(dateStr).toISOString().split('T')[0];
                } catch (e) {
                    console.error('Error formatting date:', e);
                    return '';
                }
            };

            setFormData({
                nombre: campana.nombre || '',
                descripcion: campana.descripcion || '',
                objetivo: campana.objetivo || '',
                estado: campana.estado || 'borrador',
                fecha_inicio: formatDate(campana.fecha_inicio),
                fecha_fin: formatDate(campana.fecha_fin),
                presupuesto: campana.presupuesto || '',
                plataformas: Array.isArray(parsedPlataformas) ? parsedPlataformas : [],
                kpi_principal: campana.kpi_principal || 'alcance'
            });
        } else {
            setFormData({
                nombre: '',
                descripcion: '',
                objetivo: '',
                estado: 'borrador',
                fecha_inicio: '',
                fecha_fin: '',
                presupuesto: '',
                plataformas: [],
                kpi_principal: 'alcance'
            });
        }
        setErrors({});
    }, [campana, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePlataformaToggle = (plataforma) => {
        setFormData(prev => {
            const current = prev.plataformas || [];
            if (current.includes(plataforma)) {
                return { ...prev, plataformas: current.filter(p => p !== plataforma) };
            } else {
                return { ...prev, plataformas: [...current, plataforma] };
            }
        });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }

        if (formData.fecha_inicio && formData.fecha_fin) {
            if (new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)) {
                newErrors.fecha_fin = 'La fecha de fin debe ser posterior al inicio';
            }
        }

        if (formData.presupuesto && isNaN(parseFloat(formData.presupuesto))) {
            newErrors.presupuesto = 'El presupuesto debe ser un número';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        const dataToSave = {
            ...formData,
            presupuesto: formData.presupuesto ? parseFloat(formData.presupuesto) : null,
            plataformas: formData.plataformas.length > 0 ? formData.plataformas : null,
            fecha_inicio: formData.fecha_inicio || null,
            fecha_fin: formData.fecha_fin || null
        };

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? '📊 Editar Campaña' : '📊 Nueva Campaña'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Nombre */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="nombre">
                                Nombre de la Campaña *
                            </label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                className="form-input"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Campaña Black Friday "
                            />
                            {errors.nombre && <span className="form-error">{errors.nombre}</span>}
                        </div>

                        {/* Descripción */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="descripcion">
                                Descripción
                            </label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                className="form-input form-textarea"
                                value={formData.descripcion}
                                onChange={handleChange}
                                placeholder="Describe los objetivos y alcance de la campaña..."
                                rows={3}
                            />
                        </div>

                        {/* Objetivo */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="objetivo">
                                Objetivo Principal
                            </label>
                            <input
                                type="text"
                                id="objetivo"
                                name="objetivo"
                                className="form-input"
                                value={formData.objetivo}
                                onChange={handleChange}
                                placeholder="Ej: Aumentar ventas en un 20%"
                            />
                        </div>

                        {/* Row de fechas */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="fecha_inicio">
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    id="fecha_inicio"
                                    name="fecha_inicio"
                                    className="form-input"
                                    value={formData.fecha_inicio}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="fecha_fin">
                                    Fecha de Fin
                                </label>
                                <input
                                    type="date"
                                    id="fecha_fin"
                                    name="fecha_fin"
                                    className="form-input"
                                    value={formData.fecha_fin}
                                    onChange={handleChange}
                                />
                                {errors.fecha_fin && <span className="form-error">{errors.fecha_fin}</span>}
                            </div>
                        </div>

                        {/* Row presupuesto y KPI */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="presupuesto">
                                    Presupuesto ($)
                                </label>
                                <input
                                    type="number"
                                    id="presupuesto"
                                    name="presupuesto"
                                    className="form-input"
                                    value={formData.presupuesto}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                />
                                {errors.presupuesto && <span className="form-error">{errors.presupuesto}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="kpi_principal">
                                    KPI Principal
                                </label>
                                <select
                                    id="kpi_principal"
                                    name="kpi_principal"
                                    className="form-select"
                                    value={formData.kpi_principal}
                                    onChange={handleChange}
                                >
                                    {KPIS.map(kpi => (
                                        <option key={kpi.value} value={kpi.value}>
                                            {kpi.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Estado (solo en edición) */}
                        {/* Estado */}
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

                        {/* Plataformas */}

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
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Campaña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
