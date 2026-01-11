/**
 * @fileoverview Página de Generación con IA
 * @description Generación de texto e imágenes con OpenAI y DALL-E
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as iaApi from '../services/iaApi';
import * as campanasApi from '../services/campanasApi';
import { Sparkles, Wand2, Image, Copy, Trash2 } from 'lucide-react';
import '../styles/Users.css';
import '../styles/Campanas.css';
import '../styles/Contenido.css';
import '../styles/IA.css';

export default function IAPage() {
    const { user: currentUser, logout } = useAuth();

    // Estado general
    const [activeTab, setActiveTab] = useState('copy'); // copy | mejorar | imagen
    const [status, setStatus] = useState(null);
    const [campanas, setCampanas] = useState([]);

    // Estado de generación
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Formularios
    const [copyForm, setCopyForm] = useState({
        tema: '',
        plataforma: 'instagram',
        objetivo: 'educar',
        tono: 'profesional',
        variaciones: 1,
        modelo: 'openai',
        guardar: false,
        campana_id: ''
    });

    const [mejorarForm, setMejorarForm] = useState({
        texto: '',
        instruccion: 'mejorar para redes sociales',
        modelo: 'openai'
    });

    const [imagenForm, setImagenForm] = useState({
        descripcion: '',
        prompt: '',
        estilo: 'moderno y profesional',
        colores: 'azules y blancos corporativos',
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
    });

    // Cargar estado inicial
    useEffect(() => {
        loadStatus();
        loadCampanas();
    }, []);

    const loadStatus = async () => {
        try {
            const res = await iaApi.getIAStatus();
            setStatus(res.data);
        } catch (err) {
            console.error('Error cargando status IA:', err);
        }
    };

    const loadCampanas = async () => {
        try {
            const res = await campanasApi.getCampanas(1, 50);
            setCampanas(res.data.data || []);
        } catch (err) {
            console.error('Error cargando campañas:', err);
        }
    };

    const handleGenerarCopy = async () => {
        if (!copyForm.tema.trim()) {
            setError('El tema es requerido');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setResult(null);

            const res = await iaApi.generarCopy(copyForm);
            setResult({
                type: 'copy',
                data: res.data.generacion,
                saved: res.data.contenido_guardado
            });

            if (copyForm.guardar && res.data.contenido_guardado) {
                setSuccess('Contenido generado y guardado como borrador');
            } else {
                setSuccess('Contenido generado exitosamente');
            }

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error generando copy');
        } finally {
            setGenerating(false);
        }
    };

    const handleMejorarTexto = async () => {
        if (!mejorarForm.texto.trim()) {
            setError('El texto es requerido');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setResult(null);

            const res = await iaApi.mejorarTexto(mejorarForm);
            setResult({
                type: 'mejorar',
                data: res.data
            });

            setSuccess('Texto mejorado exitosamente');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error mejorando texto');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerarPrompt = async () => {
        if (!imagenForm.descripcion.trim()) {
            setError('La descripción es requerida');
            return;
        }

        try {
            setGenerating(true);
            setError(null);

            const res = await iaApi.generarPromptImagen({
                descripcion: imagenForm.descripcion,
                estilo: imagenForm.estilo,
                colores: imagenForm.colores
            });

            // Soportar diferentes formatos de respuesta
            const generatedPrompt = res.data.prompt || res.data.contenido || res.data.prompt_imagen || '';

            setImagenForm(prev => ({
                ...prev,
                prompt: generatedPrompt
            }));

            if (!generatedPrompt) {
                setError('No se pudo generar el prompt. Verifica la respuesta de la IA.');
            } else {
                setSuccess('Prompt de imagen generado');
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            console.error('Error generando prompt:', err);
            setError(err.message || 'Error generando prompt');
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerarImagen = async () => {
        if (!imagenForm.prompt.trim()) {
            setError('El prompt es requerido');
            return;
        }

        try {
            setGenerating(true);
            setError(null);
            setResult(null);

            const res = await iaApi.generarImagen({
                prompt: imagenForm.prompt,
                size: imagenForm.size,
                quality: imagenForm.quality,
                style: imagenForm.style
            });

            // Soportar diferentes formatos de respuesta (flat o nested)
            const imageUrl = res.url ||
                res.url_imagen ||
                res.data?.url ||
                res.data?.url_imagen ||
                res.data?.data?.[0]?.url;

            if (!imageUrl) {
                console.error('Respuesta IA:', res);
                throw new Error('No se recibió una URL de imagen válida del servicio.');
            }

            setResult({
                type: 'imagen',
                data: res.data || res // Guardar toda la respuesta
            });

            setSuccess('Imagen generada exitosamente');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.message || 'Error generando imagen');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setSuccess('Copiado al portapapeles');
        setTimeout(() => setSuccess(null), 2000);
    };

    const renderStatusBadges = () => {
        if (!status) return null;


    };

    const renderResult = () => {
        if (generating) {
            return (
                <div className="ia-generating">
                    <div className="ia-generating-icon">✨</div>
                    <div className="ia-generating-text">Generando contenido con IA...</div>
                    <div className="spinner"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="ia-result-empty" style={{ color: 'var(--error-red)' }}>
                    <div className="ia-result-empty-icon">⚠️</div>
                    <p>{error}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Verifica que las API Keys estén configuradas en el servidor.
                    </p>
                </div>
            );
        }

        if (!result) {
            return (
                <div className="ia-result-empty">
                    <div className="ia-result-empty-icon">🤖</div>
                    <p>El contenido generado aparecerá aquí</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Completa el formulario y haz clic en Generar
                    </p>
                </div>
            );
        }

        if (result.type === 'copy') {
            return (
                <div className="ia-variaciones">
                    <div className="ia-variacion">
                        <span className="ia-variacion-number">Resultado</span>
                        <div className="ia-variacion-content">
                            {result.data.contenido}
                        </div>
                        <div className="ia-variacion-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => copyToClipboard(result.data.contenido)}
                            >
                                📋 Copiar
                            </button>
                        </div>
                    </div>
                    {result.data.prompt_usado && (
                        <div className="ia-image-prompt">
                            <strong>Prompt usado:</strong> {result.data.prompt_usado}
                        </div>
                    )}
                </div>
            );
        }

        if (result.type === 'mejorar') {
            return (
                <div className="ia-variaciones">
                    <div className="ia-variacion">
                        <span className="ia-variacion-number">Texto Mejorado</span>
                        <div className="ia-variacion-content">
                            {result.data.contenido || result.data.texto_mejorado}
                        </div>
                        <div className="ia-variacion-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => copyToClipboard(result.data.contenido || result.data.texto_mejorado)}
                            >
                                📋 Copiar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (result.type === 'imagen') {
            // Soportar url directa, o estructura de openai, o url_imagen
            const imageUrl = result.data.url ||
                result.data.url_imagen ||
                result.data.data?.[0]?.url ||
                result.data.data?.url; // Fallback additional check

            return (
                <div className="ia-image-result">
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="Imagen generada"
                            className="ia-generated-image"
                        />
                    )}
                    {result.data.prompt_revisado && (
                        <div className="ia-image-prompt">
                            <strong>Prompt revisado por DALL-E:</strong><br />
                            {result.data.prompt_revisado}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <Layout>
            <div className="users-page">
                <div className="page-header">
                    <h1 className="page-title"><Sparkles size={24} /> Asistente de IA</h1>
                </div>

                {/* Status badges */}
                {renderStatusBadges()}

                {/* Alertas */}
                {success && <div className="alert alert-success">✓ {success}</div>}
                {error && <div className="alert alert-error">⚠️ {error}</div>}

                {/* Tabs */}
                <div className="ia-tabs">
                    <button
                        className={`ia-tab ${activeTab === 'copy' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('copy'); setResult(null); }}
                    >
                        📝 Generar Copy
                    </button>
                    <button
                        className={`ia-tab ${activeTab === 'mejorar' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('mejorar'); setResult(null); }}
                    >
                        ✨ Mejorar Texto
                    </button>
                    <button
                        className={`ia-tab ${activeTab === 'imagen' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('imagen'); setResult(null); }}
                    >
                        🎨 Imagen
                    </button>
                </div>

                {/* Generador */}
                <div className="ia-generator">
                    {/* Panel de entrada */}
                    <div className="ia-input-panel">
                        {activeTab === 'copy' && (
                            <>
                                <h3 className="ia-panel-title">📝 Generar Copy de Marketing</h3>

                                <div className="form-group">
                                    <label className="form-label">Tema del contenido *</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={copyForm.tema}
                                        onChange={(e) => setCopyForm(prev => ({ ...prev, tema: e.target.value }))}
                                        placeholder="Ej: Promoción de Black Friday con 30% de descuento en todos los servicios"
                                        rows={3}
                                    />
                                </div>

                                <div className="ia-options">
                                    <div className="form-group">
                                        <label className="form-label">Plataforma</label>
                                        <select
                                            className="form-select"
                                            value={copyForm.plataforma}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                        >
                                            <option value="instagram">📸 Instagram</option>
                                            <option value="facebook">📘 Facebook</option>
                                            <option value="linkedin">💼 LinkedIn</option>
                                            <option value="twitter">🐦 Twitter/X</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Objetivo</label>
                                        <select
                                            className="form-select"
                                            value={copyForm.objetivo}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, objetivo: e.target.value }))}
                                        >
                                            <option value="educar">📚 Educar</option>
                                            <option value="promocionar">📢 Promocionar</option>
                                            <option value="convertir">🎯 Convertir</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="ia-options">
                                    <div className="form-group">
                                        <label className="form-label">Tono</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={copyForm.tono}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, tono: e.target.value }))}
                                            placeholder="Ej: profesional, casual, divertido"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Campaña</label>
                                        <select
                                            className="form-select"
                                            value={copyForm.campana_id}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, campana_id: e.target.value }))}
                                        >
                                            <option value="">Sin campaña</option>
                                            {campanas.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={copyForm.guardar}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, guardar: e.target.checked }))}
                                        />
                                        <span>Guardar como borrador en Contenido</span>
                                    </label>
                                </div>

                                <button
                                    className="btn-generate"
                                    onClick={handleGenerarCopy}
                                    disabled={generating || !copyForm.tema.trim()}
                                >
                                    {generating ? '⏳ Generando...' : '✨ Generar Copy'}
                                </button>
                            </>
                        )}

                        {activeTab === 'mejorar' && (
                            <>
                                <h3 className="ia-panel-title">✨ Mejorar Texto</h3>

                                <div className="form-group">
                                    <label className="form-label">Texto a mejorar *</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={mejorarForm.texto}
                                        onChange={(e) => setMejorarForm(prev => ({ ...prev, texto: e.target.value }))}
                                        placeholder="Pega aquí el texto que quieres mejorar..."
                                        rows={5}
                                    />
                                    <div className="char-counter">{mejorarForm.texto.length} caracteres</div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Instrucción</label>
                                    <select
                                        className="form-select"
                                        value={mejorarForm.instruccion}
                                        onChange={(e) => setMejorarForm(prev => ({ ...prev, instruccion: e.target.value }))}
                                    >
                                        <option value="mejorar para redes sociales">📱 Mejorar para redes sociales</option>
                                        <option value="hacerlo más profesional">💼 Hacerlo más profesional</option>
                                        <option value="hacerlo más casual y cercano">😊 Hacerlo más casual</option>
                                        <option value="resumir en menos palabras">📝 Resumir</option>
                                        <option value="expandir con más detalles">📖 Expandir</option>
                                        <option value="agregar emojis relevantes">🎯 Agregar emojis</option>
                                    </select>
                                </div>

                                <button
                                    className="btn-generate"
                                    onClick={handleMejorarTexto}
                                    disabled={generating || !mejorarForm.texto.trim()}
                                >
                                    {generating ? '⏳ Mejorando...' : '✨ Mejorar Texto'}
                                </button>
                            </>
                        )}

                        {activeTab === 'imagen' && (
                            <>
                                <h3 className="ia-panel-title">🎨 Generar Imagen con DALL-E</h3>

                                {!status?.dalle?.configurado && (
                                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                        ⚠️ DALL-E no está configurado. Agrega OPENAI_API_KEY en el .env del servidor.
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Descripción de la imagen</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={imagenForm.descripcion}
                                        onChange={(e) => setImagenForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                        placeholder="Describe qué imagen quieres crear..."
                                        rows={3}
                                    />
                                </div>

                                <button
                                    className="btn-secondary"
                                    onClick={handleGenerarPrompt}
                                    disabled={generating || !imagenForm.descripcion.trim()}
                                    style={{ marginBottom: '1rem', width: '100%' }}
                                >
                                    🪄 Generar Prompt Optimizado
                                </button>

                                <div className="form-group">
                                    <label className="form-label">Prompt para DALL-E *</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={imagenForm.prompt}
                                        onChange={(e) => setImagenForm(prev => ({ ...prev, prompt: e.target.value }))}
                                        placeholder="Prompt optimizado para la generación de imagen..."
                                        rows={4}
                                    />
                                </div>

                                <div className="image-options">
                                    <div className="form-group">
                                        <label className="form-label">Tamaño</label>
                                        <select
                                            className="form-select"
                                            value={imagenForm.size}
                                            onChange={(e) => setImagenForm(prev => ({ ...prev, size: e.target.value }))}
                                        >
                                            <option value="1024x1024">1024x1024 (Cuadrado)</option>
                                            <option value="1792x1024">1792x1024 (Horizontal)</option>
                                            <option value="1024x1792">1024x1792 (Vertical)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Calidad</label>
                                        <select
                                            className="form-select"
                                            value={imagenForm.quality}
                                            onChange={(e) => setImagenForm(prev => ({ ...prev, quality: e.target.value }))}
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="hd">HD</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Estilo</label>
                                        <select
                                            className="form-select"
                                            value={imagenForm.style}
                                            onChange={(e) => setImagenForm(prev => ({ ...prev, style: e.target.value }))}
                                        >
                                            <option value="vivid">Vivid</option>
                                            <option value="natural">Natural</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    className="btn-generate"
                                    onClick={handleGenerarImagen}
                                    disabled={generating || !imagenForm.prompt.trim() || !status?.dalle?.configurado}
                                >
                                    {generating ? '⏳ Generando imagen...' : '🎨 Generar Imagen'}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Panel de resultado */}
                    <div className="ia-result-panel">
                        <div className="ia-result-header">
                            <h3 className="ia-result-title">
                                📄 Resultado
                            </h3>
                            {result && (
                                <div className="ia-result-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setResult(null)}
                                    >
                                        🗑️ Limpiar
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="ia-result-body">
                            {renderResult()}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
