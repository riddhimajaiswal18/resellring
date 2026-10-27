import mongoose from 'mongoose';
import { CATEGORIES, CONDITIONS } from '../constants.js';
const schema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  category: { type: String, enum: CATEGORIES, required: true },
  condition: { type: String, enum: CONDITIONS, required: true },
  askingPrice: { type: Number, required: true, min: 1 },
  images: [String],
  status: { type: String, enum: ['active', 'reserved', 'sold'], default: 'active' },
  reservedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  soldPrice: Number,
  soldAt: Date,
}, { timestamps: true });
schema.index({ status: 1, category: 1, askingPrice: 1 });
schema.index({ status: 1, soldAt: -1 });
export default mongoose.model('Listing', schema);
