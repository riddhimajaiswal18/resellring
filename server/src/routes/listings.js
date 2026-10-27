import { Router } from 'express';
import { z } from 'zod';
import Listing from '../models/Listing.js';
import Offer from '../models/Offer.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, saveImages } from '../services/upload.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { CATEGORIES, CONDITIONS } from '../constants.js';

const router = Router();
const createSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).default(''),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  askingPrice: z.coerce.number().positive().max(1000000),
});
const updateSchema = createSchema.partial();
const querySchema = z.object({
  q: z.string().trim().max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(CONDITIONS).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  seller: z.string().length(24).optional(),
  status: z.enum(['active', 'reserved', 'sold', 'all']).default('active'),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { newest: { createdAt: -1 }, price_asc: { askingPrice: 1 }, price_desc: { askingPrice: -1 } };

router.get('/', validate(querySchema, 'query'), asyncHandler(async (req, res) => {
  const { q, category, condition, minPrice, maxPrice, seller, status, sort, page, limit } = req.query;
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (seller) filter.seller = seller;
  if (minPrice != null || maxPrice != null) filter.askingPrice = { ...(minPrice != null && { $gte: minPrice }), ...(maxPrice != null && { $lte: maxPrice }) };
  if (q) { const rx = new RegExp(escapeRegex(q), 'i'); filter.$or = [{ title: rx }, { description: rx }]; }
  const [items, total] = await Promise.all([
    Listing.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).populate('seller', 'name ratingAvg ratingCount'),
    Listing.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('seller', 'name ratingAvg ratingCount');
  if (!listing) throw new AppError(404, 'Listing not found');
  res.json({ listing });
}));

router.post('/', requireAuth, upload.array('images', 4), validate(createSchema), asyncHandler(async (req, res) => {
  const images = await saveImages(req.files);
  const listing = await Listing.create({ ...req.body, images, seller: req.user._id });
  res.status(201).json({ listing });
}));

async function ownActiveListing(req) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new AppError(404, 'Listing not found');
  if (!listing.seller.equals(req.user._id)) throw new AppError(403, 'You can only modify your own listings');
  if (listing.status !== 'active') throw new AppError(409, `A ${listing.status} listing can't be modified`);
  return listing;
}

router.patch('/:id', requireAuth, validate(updateSchema), asyncHandler(async (req, res) => {
  const listing = await ownActiveListing(req);
  Object.assign(listing, req.body);
  await listing.save();
  res.json({ listing });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const listing = await ownActiveListing(req);
  await Offer.updateMany({ listing: listing._id, isOpen: true }, { status: 'declined', isOpen: false });
  await listing.deleteOne();
  res.status(204).end();
}));
export default router;
