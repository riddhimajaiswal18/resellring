import mongoose from 'mongoose';
import { LOCATIONS } from '../constants.js';
const oid = (ref) => ({ type: mongoose.Schema.Types.ObjectId, ref, required: true });
const schema = new mongoose.Schema({
  offer: { ...oid('Offer'), unique: true },
  listing: oid('Listing'), buyer: oid('User'), seller: oid('User'),
  location: { type: String, enum: LOCATIONS, required: true },
  proposedTime: { type: Date, required: true },
  proposedBy: oid('User'),
  status: { type: String, enum: ['proposed', 'scheduled', 'completed', 'cancelled'], default: 'proposed' },
  buyerConfirmed: { type: Boolean, default: false },
  sellerConfirmed: { type: Boolean, default: false },
  completedAt: Date,
}, { timestamps: true });
export default mongoose.model('Meetup', schema);
