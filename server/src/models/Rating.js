import mongoose from 'mongoose';
const oid = (ref) => ({ type: mongoose.Schema.Types.ObjectId, ref, required: true });
const schema = new mongoose.Schema({
  offer: oid('Offer'), rater: oid('User'), ratee: { ...oid('User'), index: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 300, default: '' },
}, { timestamps: true });
schema.index({ offer: 1, rater: 1 }, { unique: true }); // one rating per transaction
export default mongoose.model('Rating', schema);
