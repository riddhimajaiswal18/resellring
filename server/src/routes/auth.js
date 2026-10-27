import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const router = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const email = z.string().trim().toLowerCase().email();

const registerSchema = z.object({ name: z.string().trim().min(2).max(60), email, password: z.string().min(8).max(100) });
const loginSchema = z.object({ email, password: z.string().min(1) });

function assertCampusEmail(addr) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) return;
  const domain = addr.split('@')[1];
  if (!allowed.some((d) => domain === d || domain.endsWith('.' + d)))
    throw new AppError(403, `Only campus email addresses are allowed (${allowed.join(', ')})`);
}

router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  assertCampusEmail(email);
  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user });
}));

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new AppError(401, 'Invalid email or password');
  res.json({ token: sign(user), user });
}));

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
export default router;
