import { ZodError } from 'zod';
import multer from 'multer';
export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError)
    return res.status(400).json({ message: 'Validation failed', errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) });
  if (err instanceof multer.MulterError) return res.status(400).json({ message: `Upload error: ${err.message}` });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate entry' });
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side' });
}
