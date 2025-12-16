/**
 * @fileoverview Tests de integración para API de campañas
 * @description Pruebas de endpoints /api/campanas/*
 */

import request from 'supertest';
import app from '../../src/server.js';

describe('API Campanas Endpoints', () => {

    describe('GET /api/campanas', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .get('/api/campanas');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        test('debe rechazar token inválido', async () => {
            const response = await request(app)
                .get('/api/campanas')
                .set('Authorization', 'Bearer invalid_token');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/campanas', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .post('/api/campanas')
                .send({ nombre: 'Test Campaña' });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/campanas/stats', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .get('/api/campanas/stats');

            expect(response.status).toBe(401);
        });
    });
});

describe('API Contenido Endpoints', () => {

    describe('GET /api/contenido', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .get('/api/contenido');

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/contenido/pendientes', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .get('/api/contenido/pendientes');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/contenido', () => {
        test('debe rechazar sin autenticación', async () => {
            const response = await request(app)
                .post('/api/contenido')
                .send({ titulo: 'Test Contenido' });

            expect(response.status).toBe(401);
        });
    });
});
