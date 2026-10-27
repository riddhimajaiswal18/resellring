import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Please log in');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { throw new AppError(401, 'Session expired, please log in again'); }
  const user = await User.findById(payload.id);
  if (!user) throw new AppError(401, 'Account no longer exists');
  req.user = user;
  next();
});
