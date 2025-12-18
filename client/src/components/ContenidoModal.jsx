/**
 * @fileoverview Modal de Contenido
 * @description Componente modal para crear/editar contenido de marketing
 */

import { useState, useEffect } from 'react';

const TIPOS = [
    { value: 'post', label: 'Post', icon: '📝' },
    { value: 'imagen', label: 'Imagen', icon: '🖼️' },
    { value: 'video', label: 'Video', icon: '🎬' },
    { value: 'carrusel', label: 'Carrusel', icon: '📚' },
    { value: 'story', label: 'Story', icon: '📱' }
];

const PLATAFORMAS = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' }
];

const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente', color: 'orange' },
    { value: 'aprobado', label: 'Aprobado', color: 'green' },
    { value: 'programado', label: 'Programado', color: 'blue' },
    { value: 'publicado', label: 'Publicado', color: 'purple' },
    { value: 'rechazado', label: 'Rechazado', color: 'red' }
];

export default function ContenidoModal({ isOpen, onClose, onSave, contenido, campanas = [], loading }) {
    const isEditing = !!contenido;

    const [formData, setFormData] = useState({
        titulo: '',
        copy_texto: '',
        contenido: '',
        tipo: 'post',
        plataforma: 'instagram',
        estado: 'pendiente',
        campana_id: '',
        fecha_publicacion: '',
        prompt_usado: '',
        modelo_ia: ''
    });
    const [errors, setErrors] = useState({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (contenido) {
            setFormData({
                titulo: contenido.titulo || '',
                copy_texto: contenido.copy_texto || '',
                contenido: contenido.contenido || '',
                tipo: contenido.tipo || 'post',
                plataforma: contenido.plataforma || 'instagram',
                estado: contenido.estado || 'pendiente',
                campana_id: contenido.campana_id || '',
                fecha_publicacion: contenido.fecha_publicacion ? contenido.fecha_publicacion.split('T')[0] : '',
                prompt_usado: contenido.prompt_usado || '',
                modelo_ia: contenido.modelo_ia || ''
            });
            if (contenido.prompt_usado || contenido.modelo_ia) {
                setShowAdvanced(true);
            }
        } else {
            setFormData({
                titulo: '',
                copy_texto: '',
                contenido: '',
                tipo: 'post',
                plataforma: 'instagram',
                estado: 'pendiente',
                campana_id: '',
                fecha_publicacion: '',
                prompt_usado: '',
                modelo_ia: ''
            });
            setShowAdvanced(false);
        }
        setErrors({});
    }, [contenido, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.titulo.trim()) {
            newErrors.titulo = 'El título es requerido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validate()) return;

        const dataToSave = {
            ...formData,
            campana_id: formData.campana_id ? parseInt(formData.campana_id) : null,
            fecha_publicacion: formData.fecha_publicacion || null
        };

        // Limpiar campos vacíos
        Object.keys(dataToSave).forEach(key => {
            if (dataToSave[key] === '' || dataToSave[key] === null) {
                if (key !== 'campana_id') delete dataToSave[key];
            }
        });

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? '📝 Editar Contenido' : '📝 Nuevo Contenido'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Título */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="titulo">
                                Título *
                            </label>
                            <input
                                type="text"
                                id="titulo"
                                name="titulo"
                                className="form-input"
                                value={formData.titulo}
                                onChange={handleChange}
                                placeholder="Título del contenido"
                            />
                            {errors.titulo && <span className="form-error">{errors.titulo}</span>}
                        </div>

                        {/* Copy / Texto principal */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="copy_texto">
                                Copy / Texto del Post
                            </label>
                            <textarea
                                id="copy_texto"
                                name="copy_texto"
                                className="form-input form-textarea"
                                value={formData.copy_texto}
                                onChange={handleChange}
                                placeholder="Escribe el copy para la publicación..."
                                rows={4}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {formData.copy_texto.length} caracteres
                            </div>
                        </div>

                        {/* Tipo y Plataforma */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Tipo de Contenido</label>
                                <div className="chips-row">
                                    {TIPOS.map(tipo => (
                                        <button
                                            key={tipo.value}
                                            type="button"
                                            className={`chip-btn ${formData.tipo === tipo.value ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, tipo: tipo.value }))}
                                        >
                                            <span>{tipo.icon}</span>
                                            <span>{tipo.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Plataforma</label>
                                <div className="chips-row">
                                    {PLATAFORMAS.map(plat => (
                                        <button
                                            key={plat.value}
                                            type="button"
                                            className={`chip-btn ${formData.plataforma === plat.value ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, plataforma: plat.value }))}
                                        >
                                            <span>{plat.icon}</span>
                                            <span>{plat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Campaña y Estado */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="campana_id">
                                    Campaña Asociada
                                </label>
                                <select
                                    id="campana_id"
                                    name="campana_id"
                                    className="form-select"
                                    value={formData.campana_id}
                                    onChange={handleChange}
                                >
                                    <option value="">Sin campaña</option>
                                    {campanas.map(camp => (
                                        <option key={camp.id} value={camp.id}>
                                            {camp.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                                    {ESTADOS.map(est => (
                                        <option key={est.value} value={est.value}>
                                            {est.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Fecha de publicación */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="fecha_publicacion">
                                Fecha de Publicación Programada
                            </label>
                            <input
                                type="datetime-local"
                                id="fecha_publicacion"
                                name="fecha_publicacion"
                                className="form-input"
                                value={formData.fecha_publicacion}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Sección avanzada (IA) */}
                        <div className="form-section-toggle">
                            <button
                                type="button"
                                className="toggle-advanced-btn"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? '▼' : '▶'} Información de IA (opcional)
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="advanced-section">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="prompt_usado">
                                        Prompt Usado
                                    </label>
                                    <textarea
                                        id="prompt_usado"
                                        name="prompt_usado"
                                        className="form-input form-textarea"
                                        value={formData.prompt_usado}
                                        onChange={handleChange}
                                        placeholder="Prompt utilizado para generar el contenido con IA..."
                                        rows={2}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="modelo_ia">
                                        Modelo de IA
                                    </label>
                                    <input
                                        type="text"
                                        id="modelo_ia"
                                        name="modelo_ia"
                                        className="form-input"
                                        value={formData.modelo_ia}
                                        onChange={handleChange}
                                        placeholder="ej: gemini, gpt-4, dall-e-3"
                                    />
                                </div>
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
                            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Contenido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
