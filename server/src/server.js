import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
if (process.env.NODE_ENV === 'production' && !process.env.CLOUDINARY_CLOUD_NAME)
  console.warn('WARNING: Cloudinary is not configured, so uploaded images are stored on an ephemeral disk and will be lost on redeploy.');
const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API listening on :${port}`)))
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
