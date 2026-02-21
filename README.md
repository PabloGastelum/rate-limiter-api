# Rate Limiter en Memoria (Node + Express + TypeScript)

Implementación de rate limiting en memoria: máximo `limit` requests por `windowMs` milisegundos por usuario (ventana deslizante). Sin Redis, base de datos ni librerías externas.

## API

```ts
createRateLimiter(limit: number, windowMs: number): (userId: string) => boolean
```

- **limit**: número máximo de requests permitidos en la ventana.
- **windowMs**: duración de la ventana en milisegundos.
- **Retorno**: función que recibe `userId` y devuelve `true` si el request está permitido, `false` si se bloquea (límite excedido).

## Uso

```ts
import { createRateLimiter } from './rateLimiter';

const rateLimit = createRateLimiter(5, 10_000); // 5 req por 10 s

if (rateLimit('user-123')) {
  // permitido
} else {
  // bloqueado (429)
}
```

## Comandos

- `npm run dev` — servidor Express en desarrollo (con rate limiter en `/api/*`).
- `npm run build` — compilar TypeScript.
- `npm start` — ejecutar servidor compilado.
- `npm test` — tests con Jest.

## Detalles de implementación

- **Estructura de datos**: `Map<userId, number[]>` donde cada array son los timestamps de requests en la ventana (ordenados).
- **Ventana deslizante**: en cada llamada se eliminan timestamps anteriores a `now - windowMs`, se comprueba si `length < limit` y, si cabe, se añade `Date.now()`.
- **Limpieza**: si tras filtrar no queda ningún request en la ventana, se elimina la clave del `Map` para no acumular usuarios inactivos.
- **Edge cases**: validación de `limit` y `windowMs` >= 1; múltiples usuarios aislados; ventana que se renueva al avanzar el tiempo.
