import { Router } from 'express';
import Listing from '../models/Listing.js';
import { asyncHandler } from '../utils/AppError.js';
import { CATEGORIES, CONDITIONS, LOCATIONS } from '../constants.js';

const router = Router();
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/meta', (_req, res) => res.json({ categories: CATEGORIES, conditions: CONDITIONS, locations: LOCATIONS }));

// Sold-price history: what things actually sell for (optionally filtered by category / title keyword)
router.get('/price-history', asyncHandler(async (req, res) => {
  const match = { status: 'sold', soldPrice: { $exists: true } };
  if (CATEGORIES.includes(req.query.category)) match.category = req.query.category;
  if (req.query.q) match.title = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
  const [summary, recent] = await Promise.all([
    Listing.aggregate([{ $match: match }, { $group: {
      _id: '$category', count: { $sum: 1 }, avgSold: { $avg: '$soldPrice' }, minSold: { $min: '$soldPrice' },
      maxSold: { $max: '$soldPrice' }, avgAsking: { $avg: '$askingPrice' } } }, { $sort: { count: -1 } }]),
    Listing.find(match).sort({ soldAt: -1 }).limit(20).select('title category condition askingPrice soldPrice soldAt images'),
  ]);
  res.json({
    summary: summary.map((s) => ({ category: s._id, count: s.count, avgSold: Math.round(s.avgSold), minSold: s.minSold, maxSold: s.maxSold,
      avgDiscountPct: Math.round((1 - s.avgSold / s.avgAsking) * 100) })),
    recent,
  });
}));
export default router;
