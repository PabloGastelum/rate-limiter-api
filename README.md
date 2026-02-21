# Rate Limiter API (Node + Express + TypeScript)

Rate limiting en memoria con ventana deslizante: máximo `limit` requests por `windowMs` ms por usuario. Sin Redis ni librerías externas de rate limiting.

## Decisiones técnicas

- **Ventana deslizante**: más justa que ventana fija. Con ventana fija un usuario podría hacer 5 al final de una ventana y 5 al inicio de la siguiente (10 seguidos); con deslizante solo cuentan los requests en los últimos `windowMs` ms.
- **`Map<userId, number[]>`**: por usuario se guardan los timestamps de cada request en la ventana (ordenados). En cada llamada se eliminan los anteriores a `now - windowMs`, se comprueba si caben más y, si sí, se añade el nuevo.
- **Limpieza**: si tras filtrar un usuario queda con 0 requests en ventana, se elimina su entrada del Map para no acumular usuarios inactivos en memoria.
- **Usuario**: el middleware usa el header `X-User-Id` o el query `userId`; si no hay ninguno, se usa `'anonymous'`. Permite probar con curl y en producción se puede cambiar por un id de JWT/sesión.
- **Sin librerías de rate limit**: el algoritmo está implementado a mano para cumplir el requisito y para poder testear la ventana temporal con Jest y `jest.useFakeTimers()`.

## Problemas encontrados

- **Solo en memoria**: un reinicio del proceso borra todo el estado. Si hubiera varias réplicas del servidor, cada una tendría su propio contador; para producción multi-nodo haría falta un store compartido (p. ej. Redis).
- **Headers**: no se devuelven `X-RateLimit-Limit`, `X-RateLimit-Remaining` ni `Retry-After`, así que los clientes no saben cuántos requests les quedan ni cuándo reintentar.
- **Rendimiento**: cada request hace `shift()` en el array del usuario; con muchos usuarios y ventanas largas los arrays crecen y podría ser un cuello de botella en cargas muy altas.

## Mejoras futuras

- Añadir headers de rate limit en las respuestas y `Retry-After` en las 429.
- Definir un store intercambiable (memoria vs Redis) para poder escalar horizontalmente.
- Límites distintos por ruta o por tipo de usuario; leer `limit`/`windowMs` de env; usar IP como fallback cuando no haya userId.

---

## API

```ts
createRateLimiter(limit: number, windowMs: number): (userId: string) => boolean
```

- **limit**: número máximo de requests permitidos en la ventana.
- **windowMs**: duración de la ventana en milisegundos.
- Retorna `true` si el request está permitido, `false` si se bloquea (límite excedido → 429).

```ts
const rateLimit = createRateLimiter(5, 10_000);
if (rateLimit('user-123')) { /* OK */ } else { /* 429 */ }
```

`limit` y `windowMs` deben ser ≥ 1; si no, `createRateLimiter` lanza.

## Comandos

- `npm run dev` — servidor en desarrollo (ts-node-dev).
- `npm run build` — compilar TypeScript | `npm start` — ejecutar compilado.
- `npm test` — tests con Jest.

Servidor en `http://localhost:3000`. Rutas `/api/*` limitadas a 5 req/10s por usuario. Probar:

```bash
curl -H "X-User-Id: user1" http://localhost:3000/api/hello
```

---