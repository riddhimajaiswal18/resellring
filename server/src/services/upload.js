import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/AppError.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype) ? cb(null, true) : cb(new AppError(400, 'Only JPG, PNG or WebP images are allowed')),
});

const useCloud = () => !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

export async function saveImages(files = []) {
  try {
    if (useCloud()) {
      cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
      return await Promise.all(files.map((f) => new Promise((resolve, reject) =>
        cloudinary.uploader.upload_stream({ folder: 'resellring' }, (err, res) => (err ? reject(err) : resolve(res.secure_url))).end(f.buffer))));
    }
    await fs.mkdir('uploads', { recursive: true });
    return await Promise.all(files.map(async (f) => {
      const name = `${crypto.randomUUID()}${path.extname(f.originalname).toLowerCase() || '.jpg'}`;
      await fs.writeFile(path.join('uploads', name), f.buffer);
      return `/uploads/${name}`;
    }));
  } catch (e) {
    console.error('Image upload failed', e);
    throw new AppError(502, 'Image upload failed, please try again');
  }
}
