import { Router } from 'express';
import { z } from 'zod';
import Offer from '../models/Offer.js';
import Meetup from '../models/Meetup.js';
import Rating from '../models/Rating.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOffer, respondToOffer, expireStale } from '../services/offerService.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({ listingId: z.string().length(24), amount: z.coerce.number().positive().max(1000000), message: z.string().trim().max(300).optional() });
const counterSchema = z.object({ counterAmount: z.coerce.number().positive().max(1000000) });

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const offer = await createOffer(req.user._id, req.body);
  res.status(201).json({ offer });
}));

// In-app badge: seller has pending offers to answer, buyer has counters to answer
router.get('/badge', asyncHandler(async (req, res) => {
  await expireStale({ $or: [{ buyer: req.user._id }, { seller: req.user._id }] });
  const [toAnswer, counters] = await Promise.all([
    Offer.countDocuments({ seller: req.user._id, status: 'pending' }),
    Offer.countDocuments({ buyer: req.user._id, status: 'countered' }),
  ]);
  res.json({ count: toAnswer + counters, toAnswer, counters });
}));

router.get('/mine', asyncHandler(async (req, res) => {
  const uid = req.user._id;
  await expireStale({ $or: [{ buyer: uid }, { seller: uid }] });
  const filter = req.query.role === 'buyer' ? { buyer: uid } : req.query.role === 'seller' ? { seller: uid } : { $or: [{ buyer: uid }, { seller: uid }] };
  const offers = await Offer.find(filter).sort({ updatedAt: -1 })
    .populate('listing', 'title images status askingPrice').populate('buyer', 'name ratingAvg').populate('seller', 'name ratingAvg').lean();
  const ids = offers.map((o) => o._id);
  const [meetups, ratings] = await Promise.all([Meetup.find({ offer: { $in: ids } }).lean(), Rating.find({ offer: { $in: ids }, rater: uid }).lean()]);
  const mByOffer = Object.fromEntries(meetups.map((m) => [String(m.offer), m]));
  const rated = new Set(ratings.map((r) => String(r.offer)));
  res.json({ offers: offers.map((o) => ({ ...o, meetup: mByOffer[String(o._id)] || null, rated: rated.has(String(o._id)) })) });
}));

router.get('/listing/:listingId', asyncHandler(async (req, res) => {
  await expireStale({ listing: req.params.listingId });
  const offers = await Offer.find({ listing: req.params.listingId, seller: req.user._id }).sort({ createdAt: -1 }).populate('buyer', 'name ratingAvg ratingCount');
  res.json({ offers }); // only the seller's own listing offers are ever returned
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id).populate('listing', 'title images status').populate('buyer', 'name').populate('seller', 'name');
  if (!offer) throw new AppError(404, 'Offer not found');
  const uid = String(req.user._id);
  if (String(offer.buyer._id) !== uid && String(offer.seller._id) !== uid) throw new AppError(403, 'Not allowed');
  res.json({ offer });
}));

for (const action of ['accept', 'decline', 'withdraw']) {
  router.post(`/:id/${action}`, asyncHandler(async (req, res) => res.json({ offer: await respondToOffer(req.params.id, req.user, action) })));
}
router.post('/:id/counter', validate(counterSchema), asyncHandler(async (req, res) =>
  res.json({ offer: await respondToOffer(req.params.id, req.user, 'counter', req.body.counterAmount) })));
export default router;
