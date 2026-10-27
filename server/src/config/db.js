import mongoose from 'mongoose';
export async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.syncIndexes(); // ensures the partial-unique offer index exists
  console.log('MongoDB connected');
}
