import express, { Request, Response } from 'express';
import { createRateLimiter } from './rateLimiter';

const app = express();
app.use(express.json());

// Ejemplo: 5 requests por 10 segundos por usuario
const rateLimit = createRateLimiter(5, 10_000);

// Middleware que usa el rate limiter (userId desde header o query para demo)
app.use((req: Request, res: Response, next) => {
  const userId = (req.headers['x-user-id'] as string) ?? (req.query.userId as string) ?? 'anonymous';
  if (!rateLimit(userId)) {
    res.status(429).json({ error: 'Too Many Requests', message: 'Límite de requests excedido' });
    return;
  }
  next();
});

app.get('/api/hello', (_req: Request, res: Response) => {
  res.json({ message: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log('Probar: curl -H "X-User-Id: user1" http://localhost:3000/api/hello');
});
