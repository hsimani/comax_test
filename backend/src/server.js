import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { orderSchema } from './orderSchema.js';
import { createComaxOrder } from './comax.js';

const app = express();
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map(s => s.trim()),
}));
app.use(express.json({ limit: '100kb' }));


app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/orders', async (req, res) => {
  const validation = orderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid order payload',
      details: validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  try {
    const result = await createComaxOrder(validation.data);
    // A SOAP response can be HTTP 200 while reporting business validation errors.
    return res.status(result.success ? 200 : 422).json(result);
  } catch (error) {
    // Avoid logging credentials or full SOAP request/response bodies.
    const message = error?.name === 'AbortError'
      ? 'Comax request timed out. Check Comax before retrying to avoid creating a duplicate order.'
      : (error?.message ?? 'Unknown integration error');
    console.error('[comax-order]', message);
    return res.status(502).json({ success: false, error: message });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Comax order API listening on port ${port}`));
