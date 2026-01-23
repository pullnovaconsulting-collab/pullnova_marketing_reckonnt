
import { ejecutarManual } from './src/workers/metricsCollector.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- Iniciando Prueba de Métricas ---');
ejecutarManual()
    .then(result => {
        console.log('Resultado:', result);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error en la prueba:', err);
        process.exit(1);
    });
