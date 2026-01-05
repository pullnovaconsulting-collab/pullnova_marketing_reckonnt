import { useState } from 'react';
import * as iaApi from '../../services/iaApi';
import ImageTemplateEditor from './ImageTemplateEditor';

export default function PostTab({ 
    formData, 
    handleChange, 
    setFormData, 
    aiError, 
    setAiError, 
    aiSuccess, 
    setAiSuccess,
    confirmedImages,
    setConfirmedImages
}) {
    // Estados de IA - Generación de texto
    const [showTextAI, setShowTextAI] = useState(false);
    const [generatingText, setGeneratingText] = useState(false);
    const [textAIMode, setTextAIMode] = useState('copy'); // 'copy' o 'mejorar'
    const [copyForm, setCopyForm] = useState({
        tema: '',
        plataforma: formData.plataforma || 'instagram',
        objetivo: 'educar',
        tono: 'profesional'
    });
    const [mejorarForm, setMejorarForm] = useState({
        texto: '',
        instruccion: 'mejorar para redes sociales'
    });

    // Estados de IA - Generación de imagen
    const [showImageAI, setShowImageAI] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [imagenForm, setImagenForm] = useState({
        descripcion: '',
        prompt: '',
        estilo: 'moderno y profesional',
        colores: 'azules y blancos corporativos',
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
        selectedPalette: { id: 'blue', name: 'Azul Corporativo', colors: { primary: '#1e3a8a', secondary: '#3b82f6', text: '#ffffff' } }
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [confirmingImage, setConfirmingImage] = useState(false);

    // Estado para edición de plantilla
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [baseImageForEditing, setBaseImageForEditing] = useState(null);

    const handleOpenEditor = () => {
        if (imagePreview?.url_temporal) {
            setBaseImageForEditing(imagePreview.url_temporal);
            setShowTemplateEditor(true);
        }
    };

    const handleSaveProcessedImage = async (formData) => {
        try {
            setConfirmingImage(true);
            const res = await iaApi.uploadProcessedImage(formData);
            
            const r2Url = res.data.url_imagen;
            const prompt = imagePreview.prompt_revisado || imagePreview.prompt_original;
            
            setConfirmedImages(prev => [...prev, { url: r2Url, prompt: prompt }]);
            
            // Limpiar estados
            setImagePreview(null);
            setShowTemplateEditor(false);
            setBaseImageForEditing(null);
            
            setAiSuccess('Imagen procesada y guardada exitosamente');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error guardando imagen procesada');
        } finally {
            setConfirmingImage(false);
        }
    };

    // ========== Funciones de IA - Texto ==========
    const handleGenerarCopy = async () => {
        if (!copyForm.tema.trim()) {
            setAiError('El tema es requerido');
            return;
        }

        try {
            setGeneratingText(true);
            setAiError(null);

            const res = await iaApi.generarCopy({
                tema: copyForm.tema,
                plataforma: copyForm.plataforma,
                objetivo: copyForm.objetivo,
                tono: copyForm.tono,
                variaciones: 1,
                modelo: 'openai',
                guardar: false
            });

            const contenidoGenerado = res.data.generacion.contenido;
            setFormData(prev => ({ ...prev, copy_texto: contenidoGenerado }));
            setAiSuccess('Texto generado exitosamente');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error generando texto');
        } finally {
            setGeneratingText(false);
        }
    };

    const handleMejorarTexto = async () => {
        if (!mejorarForm.texto.trim()) {
            setAiError('El texto es requerido');
            return;
        }

        try {
            setGeneratingText(true);
            setAiError(null);

            const res = await iaApi.mejorarTexto({
                texto: mejorarForm.texto,
                instruccion: mejorarForm.instruccion,
                modelo: 'openai'
            });

            const textoMejorado = res.data.contenido || res.data.texto_mejorado;
            setFormData(prev => ({ ...prev, copy_texto: textoMejorado }));
            setAiSuccess('Texto mejorado exitosamente');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error mejorando texto');
        } finally {
            setGeneratingText(false);
        }
    };

    // ========== Funciones de IA - Imagen ==========
    const handleGenerarPrompt = async () => {
        if (!imagenForm.descripcion.trim()) {
            setAiError('La descripción es requerida');
            return;
        }

        try {
            setGeneratingImage(true);
            setAiError(null);

            const res = await iaApi.generarPromptImagen({
                descripcion: imagenForm.descripcion,
                estilo: imagenForm.estilo,
                colores: imagenForm.colores
            });

            const generatedPrompt = res.data.prompt || res.data.contenido || res.data.prompt_imagen || '';
            
            // Agregar instrucción de posicionamiento para la plantilla
            const promptWithLayout = `${generatedPrompt}. IMPORTANTE: La imagen debe tener una composición asimétrica. El sujeto principal o elemento focal debe estar ubicado EXCLUSIVAMENTE en el tercio IZQUIERDO de la imagen. El lado DERECHO debe quedar vacío, con un fondo limpio, desenfocado o neutro, para permitir la superposición de texto.`;
            
            setImagenForm(prev => ({ ...prev, prompt: promptWithLayout }));
            setAiSuccess('Prompt generado');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error generando prompt');
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleGenerarImagen = async () => {
        if (!imagenForm.prompt.trim()) {
            setAiError('El prompt es requerido');
            return;
        }

        try {
            setGeneratingImage(true);
            setAiError(null);

            const res = await iaApi.generarImagen({
                prompt: imagenForm.prompt,
                size: imagenForm.size,
                quality: imagenForm.quality,
                style: imagenForm.style
            });

            const imageUrl = res.data.url_temporal || res.data.url_imagen;
            const revisedPrompt = res.data.prompt_revisado;

            setImagePreview({
                url_temporal: imageUrl,
                prompt_revisado: revisedPrompt,
                prompt_original: imagenForm.prompt
            });

            setAiSuccess('Imagen generada - Confirma para usar');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error generando imagen');
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleConfirmarImagen = async () => {
        if (!imagePreview) return;

        try {
            setConfirmingImage(true);
            setAiError(null);

            const res = await iaApi.confirmarYSubirImagen({
                url_temporal: imagePreview.url_temporal,
                prompt: imagePreview.prompt_revisado || imagePreview.prompt_original
            });

            const r2Url = res.data.url_imagen;
            const prompt = imagePreview.prompt_revisado || imagePreview.prompt_original;
            
            setConfirmedImages(prev => [...prev, { url: r2Url, prompt: prompt }]);
            setImagePreview(null);
            
            setAiSuccess('Imagen confirmada - Se asociará al guardar el contenido');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error confirmando imagen');
        } finally {
            setConfirmingImage(false);
        }
    };

    const handleRechazarImagen = () => {
        setImagePreview(null);
        setAiSuccess('Imagen descartada');
        setTimeout(() => setAiSuccess(null), 2000);
    };

    // Estado para fuente de imagen
    const [imageSource, setImageSource] = useState('ai'); // 'ai' | 'manual'
    const [manualFile, setManualFile] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setManualFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview({
                url_temporal: objectUrl,
                prompt_revisado: 'Imagen subida manualmente',
                prompt_original: 'Manual upload'
            });
        }
    };

    const handleConfirmarManual = async () => {
        if (!manualFile) return;

        try {
            setConfirmingImage(true);
            setAiError(null);

            const formData = new FormData();
            formData.append('image', manualFile);

            const res = await iaApi.uploadProcessedImage(formData);
            
            setConfirmedImages(prev => [...prev, { url: res.data.url_imagen, prompt: 'Imagen subida manualmente' }]);
            setImagePreview(null);
            setManualFile(null);
            
            setAiSuccess('Imagen subida exitosamente');
            setTimeout(() => setAiSuccess(null), 3000);
        } catch (err) {
            setAiError(err.message || 'Error subiendo imagen');
        } finally {
            setConfirmingImage(false);
        }
    };

    return (
        <>
            {/* Generador de Texto con IA */}
            <div className="ai-section">
                <button
                    type="button"
                    className="ai-section-toggle"
                    onClick={() => setShowTextAI(!showTextAI)}
                >
                    {showTextAI ? '▼' : '▶'} 🤖 Generar Texto con IA
                </button>

                {showTextAI && (
                    <div className="ai-section-content">
                        <div className="ai-mode-tabs">
                            <button
                                type="button"
                                className={`ai-mode-tab ${textAIMode === 'copy' ? 'active' : ''}`}
                                onClick={() => setTextAIMode('copy')}
                            >
                                Generar Copy
                            </button>
                            <button
                                type="button"
                                className={`ai-mode-tab ${textAIMode === 'mejorar' ? 'active' : ''}`}
                                onClick={() => setTextAIMode('mejorar')}
                            >
                                Mejorar Texto
                            </button>
                        </div>

                        {textAIMode === 'copy' && (
                            <div className="ai-form">
                                <div className="form-group">
                                    <label className="form-label">Tema del contenido *</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={copyForm.tema}
                                        onChange={(e) => setCopyForm(prev => ({ ...prev, tema: e.target.value }))}
                                        placeholder="Ej: Promoción de Black Friday con 30% de descuento"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-row">
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
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Objetivo</label>
                                        <select
                                            className="form-select"
                                            value={copyForm.objetivo}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, objetivo: e.target.value }))}
                                        >
                                            <option value="educar">Educar</option>
                                            <option value="promocionar">Promocionar</option>
                                            <option value="convertir">Convertir</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tono</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={copyForm.tono}
                                            onChange={(e) => setCopyForm(prev => ({ ...prev, tono: e.target.value }))}
                                            placeholder="profesional, casual..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGenerarCopy}
                                    disabled={generatingText || !copyForm.tema.trim()}
                                >
                                    {generatingText ? '⏳ Generando...' : '✨ Generar Copy'}
                                </button>
                            </div>
                        )}

                        {textAIMode === 'mejorar' && (
                            <div className="ai-form">
                                <div className="form-group">
                                    <label className="form-label">Texto a mejorar *</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={mejorarForm.texto}
                                        onChange={(e) => setMejorarForm(prev => ({ ...prev, texto: e.target.value }))}
                                        placeholder="Pega aquí el texto que quieres mejorar..."
                                        rows={4}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Instrucción</label>
                                    <select
                                        className="form-select"
                                        value={mejorarForm.instruccion}
                                        onChange={(e) => setMejorarForm(prev => ({ ...prev, instruccion: e.target.value }))}
                                    >
                                        <option value="mejorar para redes sociales">Mejorar para redes sociales</option>
                                        <option value="hacerlo más profesional">Hacerlo más profesional</option>
                                        <option value="hacerlo más casual y cercano">Hacerlo más casual</option>
                                        <option value="resumir en menos palabras">Resumir</option>
                                        <option value="expandir con más detalles">Expandir</option>
                                        <option value="agregar emojis relevantes">Agregar emojis</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleMejorarTexto}
                                    disabled={generatingText || !mejorarForm.texto.trim()}
                                >
                                    {generatingText ? '⏳ Mejorando...' : '✨ Mejorar Texto'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Campo de texto del post */}
            <div className="form-group">
                <label className="form-label" htmlFor="copy_texto">
                    Texto del Post
                </label>
                <textarea
                    id="copy_texto"
                    name="copy_texto"
                    className="form-input form-textarea"
                    value={formData.copy_texto}
                    onChange={handleChange}
                    placeholder="Escribe o genera el copy para la publicación..."
                    rows={5}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {formData.copy_texto.length} caracteres
                </div>
            </div>

            {/* Sección de Imagen (IA o Manual) */}
            <div className="ai-section">
                <button
                    type="button"
                    className="ai-section-toggle"
                    onClick={() => setShowImageAI(!showImageAI)}
                >
                    {showImageAI ? '▼' : '▶'} 🖼️ Imagen del Post
                </button>

                {showImageAI && (
                    <div className="ai-section-content">
                        <div className="ai-mode-tabs">
                            <button
                                type="button"
                                className={`ai-mode-tab ${imageSource === 'ai' ? 'active' : ''}`}
                                onClick={() => setImageSource('ai')}
                            >
                                🎨 Generar con IA
                            </button>
                            <button
                                type="button"
                                className={`ai-mode-tab ${imageSource === 'manual' ? 'active' : ''}`}
                                onClick={() => setImageSource('manual')}
                            >
                                📤 Subir Imagen
                            </button>
                        </div>

                        <div className="ai-form">
                            {imageSource === 'ai' ? (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Descripción de la imagen</label>
                                        <textarea
                                            className="form-input form-textarea"
                                            value={imagenForm.descripcion}
                                            onChange={(e) => setImagenForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                            placeholder="Describe qué imagen quieres crear..."
                                            rows={2}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleGenerarPrompt}
                                        disabled={generatingImage || !imagenForm.descripcion.trim()}
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
                                            rows={3}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Paleta de Colores</label>
                                        <div className="color-palettes" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            {[
                                                { id: 'blue', name: 'Azul Corporativo', colors: { primary: '#1e3a8a', secondary: '#3b82f6', text: '#ffffff' }, label: '🔵 Azul' },
                                                { id: 'violet', name: 'Violeta Vibrante', colors: { primary: '#5b21b6', secondary: '#8b5cf6', text: '#ffffff' }, label: '🟣 Violeta' },
                                                { id: 'red', name: 'Vino Elegante', colors: { primary: '#881337', secondary: '#be123c', text: '#ffffff' }, label: '🔴 Vino' }
                                            ].map(palette => (
                                                <button
                                                    key={palette.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setImagenForm(prev => ({ ...prev, colores: palette.name, selectedPalette: palette }));
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        border: imagenForm.selectedPalette?.id === palette.id ? '2px solid var(--primary-color)' : '1px solid #ddd',
                                                        borderRadius: '0.5rem',
                                                        backgroundColor: palette.colors.primary,
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        opacity: imagenForm.selectedPalette?.id === palette.id ? 1 : 0.7
                                                    }}
                                                >
                                                    {palette.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-row">
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
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleGenerarImagen}
                                        disabled={generatingImage || !imagenForm.prompt.trim()}
                                    >
                                        {generatingImage ? '⏳ Generando imagen...' : '🎨 Generar Imagen'}
                                    </button>
                                </>
                            ) : (
                                <div className="manual-upload-section">
                                    <div className="form-group">
                                        <label className="form-label">Subir Imagen desde Dispositivo</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="form-input"
                                            style={{ padding: '1rem' }}
                                        />
                                    </div>
                                    
                                    {/* Paleta de colores eliminada de la sección manual según requerimiento */}
                                </div>
                            )}

                            {/* Editor de Plantilla */}
                            {showTemplateEditor && baseImageForEditing ? (
                                <ImageTemplateEditor
                                    imageUrl={baseImageForEditing}
                                    onSave={handleSaveProcessedImage}
                                    onCancel={() => setShowTemplateEditor(false)}
                                    palette={imagenForm.selectedPalette}
                                    initialData={{
                                        title: 'RECKY EASY',
                                        description: 'Sistema Administrativo',
                                        body: '• Gestión Total\n• Facturación\n• Reportes'
                                    }}
                                />
                            ) : (
                                /* Preview de imagen (Generada o Subida) */
                                imagePreview && (
                                    <div className="image-preview-container">
                                        <h4 className="image-preview-title">
                                            {imageSource === 'ai' ? 'Vista Previa de Imagen Generada' : 'Vista Previa de Imagen Subida'}
                                        </h4>
                                        <img
                                            src={imagePreview.url_temporal}
                                            alt="Preview"
                                            className="image-preview"
                                        />
                                        {imagePreview.prompt_revisado && imageSource === 'ai' && (
                                            <p className="image-preview-prompt">
                                                <strong>Prompt revisado:</strong> {imagePreview.prompt_revisado}
                                            </p>
                                        )}
                                        <div className="image-preview-actions">
                                            <button
                                                type="button"
                                                className="btn-success"
                                                onClick={imageSource === 'ai' ? handleConfirmarImagen : handleConfirmarManual}
                                                disabled={confirmingImage}
                                            >
                                                {confirmingImage ? '⏳ Guardando...' : '✓ Usar Original'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                onClick={handleOpenEditor}
                                                disabled={confirmingImage}
                                                style={{ backgroundColor: '#4F46E5' }}
                                            >
                                                🎨 Personalizar con Plantilla
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-danger"
                                                onClick={handleRechazarImagen}
                                                disabled={confirmingImage}
                                            >
                                                × Descartar
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Galería de imágenes confirmadas */}
            {confirmedImages.length > 0 ? (
                <div className="form-group">
                    <label className="form-label">Imágenes del Post ({confirmedImages.length})</label>
                    <div className="confirmed-images-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {confirmedImages.map((img, index) => (
                            <div key={index} className="confirmed-image-card" style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={img.url} alt={`Imagen ${index + 1}`} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setConfirmedImages(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        background: 'rgba(255, 0, 0, 0.8)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="form-group">
                    <label className="form-label" htmlFor="contenido">
                        URL de Imagen (Opcional)
                    </label>
                    <input
                        type="text"
                        id="contenido"
                        name="contenido"
                        className="form-input"
                        value={formData.contenido}
                        onChange={handleChange}
                        placeholder="O ingresa una URL manualmente..."
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Genera una imagen con IA arriba o ingresa una URL manualmente
                    </div>
                </div>
            )}
        </>
    );
}
