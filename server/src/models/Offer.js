import mongoose from 'mongoose';
const ref = (m) => ({ type: mongoose.Schema.Types.ObjectId, ref: m, required: true });
const schema = new mongoose.Schema({
  listing: { ...ref('Listing'), index: true },
  buyer: { ...ref('User'), index: true },
  seller: { ...ref('User'), index: true },
  amount: { type: Number, required: true, min: 1 },
  counterAmount: Number,
  finalAmount: Number,
  message: { type: String, trim: true, maxlength: 300, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'countered', 'withdrawn', 'expired', 'cancelled'], default: 'pending' },
  isOpen: { type: Boolean, default: true }, // true while pending/countered
  expiresAt: Date,
}, { timestamps: true });
// A buyer can have only ONE open offer per listing (enforced by the database, so it is race-proof)
schema.index({ listing: 1, buyer: 1 }, { unique: true, partialFilterExpression: { isOpen: true } });
export default mongoose.model('Offer', schema);
