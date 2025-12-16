/**
 * @fileoverview Tests unitarios para helpers
 * @description Pruebas de funciones utilitarias
 */

import {
    paginate,
    paginatedResponse,
    validateRequired,
    sanitizeObject
} from '../../../src/utils/helpers.js';

describe('Helpers Utils', () => {

    describe('paginate()', () => {
        test('debe retornar valores por defecto', () => {
            const result = paginate();
            expect(result).toEqual({ offset: 0, limit: 10, page: 1 });
        });

        test('debe calcular offset correctamente', () => {
            const result = paginate(3, 20);
            expect(result).toEqual({ offset: 40, limit: 20, page: 3 });
        });

        test('debe manejar página 1 correctamente', () => {
            const result = paginate(1, 15);
            expect(result).toEqual({ offset: 0, limit: 15, page: 1 });
        });

        test('debe limitar el máximo a 100', () => {
            const result = paginate(1, 200);
            expect(result.limit).toBe(100);
        });

        test('debe manejar valores negativos', () => {
            const result = paginate(-1, -10);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(1);
        });

        test('debe manejar strings numéricos', () => {
            const result = paginate('2', '25');
            expect(result).toEqual({ offset: 25, limit: 25, page: 2 });
        });
    });

    describe('paginatedResponse()', () => {
        test('debe crear respuesta paginada correcta', () => {
            const data = [{ id: 1 }, { id: 2 }];
            const result = paginatedResponse(data, 50, 1, 10);

            expect(result.data).toEqual(data);
            expect(result.pagination).toEqual({
                total: 50,
                page: 1,
                limit: 10,
                totalPages: 5,
                hasNext: true,
                hasPrev: false
            });
        });

        test('debe indicar hasNext=false en última página', () => {
            const result = paginatedResponse([], 20, 2, 10);
            expect(result.pagination.hasNext).toBe(false);
            expect(result.pagination.hasPrev).toBe(true);
        });

        test('debe calcular totalPages correctamente', () => {
            const result = paginatedResponse([], 25, 1, 10);
            expect(result.pagination.totalPages).toBe(3);
        });
    });

    describe('validateRequired()', () => {
        test('debe validar campos completos', () => {
            const body = { nombre: 'Test', email: 'test@test.com' };
            const result = validateRequired(body, ['nombre', 'email']);

            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        test('debe detectar campos faltantes', () => {
            const body = { nombre: 'Test' };
            const result = validateRequired(body, ['nombre', 'email', 'password']);

            expect(result.valid).toBe(false);
            expect(result.missing).toContain('email');
            expect(result.missing).toContain('password');
        });

        test('debe detectar valores vacíos como faltantes', () => {
            const body = { nombre: '', email: null, password: undefined };
            const result = validateRequired(body, ['nombre', 'email', 'password']);

            expect(result.valid).toBe(false);
            expect(result.missing.length).toBe(3);
        });

        test('debe pasar con cero como valor válido', () => {
            const body = { cantidad: 0 };
            const result = validateRequired(body, ['cantidad']);

            expect(result.valid).toBe(true);
        });
    });

    describe('sanitizeObject()', () => {
        test('debe remover undefined y null', () => {
            const obj = { a: 1, b: undefined, c: null, d: 'test' };
            const result = sanitizeObject(obj);

            expect(result).toEqual({ a: 1, d: 'test' });
        });

        test('debe mantener strings vacíos y ceros', () => {
            const obj = { a: '', b: 0, c: false };
            const result = sanitizeObject(obj);

            expect(result).toEqual({ a: '', b: 0, c: false });
        });

        test('debe retornar objeto vacío si todo es null/undefined', () => {
            const obj = { a: null, b: undefined };
            const result = sanitizeObject(obj);

            expect(result).toEqual({});
        });
    });
});
