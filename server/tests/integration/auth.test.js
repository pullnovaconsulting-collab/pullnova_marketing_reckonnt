/**
 * @fileoverview Tests de integración para API de autenticación
 * @description Pruebas de endpoints /api/auth/*
 */

import request from 'supertest';
import app from '../../src/server.js';

describe('API Auth Endpoints', () => {

    describe('POST /api/auth/register', () => {
        test('debe rechazar registro sin campos requeridos', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
            expect(response.body.message).toContain('Campos requeridos');
        });

        test('debe rechazar email inválido', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    nombre: 'Test User',
                    email: 'invalid-email',
                    password: '123456'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('email');
        });

        test('debe rechazar password corto', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    nombre: 'Test User',
                    email: 'test@example.com',
                    password: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('6 caracteres');
        });
    });

    describe('POST /api/auth/login', () => {
        test('debe rechazar login sin campos', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });

        test('debe rechazar credenciales inválidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'noexiste@test.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('inválidas');
        });
    });

    describe('GET /api/auth/me', () => {
        test('debe rechazar sin token', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        test('debe rechazar token inválido', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token_invalido');

            expect(response.status).toBe(401);
        });

        test('debe rechazar token mal formateado', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'InvalidFormat');

            expect(response.status).toBe(401);
            expect(response.body.message).toContain('Bearer');
        });
    });
});
