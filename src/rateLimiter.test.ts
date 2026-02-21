/**
 * Tests del rate limiter en memoria (ventana deslizante).
 * Ejecutar con: npm test (o npx jest)
 */

import { createRateLimiter } from './rateLimiter';

describe('createRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('permite requests dentro del límite', () => {
    const limit = createRateLimiter(3, 1000);
    expect(limit('user1')).toBe(true);
    expect(limit('user1')).toBe(true);
    expect(limit('user1')).toBe(true);
    expect(limit('user1')).toBe(false);
  });

  it('bloquea cuando se excede el límite', () => {
    const limit = createRateLimiter(2, 5000);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(false);
    expect(limit('u1')).toBe(false);
  });

  it('soporta múltiples usuarios de forma independiente', () => {
    const limit = createRateLimiter(2, 1000);
    expect(limit('alice')).toBe(true);
    expect(limit('alice')).toBe(true);
    expect(limit('alice')).toBe(false);
    expect(limit('bob')).toBe(true);
    expect(limit('bob')).toBe(true);
    expect(limit('bob')).toBe(false);
  });

  it('permite de nuevo tras pasar la ventana (ventana deslizante)', () => {
    const limit = createRateLimiter(2, 1000);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(false);
    jest.advanceTimersByTime(1100);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(true);
    expect(limit('u1')).toBe(false);
  });

  it('lanza si limit o windowMs son inválidos', () => {
    expect(() => createRateLimiter(0, 1000)).toThrow();
    expect(() => createRateLimiter(3, 0)).toThrow();
  });
});
