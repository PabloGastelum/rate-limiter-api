/**
 * Rate limiter en memoria.
 * Ventana deslizante: máximo `limit` requests por `windowMs` ms por usuario.
 */

export type RateLimiterFn = (userId: string) => boolean;

/**
 * Crea un rate limiter que permite como máximo `limit` requests por `windowMs` milisegundos
 * por usuario (ventana deslizante).
 *
 * @param limit - Número máximo de requests permitidos en la ventana
 * @param windowMs - Duración de la ventana en milisegundos
 * @returns Función (userId) => true si permitido, false si bloqueado
 */
export function createRateLimiter(
  limit: number,
  windowMs: number
): RateLimiterFn {
  if (limit < 1 || windowMs < 1) {
    throw new Error("createRateLimiter: limit y windowMs deben ser >= 1");
  }

  const userRequests: Map<string, number[]> = new Map();

  return function rateLimit(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = userRequests.get(userId);
    if (!timestamps) {
      timestamps = [];
      userRequests.set(userId, timestamps);
    }

    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    if (timestamps.length === 0) {
      userRequests.delete(userId);
    }

    if (timestamps.length >= limit) {
      return false;
    }

    const bucket = userRequests.get(userId) ?? [];
    if (!userRequests.has(userId)) {
      userRequests.set(userId, bucket);
    }
    bucket.push(now);
    return true;
  };
}
