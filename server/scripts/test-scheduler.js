import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar variables de entorno PRIMERO
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importar db.js DESPUÉS de cargar variables
const { pool } = await import('../src/config/db.js');

const createTestPublication = async () => {
    try {
        console.log('🔍 Buscando datos para prueba...');

        // 1. Buscar un contenido existente
        const [contenidos] = await pool.query('SELECT id, titulo FROM contenido LIMIT 1');
        if (contenidos.length === 0) {
            console.error('❌ No se encontró ningún contenido. Crea primero un contenido en la base de datos.');
            process.exit(1);
        }
        const contenido = contenidos[0];
        console.log(`✅ Contenido encontrado: ID ${contenido.id} - ${contenido.titulo}`);

        // 2. Buscar una cuenta social conectada
        const [cuentas] = await pool.query("SELECT id, nombre_cuenta, plataforma FROM cuentas_sociales WHERE estado = 'conectada' LIMIT 1");
        
        // Si no hay conectadas, buscar cualquiera para probar (aunque el scheduler fallará al publicar, al menos intentará)
        let cuenta = null;
        if (cuentas.length === 0) {
            console.warn('⚠️ No hay cuentas conectadas. Buscando cualquier cuenta para forzar la prueba...');
            const [todasCuentas] = await pool.query("SELECT id, nombre_cuenta, plataforma FROM cuentas_sociales LIMIT 1");
            if (todasCuentas.length === 0) {
                console.error('❌ No se encontró ninguna cuenta social. Crea una cuenta social primero.');
                process.exit(1);
            }
            cuenta = todasCuentas[0];
            console.log(`⚠️ Usando cuenta (no conectada): ID ${cuenta.id} - ${cuenta.nombre_cuenta} (${cuenta.plataforma})`);
            console.log('   NOTA: El scheduler intentará procesarla pero fallará si no tiene token válido.');
        } else {
            cuenta = cuentas[0];
            console.log(`✅ Cuenta conectada encontrada: ID ${cuenta.id} - ${cuenta.nombre_cuenta} (${cuenta.plataforma})`);
        }

        // 3. Insertar publicación programada para "ahora mismo" (hace 1 segundo)
        const fechaProgramada = new Date(Date.now() - 1000); // 1 segundo en el pasado para que sea válida ya
        
        const [result] = await pool.query(
            `INSERT INTO publicaciones_programadas 
             (contenido_id, cuenta_social_id, fecha_programada, estado) 
             VALUES (?, ?, ?, 'pendiente')`,
            [contenido.id, cuenta.id, fechaProgramada]
        );

        console.log('\n✅ Publicación de prueba creada exitosamente!');
        console.log(`🆔 ID Publicación: ${result.insertId}`);
        console.log(`📅 Fecha Programada: ${fechaProgramada.toLocaleString()}`);
        console.log(`📄 Contenido ID: ${contenido.id}`);
        console.log(`👤 Cuenta ID: ${cuenta.id}`);
        
        console.log('\n👀 INSTRUCCIONES:');
        console.log('1. Asegúrate de que el servidor esté corriendo (npm run dev).');
        console.log('2. Revisa la consola del servidor.');
        console.log('3. Deberías ver logs del [Scheduler] procesando esta publicación en el próximo ciclo.');
        console.log('   (Si el intervalo es largo, puedes reiniciar el servidor para forzar una ejecución inmediata)');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
};

createTestPublication();
