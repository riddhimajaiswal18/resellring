import { Router } from 'express';
import { z } from 'zod';
import Meetup from '../models/Meetup.js';
import Offer from '../models/Offer.js';
import Listing from '../models/Listing.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cancelAcceptedDeal } from '../services/offerService.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { LOCATIONS } from '../constants.js';

const router = Router();
router.use(requireAuth);
const proposeSchema = z.object({
  offerId: z.string().length(24),
  location: z.enum(LOCATIONS),
  proposedTime: z.coerce.date().refine((d) => d > new Date(), 'Meetup time must be in the future'),
});

const loadMine = async (req) => {
  const m = await Meetup.findById(req.params.id);
  if (!m) throw new AppError(404, 'Meetup not found');
  const uid = req.user._id;
  if (!m.buyer.equals(uid) && !m.seller.equals(uid)) throw new AppError(403, 'You are not part of this meetup');
  return m;
};

router.get('/by-offer/:offerId', asyncHandler(async (req, res) => {
  const m = await Meetup.findOne({ offer: req.params.offerId, $or: [{ buyer: req.user._id }, { seller: req.user._id }] });
  res.json({ meetup: m });
}));

// Propose or re-propose a time/place. Any change resets agreement and confirmations.
router.post('/', validate(proposeSchema), asyncHandler(async (req, res) => {
  const { offerId, location, proposedTime } = req.body;
  const offer = await Offer.findById(offerId);
  if (!offer) throw new AppError(404, 'Offer not found');
  const uid = req.user._id;
  if (!offer.buyer.equals(uid) && !offer.seller.equals(uid)) throw new AppError(403, 'You are not part of this offer');
  if (offer.status !== 'accepted') throw new AppError(409, 'A meetup can only be arranged for an accepted offer');
  let meetup = await Meetup.findOne({ offer: offer._id });
  if (meetup && ['completed', 'cancelled'].includes(meetup.status)) throw new AppError(409, `This meetup is already ${meetup.status}`);
  const fields = { location, proposedTime, proposedBy: uid, status: 'proposed', buyerConfirmed: false, sellerConfirmed: false };
  if (meetup) { Object.assign(meetup, fields); await meetup.save(); }
  else meetup = await Meetup.create({ offer: offer._id, listing: offer.listing, buyer: offer.buyer, seller: offer.seller, ...fields });
  res.status(meetup.isNew ? 201 : 200).json({ meetup });
}));

router.post('/:id/agree', asyncHandler(async (req, res) => {
  const m = await loadMine(req);
  if (m.status !== 'proposed') throw new AppError(409, `Meetup is ${m.status}, nothing to agree to`);
  if (m.proposedBy.equals(req.user._id)) throw new AppError(403, 'The other person needs to agree to your proposal');
  m.status = 'scheduled';
  await m.save();
  res.json({ meetup: m });
}));

// Both parties confirm the handover; when both have, the sale is recorded.
router.post('/:id/confirm-handover', asyncHandler(async (req, res) => {
  const m = await loadMine(req);
  if (m.status !== 'scheduled') throw new AppError(409, 'Both of you must agree on a time and place first');
  if (m.buyer.equals(req.user._id)) m.buyerConfirmed = true; else m.sellerConfirmed = true;
  if (m.buyerConfirmed && m.sellerConfirmed) {
    const offer = await Offer.findById(m.offer);
    const sold = await Listing.findOneAndUpdate({ _id: m.listing, status: 'reserved', reservedOffer: m.offer },
      { status: 'sold', soldPrice: offer.finalAmount, soldAt: new Date() });
    if (!sold) throw new AppError(409, 'Listing is not in a reservable state');
    m.status = 'completed';
    m.completedAt = new Date();
  }
  await m.save();
  res.json({ meetup: m });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const m = await loadMine(req);
  if (['completed', 'cancelled'].includes(m.status)) throw new AppError(409, `Meetup is already ${m.status}`);
  await cancelAcceptedDeal(await Offer.findById(m.offer)); // relists item, marks offer cancelled
  m.status = 'cancelled';
  await m.save();
  res.json({ meetup: m });
}));
export default router;
