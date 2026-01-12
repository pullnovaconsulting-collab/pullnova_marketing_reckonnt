import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import reckonntLogo from '../../assets/logo-reckonnt.png';

export default function ImageTemplateEditor({ imageUrl, onSave, onCancel, initialData = {}, palette }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Refs para tracking de elementos
    const titleRef = useRef(null);
    const descRef = useRef(null);
    const bodyRef = useRef(null);

    const [title, setTitle] = useState(initialData.title || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [body, setBody] = useState(initialData.body || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Estado de la imagen
    const [imageLoaded, setImageLoaded] = useState(false);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

    // Configuración de estilo
    const [config, setConfig] = useState({
        primaryColor: palette?.colors?.primary || '#1e3a8a',
        secondaryColor: palette?.colors?.secondary || '#3b82f6',
        textColor: palette?.colors?.text || '#ffffff',
    });

    useEffect(() => {
        if (palette) {
            setConfig({
                primaryColor: palette.colors.primary,
                secondaryColor: palette.colors.secondary,
                textColor: palette.colors.text,
            });
        }
    }, [palette]);

    // Manejar carga de imagen para obtener dimensiones naturales
    const handleImageLoad = (e) => {
        setNaturalSize({
            width: e.target.naturalWidth,
            height: e.target.naturalHeight
        });
        setImageLoaded(true);
    };

    const handleSave = async () => {
        if (!imageLoaded || !containerRef.current) return;
        setIsSaving(true);
        
        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const containerFn = containerRef.current.getBoundingClientRect();
            
            // Configurar canvas al tamaño real de la imagen
            canvas.width = naturalSize.width;
            canvas.height = naturalSize.height;

            // 1. Dibujar Imagen Base
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            const token = localStorage.getItem('token');
            const isExternal = imageUrl.startsWith('http') && !imageUrl.includes(window.location.origin);
            const src = isExternal 
                ? `/api/ia/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${token}`
                : imageUrl;

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    resolve();
                };
                img.onerror = reject;
                img.src = src;
            });

            // Función helper para calcular posición relativa escalada
            const getScaledPos = (elementRef) => {
                if (!elementRef.current) return null;
                const rect = elementRef.current.getBoundingClientRect();
                const scaleX = naturalSize.width / containerFn.width;
                const scaleY = naturalSize.height / containerFn.height;
                
                return {
                    x: (rect.left - containerFn.left) * scaleX,
                    y: (rect.top - containerFn.top) * scaleY,
                    width: rect.width * scaleX,
                    height: rect.height * scaleY
                };
            };

            // 2. Título (Si existe y es visible)
            if (title && titleRef.current) {
                const pos = getScaledPos(titleRef);
                // Ajustar fuente basado en el ancho real vs ancho display
                const fontSize = Math.floor(naturalSize.width * 0.08);
                
                ctx.textAlign = 'left'; // DOM es left-aligned por defecto
                ctx.textBaseline = 'top';
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.fillStyle = config.primaryColor;
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
                ctx.shadowBlur = 10;
                
                // Ajuste fino de posición para que coincida visualmente con el DOM
                ctx.fillText(title, pos.x, pos.y);
                ctx.shadowBlur = 0;
            }

            // 3. Descripción
            if (description && descRef.current) {
                const pos = getScaledPos(descRef);
                const fontSize = Math.floor(naturalSize.width * 0.04);
                
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillStyle = config.secondaryColor;
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
                ctx.shadowBlur = 10;
                
                ctx.fillText(description, pos.x, pos.y);
                ctx.shadowBlur = 0;
            }

            // 4. Lista Central (Body)
            if (body && bodyRef.current) {
                const pos = getScaledPos(bodyRef);
                const lines = body.split('\n').slice(0, 3);
                const fontSize = Math.floor(naturalSize.width * 0.045);
                const padding = 50; // Usar medidas relativas si es posible, o fijas escaladas
                const lineHeight = fontSize * 1.5;

                // Dibujar caja
                ctx.fillStyle = config.primaryColor;
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                // Usamos el width/height calculado del DOM
                ctx.roundRect(pos.x, pos.y, pos.width, pos.height, 15);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Dibujar texto
                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillStyle = config.textColor;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                
                // Calcular padding relativo al escalado
                // El padding en CSS era ~2rem (32px) o relativo.
                // En canvas original era 50px. Vamos a intentar mantener proporción.
                // Si el canvas original asume padding 50px para width 1000px+, lo mantenemos.
                // Pero aquí pos.width viene del DOM.
                
                // Iterar líneas
                lines.forEach((line, index) => {
                    // Offset simple para el texto dentro de la caja
                    // Ajustamos un poco para que entre centrado/padding
                    const textX = pos.x + (pos.width * 0.05); // 5% padding left
                    const textY = pos.y + (pos.height * 0.1) + (index * lineHeight); 
                    ctx.fillText(line, textX, textY);
                });
            }

            // 5. Logo (Fijo abajo derecha por ahora, o podría hacerse draggable también)
            // Mantenemos logo fijo para mantener identidad de marca, o lo hacemos parte del fondo
            const logo = new Image();
            logo.src = reckonntLogo;
            await new Promise((resolve) => {
                logo.onload = () => {
                    const logoWidth = canvas.width * 0.15;
                    const logoHeight = (logo.height / logo.width) * logoWidth;
                    const logoX = canvas.width - logoWidth - 40;
                    const logoY = canvas.height - logoHeight - 40;

                    ctx.shadowColor = "rgba(0,0,0,0.3)";
                    ctx.shadowBlur = 10;
                    ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                    ctx.shadowBlur = 0;
                    resolve();
                };
                logo.onerror = resolve; // Continuar aunque falle logo
            });

            // Exportar
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob, 'processed-image.png');
                await onSave(formData);
            }, 'image/png');

        } catch (error) {
            console.error('Error guardando:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className="template-editor" style={{ 
            display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem',
            padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)'
        }}>
            {/* Área de Preview Draggable */}
            <div className="editor-preview" style={{ 
                display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)',
                padding: '1rem', borderRadius: '0.5rem', minHeight: '300px', overflow: 'hidden'
            }}>
                <div 
                    ref={containerRef}
                    style={{ 
                        position: 'relative', 
                        display: 'inline-block',
                        maxWidth: '100%',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <img 
                        src={imageUrl} 
                        onLoad={handleImageLoad}
                        alt="Workspace"
                        style={{ display: 'block', maxWidth: '100%', maxHeight: '500px', height: 'auto', pointerEvents: 'none' }} 
                    />

                    {/* Elementos Draggable - Solo visibles si hay texto */}
                    {/* Título */}
                    {title && (
                        <Draggable nodeRef={titleRef} bounds="parent">
                            <div ref={titleRef} style={{
                                position: 'absolute', top: '10%', right: '5%',
                                cursor: 'move', zIndex: 10,
                                fontSize: 'clamp(1rem, 4vw, 3rem)', // Responsivo
                                fontWeight: 'bold',
                                color: config.primaryColor,
                                textShadow: '0 0 10px rgba(255,255,255,0.8)',
                                whiteSpace: 'nowrap'
                            }}>
                                {title}
                            </div>
                        </Draggable>
                    )}

                    {/* Descripción */}
                    {description && (
                        <Draggable nodeRef={descRef} bounds="parent">
                            <div ref={descRef} style={{
                                position: 'absolute', top: '20%', right: '5%',
                                cursor: 'move', zIndex: 10,
                                fontSize: 'clamp(0.8rem, 2vw, 1.5rem)',
                                color: config.secondaryColor,
                                textShadow: '0 0 10px rgba(255,255,255,0.8)',
                                whiteSpace: 'nowrap'
                            }}>
                                {description}
                            </div>
                        </Draggable>
                    )}

                    {/* Body / Lista */}
                    {body && (
                        <Draggable nodeRef={bodyRef} bounds="parent">
                            <div ref={bodyRef} style={{
                                position: 'absolute', bottom: '20%', right: '5%',
                                cursor: 'move', zIndex: 10,
                                backgroundColor: config.primaryColor,
                                color: config.textColor,
                                padding: '1.5rem',
                                borderRadius: '15px',
                                boxShadow: '0 0 15px rgba(0,0,0,0.3)',
                                fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
                                maxWidth: '60%'
                            }}>
                                {body.split('\n').slice(0, 3).map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        </Draggable>
                    )}
                </div>
            </div>

            {/* Canvas oculto para generación final */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div className="editor-controls">
                <h3 style={{ color: 'var(--text-primary)' }}>Personalizar Plantilla (Arrastra los textos)</h3>
                
                <div className="form-group">
                    <label className="form-label">Título</label>
                    <input 
                        type="text" className="form-input"
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título del post"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <input 
                        type="text" className="form-input"
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción corta"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Lista / Contenido</label>
                    <textarea 
                        className="form-input form-textarea"
                        value={body} onChange={(e) => setBody(e.target.value)}
                        placeholder="• Ítem 1&#10;• Ítem 2&#10;• Ítem 3"
                        rows={3}
                    />
                </div>

                <div className="editor-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        type="button" className="btn-primary"
                        onClick={handleSave} disabled={isSaving}
                    >
                        {isSaving ? 'Guardando...' : '💾 Guardar Imagen Procesada'}
                    </button>
                    <button 
                        type="button" className="btn-secondary"
                        onClick={onCancel} disabled={isSaving}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
