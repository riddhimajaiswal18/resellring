import Offer from '../models/Offer.js';
import Listing from '../models/Listing.js';
import { AppError } from '../utils/AppError.js';
import { OFFER_TTL_HOURS } from '../constants.js';

// Offer state machine: status -> action -> { who may do it, resulting status }
const RULES = {
  pending: {
    accept: { actor: 'seller', to: 'accepted' },
    decline: { actor: 'seller', to: 'declined' },
    counter: { actor: 'seller', to: 'countered' },
    withdraw: { actor: 'buyer', to: 'withdrawn' },
  },
  countered: { // buyer responds to the seller's counter
    accept: { actor: 'buyer', to: 'accepted' },
    decline: { actor: 'buyer', to: 'declined' },
    withdraw: { actor: 'buyer', to: 'withdrawn' },
  },
};
// Pure state-machine rule: returns the next status, or throws 409 (illegal move) / 403 (wrong actor)
export function resolveTransition(status, action, role) {
  const rule = RULES[status]?.[action];
  if (!rule) throw new AppError(409, `Cannot ${action} an offer that is ${status}`);
  if (rule.actor !== role) throw new AppError(403, `Only the ${rule.actor} can ${action} this offer`);
  return rule.to;
}
const ttl = () => new Date(Date.now() + OFFER_TTL_HOURS * 3600 * 1000);

export const expireStale = (filter = {}) =>
  Offer.updateMany({ ...filter, isOpen: true, expiresAt: { $lt: new Date() } }, { status: 'expired', isOpen: false });

export async function createOffer(buyerId, { listingId, amount, message }) {
  const listing = await Listing.findById(listingId);
  if (!listing) throw new AppError(404, 'Listing not found');
  if (listing.status !== 'active') throw new AppError(409, 'This item is no longer available');
  if (listing.seller.equals(buyerId)) throw new AppError(403, "You can't make an offer on your own listing");
  try {
    return await Offer.create({ listing: listing._id, buyer: buyerId, seller: listing.seller, amount, message, expiresAt: ttl() });
  } catch (e) {
    if (e.code === 11000) throw new AppError(409, 'You already have an open offer on this item');
    throw e;
  }
}

export async function respondToOffer(offerId, user, action, counterAmount) {
  const offer = await Offer.findById(offerId);
  if (!offer) throw new AppError(404, 'Offer not found');
  const role = offer.seller.equals(user._id) ? 'seller' : offer.buyer.equals(user._id) ? 'buyer' : null;
  if (!role) throw new AppError(403, 'You are not part of this offer');

  if (offer.isOpen && offer.expiresAt < new Date()) {
    await expireStale({ _id: offer._id });
    throw new AppError(409, 'This offer has expired');
  }
  const to = resolveTransition(offer.status, action, role);

  const guard = { _id: offer._id, status: offer.status }; // optimistic concurrency on the offer itself

  if (action === 'counter') {
    if (!counterAmount || counterAmount <= 0) throw new AppError(400, 'A positive counterAmount is required');
    if (counterAmount === offer.amount) throw new AppError(400, 'Counter must differ from the original offer');
    const o = await Offer.findOneAndUpdate(guard, { status: 'countered', counterAmount, isOpen: true, expiresAt: ttl() }, { new: true });
    if (!o) throw new AppError(409, 'Offer was changed, please refresh');
    return o;
  }

  if (action === 'accept') {
    const finalAmount = offer.status === 'countered' ? offer.counterAmount : offer.amount;
    // Atomic gate: only ONE accept can flip an active listing to reserved
    const reserved = await Listing.findOneAndUpdate({ _id: offer.listing, status: 'active' }, { status: 'reserved', reservedOffer: offer._id });
    if (!reserved) throw new AppError(409, 'This item has already been reserved or sold');
    const accepted = await Offer.findOneAndUpdate(guard, { status: 'accepted', finalAmount, isOpen: false }, { new: true });
    if (!accepted) { // roll back the reservation
      await Listing.updateOne({ _id: offer.listing }, { status: 'active', reservedOffer: null });
      throw new AppError(409, 'Offer was changed, please refresh');
    }
    await Offer.updateMany({ listing: offer.listing, _id: { $ne: offer._id }, isOpen: true }, { status: 'declined', isOpen: false });
    return accepted;
  }

  const updated = await Offer.findOneAndUpdate(guard, { status: to, isOpen: false }, { new: true });
  if (!updated) throw new AppError(409, 'Offer was changed, please refresh');
  return updated;
}

// Called when an accepted deal falls through (meetup cancelled): relist the item
export async function cancelAcceptedDeal(offer) {
  const relisted = await Listing.findOneAndUpdate({ _id: offer.listing, status: 'reserved', reservedOffer: offer._id }, { status: 'active', reservedOffer: null });
  if (!relisted) throw new AppError(409, 'This deal can no longer be cancelled');
  await Offer.updateOne({ _id: offer._id }, { status: 'cancelled' });
}
