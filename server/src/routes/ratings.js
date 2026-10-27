import { Router } from 'express';
import { z } from 'zod';
import Rating from '../models/Rating.js';
import Offer from '../models/Offer.js';
import Meetup from '../models/Meetup.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const router = Router();
const schema = z.object({ offerId: z.string().length(24), stars: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(300).optional() });

router.post('/', requireAuth, validate(schema), asyncHandler(async (req, res) => {
  const { offerId, stars, comment } = req.body;
  const offer = await Offer.findById(offerId);
  if (!offer) throw new AppError(404, 'Transaction not found');
  if (!offer.buyer.equals(req.user._id)) throw new AppError(403, 'Only the buyer of this item can rate the seller');
  if (!(await Meetup.exists({ offer: offer._id, status: 'completed' }))) throw new AppError(409, 'You can rate once the handover is confirmed by both sides');
  let rating;
  try { rating = await Rating.create({ offer: offer._id, rater: req.user._id, ratee: offer.seller, stars, comment }); }
  catch (e) { if (e.code === 11000) throw new AppError(409, 'You have already rated this transaction'); throw e; }
  const [agg] = await Rating.aggregate([{ $match: { ratee: offer.seller } }, { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } }]);
  await User.findByIdAndUpdate(offer.seller, { ratingAvg: Math.round(agg.avg * 100) / 100, ratingCount: agg.count });
  res.status(201).json({ rating });
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
  const [user, ratings] = await Promise.all([
    User.findById(req.params.userId).select('name ratingAvg ratingCount createdAt'),
    Rating.find({ ratee: req.params.userId }).sort({ createdAt: -1 }).limit(50).populate('rater', 'name'),
  ]);
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user, ratings });
}));
export default router;
