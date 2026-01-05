import { useState, useEffect, useRef } from 'react';
import reckonntLogo from '../../assets/logo-reckonnt.png';

export default function ImageTemplateEditor({ imageUrl, onSave, onCancel, initialData = {}, palette }) {
    const canvasRef = useRef(null);
    const [title, setTitle] = useState(initialData.title || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [body, setBody] = useState(initialData.body || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Configuración de estilo basada en la paleta seleccionada
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

    // Cargar y dibujar en el canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        const token = localStorage.getItem('token');
        const isExternal = imageUrl.startsWith('http') && !imageUrl.includes(window.location.origin);
        
        if (isExternal) {
            const proxyUrl = `/api/ia/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${token}`;
            img.src = proxyUrl;
        } else {
            img.src = imageUrl;
        }

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // 1. Dibujar imagen base
            ctx.drawImage(img, 0, 0);

            // 2. Título y Descripción (Top Right, Sin fondo)
            ctx.textAlign = 'right';
            
            // Título
            if (title) {
                const titleFontSize = Math.floor(canvas.width * 0.08); // Grande
                ctx.font = `bold ${titleFontSize}px sans-serif`;
                ctx.fillStyle = config.primaryColor; // Usar color de paleta
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)"; // Sombra blanca para contraste
                ctx.shadowBlur = 10;
                ctx.fillText(title, canvas.width - 40, titleFontSize + 40);
                ctx.shadowBlur = 0;
            }

            // Descripción
            if (description) {
                const descFontSize = Math.floor(canvas.width * 0.04); // Más pequeño
                ctx.font = `${descFontSize}px sans-serif`;
                ctx.fillStyle = config.secondaryColor;
                ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
                ctx.shadowBlur = 10;
                // Posicionar debajo del título
                const titleHeight = title ? Math.floor(canvas.width * 0.08) : 0;
                ctx.fillText(description, canvas.width - 40, titleHeight + descFontSize + 60);
                ctx.shadowBlur = 0;
            }
            ctx.textAlign = 'left'; // Reset

            // 3. Cuerpo (Centro Derecha, Caja con fondo, Lista)
            if (body) {
                const lines = body.split('\n').slice(0, 3); // Máximo 3 líneas
                const fontSize = Math.floor(canvas.width * 0.045); // Aumentado de 0.035 a 0.045
                const padding = 50; // Aumentado de 40 a 50
                const lineHeight = fontSize * 1.5;
                
                // Calcular dimensiones de la caja
                ctx.font = `${fontSize}px sans-serif`;
                let maxWidth = 0;
                lines.forEach(line => {
                    const width = ctx.measureText(line).width;
                    if (width > maxWidth) maxWidth = width;
                });
                
                const boxWidth = maxWidth + (padding * 2);
                const boxHeight = (lines.length * lineHeight) + padding;
                
                // Posición: Centrado verticalmente, Alineado a la derecha
                const boxX = canvas.width - boxWidth - 40; // Margen derecho de 40px
                const boxY = (canvas.height - boxHeight) / 2;

                // Dibujar caja
                ctx.fillStyle = config.primaryColor;
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Dibujar texto (lista)
                ctx.fillStyle = config.textColor;
                lines.forEach((line, index) => {
                    ctx.fillText(line, boxX + padding, boxY + padding + (index * lineHeight));
                });
            }

            // 4. Logo (Bottom Right, Pequeño)
            const logo = new Image();
            logo.src = reckonntLogo;
            logo.onload = () => {
                const logoWidth = canvas.width * 0.15; // 15% del ancho
                const logoHeight = (logo.height / logo.width) * logoWidth;
                
                // Alineado a la derecha
                const logoX = canvas.width - logoWidth - 40;
                const logoY = canvas.height - logoHeight - 40;

                // Sombra suave para el logo
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 10;
                ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
                ctx.shadowBlur = 0;
            };
        };
    }, [imageUrl, title, description, body, config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const canvas = canvasRef.current;
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Error al generar la imagen');
                const formData = new FormData();
                formData.append('image', blob, 'processed-image.png');
                await onSave(formData);
            }, 'image/png');
        } catch (error) {
            console.error('Error guardando imagen:', error);
            setIsSaving(false);
        }
    };

    return (
        <div className="template-editor" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid var(--border-color)', // Usar variable CSS
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary)', // Usar variable CSS para dark mode
            color: 'var(--text-primary)'
        }}>
            <div className="editor-preview" style={{ 
                display: 'flex', 
                justifyContent: 'center',
                backgroundColor: 'var(--bg-tertiary)', // Fondo oscuro para preview
                padding: '1rem',
                borderRadius: '0.5rem',
                minHeight: '300px'
            }}>
                <canvas 
                    ref={canvasRef} 
                    style={{ 
                        maxWidth: '100%', 
                        maxHeight: '500px',
                        height: 'auto', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                />
            </div>
            
            <div className="editor-controls">
                <h3 style={{ color: 'var(--text-primary)' }}>Personalizar Plantilla</h3>
                
                <div className="form-group">
                    <label className="form-label">Título (Superior Derecha)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: RECKY EASY"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción (Bajo el Título)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Sistema Administrativo..."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Lista Central (Una línea por ítem)</label>
                    <textarea 
                        className="form-input form-textarea"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="• Ítem 1&#10;• Ítem 2&#10;• Ítem 3"
                        rows={3}
                    />
                </div>

                <div className="editor-actions" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button 
                        type="button" 
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Guardando...' : '💾 Guardar Imagen Procesada'}
                    </button>
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
