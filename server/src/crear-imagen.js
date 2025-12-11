import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// PROMPT BASE (estilo de marca)
const estiloReckont = `
Estilo Corporativo Reckont:
- Marca de software profesional y moderna.
- Paleta de colores: azul #1E90FF, negro #0A0A0A, blanco #FFFFFF.
- Estética: tecnología moderna, minimalista y elegante.
- Elementos visuales: líneas rectas, patrones geométricos, circuitos digitales sutiles.
- Iluminación: tonos fríos, luz suave y futurista.
- Composición: imagen cuadrada, un elemento central, fondo limpio, estilo profesional.
- Sensación: innovación, inteligencia artificial, automatización y eficiencia empresarial.
`;

export const generarImagen = async (tema) => {
    const promptFinal = `
Usa el estilo corporativo de Reckont descrito aquí:
${estiloReckont}

Crea una imagen cuadrada sobre este tema: "${tema}".
Conserva el estilo gráfico para asegurar consistencia entre publicaciones.
`;

    const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: promptFinal,
        size: "1024x1024",
        n: 1
    });

    return response.data[0].url;
};

export const generarTexto = async (tema) => {
    const promptTexto = `
Genera un texto breve y profesional para una publicación en redes sociales de Reckont.
Tema: "${tema}"

El texto debe transmitir innovación, tecnología, automatización y soluciones empresariales.
Debe tener tono profesional, amigable, no más de 3 párrafos cortos.
Incluye un llamado suave a la acción.
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            { role: "system", content: "Eres un redactor experto en marketing para tecnología." },
            { role: "user", content: promptTexto }
        ]
    });

    return response.choices[0].message.content;
};
