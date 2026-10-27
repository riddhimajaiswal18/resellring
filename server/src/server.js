import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API listening on :${port}`)))
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
