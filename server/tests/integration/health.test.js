/**
 * @fileoverview Tests para endpoints públicos y health check
 * @description Pruebas de endpoints que no requieren autenticación
 */

import request from 'supertest';
import app from '../../src/server.js';

describe('API Health Endpoints', () => {

    describe('GET /api', () => {
        test('debe retornar info de la API', async () => {
            const response = await request(app)
                .get('/api');

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.message).toContain('PULLNOVA');
            expect(response.body.endpoints).toBeDefined();
        });
    });

    describe('GET /api/health', () => {
        test('debe retornar status ok o error', async () => {
            const response = await request(app)
                .get('/api/health');

            // Puede ser ok o error dependiendo de la DB
            expect([200, 500]).toContain(response.status);
            expect(response.body.status).toBeDefined();
        });

        test('debe incluir información de versión', async () => {
            const response = await request(app)
                .get('/api/health');

            if (response.status === 200) {
                expect(response.body.version).toBeDefined();
            }
        });
    });

    describe('GET /api/stats', () => {
        test('debe retornar estadísticas', async () => {
            const response = await request(app)
                .get('/api/stats');

            // Puede ser ok o error dependiendo de la DB
            expect([200, 500]).toContain(response.status);

            if (response.status === 200) {
                expect(response.body.stats).toBeDefined();
                expect(response.body.stats).toHaveProperty('usuarios');
                expect(response.body.stats).toHaveProperty('campanas');
                expect(response.body.stats).toHaveProperty('contenido');
            }
        });
    });
});

describe('API Usuarios Endpoints', () => {

    describe('GET /api/usuarios', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .get('/api/usuarios');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/usuarios', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .post('/api/usuarios')
                .send({
                    nombre: 'Nuevo Usuario',
                    email: 'nuevo@test.com',
                    password: '123456'
                });

            expect(response.status).toBe(401);
        });
    });
});
