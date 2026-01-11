/**
 * @fileoverview Modal de Contenido con IA Integrada
 * @description Componente modal para crear/editar contenido con funcionalidades de IA
 */

import { useState, useEffect } from 'react';
import PostTab from './contenido/PostTab';
import VideoTab from './contenido/VideoTab';
import StoryTab from './contenido/StoryTab';

const TIPOS = [
    { value: 'post', label: 'Post', icon: '📝' },
    { value: 'imagen', label: 'Imagen', icon: '🖼️' }
];

const PLATAFORMAS = [
    { value: 'instagram', label: 'Instagram', icon: '📸' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' }
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

    // Estados del formulario principal
    const [activeTab, setActiveTab] = useState('post');
    const [formData, setFormData] = useState({
        titulo: '',
        copy_texto: '',
        contenido: '',
        tipo: 'post',
        plataforma: 'instagram',
        estado: 'programado',
        campana_id: '',
        fecha_publicacion: '',
        prompt_usado: '',
        modelo_ia: ''
    });
    const [errors, setErrors] = useState({});

    // Estados de IA compartidos/confirmados
    const [confirmedImages, setConfirmedImages] = useState([]); // Array de { url, prompt }
    const [aiError, setAiError] = useState(null);
    const [aiSuccess, setAiSuccess] = useState(null);

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
            setActiveTab(contenido.tipo || 'post');
        } else {
            setFormData({
                titulo: '',
                copy_texto: '',
                contenido: '',
                tipo: 'post',
                plataforma: 'instagram',
                estado: 'programado',
                campana_id: '',
                fecha_publicacion: '',
                prompt_usado: '',
                modelo_ia: ''
            });
            setActiveTab('post');
        }
        setErrors({});
        // Cargar imágenes existentes (si hay)
        if (contenido && contenido.imagenes && Array.isArray(contenido.imagenes) && contenido.imagenes.length > 0) {
            setConfirmedImages(contenido.imagenes.map(img => ({
                url: img.url_imagen || img.url,
                prompt: img.prompt_imagen || img.prompt || ''
            })));
        } else if (contenido && contenido.imagen_url) {
            // Compatibilidad hacia atrás (si solo tenía un campo de imagen)
            setConfirmedImages([{
                url: contenido.imagen_url,
                prompt: contenido.imagen_prompt || ''
            }]);
        } else {
            setConfirmedImages([]);
        }
        setAiError(null);
        setAiSuccess(null);
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
            tipo: activeTab, // Usar activeTab como tipo final
            campana_id: formData.campana_id ? parseInt(formData.campana_id) : null,
            fecha_publicacion: formData.fecha_publicacion || null
        };

        // Si hay imágenes confirmadas, agregarlas a los datos
        if (confirmedImages.length > 0) {
            dataToSave.imagenes = confirmedImages;
            // Backward compatibility (opcional, usa la primera imagen)
            dataToSave.imagen_url = confirmedImages[0].url;
            dataToSave.imagen_prompt = confirmedImages[0].prompt;
        }

        // Limpiar campos vacíos (excepto campana_id e imagen_url)
        Object.keys(dataToSave).forEach(key => {
            if (dataToSave[key] === '' || dataToSave[key] === null) {
                if (key !== 'campana_id' && key !== 'imagen_url') delete dataToSave[key];
            }
        });

        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditing ? '📝 Editar Contenido' : '✨ Generar Contenido con IA'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {/* Selector de Tipo de Contenido */}
                <div className="type-selector-container" style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
                    <div className="type-selector" style={{
                        display: 'flex',
                        gap: '1rem',
                        borderBottom: '2px solid #eee',
                        paddingBottom: '0.5rem'
                    }}>
                        {TIPOS.map(tipo => (
                            <button
                                key={tipo.value}
                                type="button"
                                className={`type-btn ${activeTab === tipo.value ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(tipo.value);
                                    setFormData(prev => ({ ...prev, tipo: tipo.value }));
                                }}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '0.5rem 1rem',
                                    fontSize: '1rem',
                                    fontWeight: activeTab === tipo.value ? '600' : '400',
                                    color: activeTab === tipo.value ? 'var(--primary-color)' : '#666',
                                    borderBottom: activeTab === tipo.value ? '2px solid var(--primary-color)' : 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '-0.6rem' // overlap border
                                }}
                            >
                                <span>{tipo.icon}</span>
                                {tipo.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Alertas de IA */}
                        {aiSuccess && <div className="alert alert-success">✓ {aiSuccess}</div>}
                        {aiError && <div className="alert alert-error">⚠️ {aiError}</div>}

                        <div className="form-row">
                            {/* Título */}
                            <div className="form-group" style={{ flex: 2 }}>
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

                            {/* Campaña Asociada - MOVIDO AQUÍ */}
                            <div className="form-group" style={{ flex: 1 }}>
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
                        </div>

                        {/* Renderizado dinámico de pestañas */}
                        {(activeTab === 'post' || activeTab === 'imagen') && (
                            <PostTab
                                formData={{ ...formData, tipo: activeTab }} // Asegurar que pase el tipo correcto
                                handleChange={handleChange}
                                setFormData={setFormData}
                                aiError={aiError}
                                setAiError={setAiError}
                                aiSuccess={aiSuccess}
                                setAiSuccess={setAiSuccess}
                                confirmedImages={confirmedImages}
                                setConfirmedImages={setConfirmedImages}
                            />
                        )}



                        {/* Campos comunes a todos los tipos */}
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                            {/* Plataforma */}
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

                            {/* Estado y Fecha */}
                            <div className="form-row">
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

                                <div className="form-group">
                                    <label className="form-label" htmlFor="fecha_publicacion">
                                        Fecha de Publicación
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
                            </div>
                        </div>
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
            </div >
        </div >
    );
}
