import { useState, useEffect, useRef } from 'react';
import reactLogo from '../../assets/react.svg'; // Placeholder logo

export default function ImageTemplateEditor({ imageUrl, onSave, onCancel, initialData = {} }) {
    const canvasRef = useRef(null);
    const [title, setTitle] = useState(initialData.title || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [body, setBody] = useState(initialData.body || '');
    const [isSaving, setIsSaving] = useState(false);
    
    // Configuración de estilo
    const [config, setConfig] = useState({
        titleColor: '#FFFFFF',
        titleBgColor: '#4F46E5', // Indigo 600
        textColor: '#1F2937', // Gray 800
        logoPosition: 'bottom-left'
    });

    // Cargar y dibujar en el canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous"; // Importante para evitar taint canvas
        
        // Usar proxy si es una URL externa (OpenAI)
        const token = localStorage.getItem('token');
        const isExternal = imageUrl.startsWith('http') && !imageUrl.includes(window.location.origin);
        
        if (isExternal) {
            // Agregar token para autenticación en el proxy
            const proxyUrl = `/api/ia/proxy-image?url=${encodeURIComponent(imageUrl)}&token=${token}`;
            img.src = proxyUrl;
        } else {
            img.src = imageUrl;
        }

        img.onload = () => {
            // Configurar tamaño del canvas igual a la imagen
            canvas.width = img.width;
            canvas.height = img.height;

            // 1. Dibujar imagen base
            ctx.drawImage(img, 0, 0);

            // 2. Dibujar Título (Fondo + Texto)
            if (title) {
                const fontSize = Math.floor(canvas.width * 0.06); // 6% del ancho
                ctx.font = `bold ${fontSize}px sans-serif`;
                const padding = fontSize * 0.5;
                const textWidth = ctx.measureText(title).width;
                
                // Fondo del título (Esquina superior derecha o centrada)
                const bgX = canvas.width - textWidth - (padding * 3);
                const bgY = fontSize;
                const bgWidth = textWidth + (padding * 2);
                const bgHeight = fontSize + padding;
                const radius = 20;

                // Dibujar fondo redondeado
                ctx.fillStyle = config.titleBgColor;
                ctx.beginPath();
                ctx.roundRect(bgX, bgY, bgWidth, bgHeight, radius);
                ctx.fill();

                // Texto del título
                ctx.fillStyle = config.titleColor;
                ctx.fillText(title, bgX + padding, bgY + fontSize * 0.85);
            }

            // 3. Dibujar Descripción (Debajo del título o en otra zona)
            if (description) {
                const fontSize = Math.floor(canvas.width * 0.04);
                ctx.font = `${fontSize}px sans-serif`;
                ctx.fillStyle = '#FFFFFF';
                // Sombra para legibilidad
                ctx.shadowColor = "black";
                ctx.shadowBlur = 7;
                ctx.fillText(description, canvas.width * 0.05, canvas.height * 0.1);
                ctx.shadowBlur = 0; // Reset
            }

            // 4. Dibujar Cuerpo (Caja blanca flotante)
            if (body) {
                const boxWidth = canvas.width * 0.4;
                const boxHeight = canvas.height * 0.3;
                const boxX = canvas.width - boxWidth - 40;
                const boxY = canvas.height / 2 - boxHeight / 2;
                
                // Caja blanca
                ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                ctx.shadowColor = "rgba(0,0,0,0.3)";
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Texto del cuerpo
                ctx.fillStyle = config.textColor;
                const fontSize = Math.floor(boxWidth * 0.15); // Grande para el precio/dato
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText(body, boxX + boxWidth/2, boxY + boxHeight/2 + fontSize/3);
                ctx.textAlign = 'left'; // Reset
            }

            // 5. Dibujar Logo
            const logo = new Image();
            logo.src = reactLogo;
            logo.onload = () => {
                const logoWidth = canvas.width * 0.25; // 25% del ancho
                const logoHeight = (logo.height / logo.width) * logoWidth;
                
                let logoX = 20;
                let logoY = canvas.height - logoHeight - 20;

                ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
            };
        };
    }, [imageUrl, title, description, body, config]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const canvas = canvasRef.current;
            
            // Convertir a Blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Error al generar la imagen');
                }

                // Crear FormData
                const formData = new FormData();
                formData.append('image', blob, 'processed-image.png');

                // Llamar a la función de guardado del padre
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
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: '#f9fafb'
        }}>
            <div className="editor-preview" style={{ 
                display: 'flex', 
                justifyContent: 'center',
                backgroundColor: '#e5e7eb',
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
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }} 
                />
            </div>
            
            <div className="editor-controls">
                <h3>Personalizar Plantilla</h3>
                
                <div className="form-group">
                    <label className="form-label">Título (Etiqueta superior)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: RECKY EASY"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descripción (Texto superior)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Sistema Administrativo..."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Dato Destacado (Caja central)</label>
                    <input 
                        type="text" 
                        className="form-input"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Ej: $35,64"
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
