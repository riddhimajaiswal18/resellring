import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static('uploads'));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use(notFound);
app.use(errorHandler);
export default app;
