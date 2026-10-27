// Seeds demo data: users, active listings, completed sales (price history + ratings) and in-progress deals.
// Usage: npm run seed      (WARNING: wipes all ResellRing collections in MONGODB_URI)
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Listing from './models/Listing.js';
import Offer from './models/Offer.js';
import Meetup from './models/Meetup.js';
import Rating from './models/Rating.js';
import { LOCATIONS } from './constants.js';

if (process.env.NODE_ENV === 'production' && !process.env.FORCE_SEED) throw new Error('Refusing to seed in production (set FORCE_SEED=1 to override)');
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');

const DOMAIN = (process.env.ALLOWED_EMAIL_DOMAINS || 'college.edu').split(',')[0].trim();
const PASSWORD = 'Password123!';
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5);
const inDays = (d) => new Date(Date.now() + d * 864e5);

const PEOPLE = ['Aarav Sharma', 'Priya Nair', 'Rohan Mehta', 'Sneha Iyer', 'Karthik Reddy'];
// [title, category, condition, asking, description, seller]
const ACTIVE = [
  ['Engineering Mathematics – Kreyszig (10th ed.)', 'books', 'good', 450, 'Highlighting in first 3 chapters only. Spine intact.', 0],
  ['Data Structures & Algorithms in C++', 'books', 'like_new', 380, 'Used for one semester. No markings.', 3],
  ['Hero Sprint 26" Cycle', 'cycles', 'good', 3200, 'New tyres last month. Comes with lock and bell. Graduating, must sell!', 0],
  ['Casio fx-991EX Scientific Calculator', 'electronics', 'like_new', 750, 'Works perfectly, allowed in exams.', 1],
  ['Boat Rockerz 450 Headphones', 'electronics', 'fair', 600, 'Battery lasts ~8 hrs. Ear cushions slightly worn.', 2],
  ['Study Table with Shelf', 'furniture', 'good', 1800, 'Sturdy wooden table, fits hostel rooms. Pickup from Block C.', 4],
  ['Foldable Mattress (Single)', 'furniture', 'fair', 900, 'Used one year. Cover is washable.', 3],
  ['White Lab Coat (Size M)', 'clothing', 'good', 250, 'Washed and ironed. Name tag removed.', 1],
  ['Drafter + Engineering Graphics Kit', 'stationery', 'good', 300, 'Mini drafter, set squares, compass. Complete set.', 4],
  ['Yonex Badminton Racket', 'sports', 'good', 1100, 'Re-strung recently. Cover included.', 2],
  ['Philips 20W LED Desk Lamp', 'electronics', 'like_new', 550, 'Adjustable neck, three brightness levels.', 0],
  ['Computer Networks – Tanenbaum', 'books', 'fair', 300, 'Some wear on cover, content is clean.', 2],
];
// [title, category, condition, asking, sold, seller, buyer, daysAgo, stars, comment]
const SOLD = [
  ['Engineering Physics – Resnick', 'books', 'good', 400, 320, 0, 1, 52, 5, 'Book exactly as described. Quick meetup at the library.'],
  ['Operating Systems Concepts – Galvin', 'books', 'good', 500, 380, 3, 2, 45, 4, 'Good condition, seller was on time.'],
  ['Discrete Mathematics – Rosen', 'books', 'fair', 350, 250, 4, 0, 30, 4, ''],
  ['Calculus – Thomas Finney', 'books', 'like_new', 450, 400, 2, 3, 12, 5, 'Practically new!'],
  ['Hercules Roadeo Cycle', 'cycles', 'good', 4500, 3600, 0, 4, 40, 5, 'Smooth ride and fair price. Recommended seller.'],
  ['Atlas Mountain Bike', 'cycles', 'fair', 3500, 2400, 4, 1, 20, 4, 'Needed minor brake fix but seller was honest about it.'],
  ['JBL Go 2 Bluetooth Speaker', 'electronics', 'good', 1500, 1100, 1, 2, 35, 5, 'Sounds great.'],
  ['Arduino Uno Starter Kit', 'electronics', 'like_new', 900, 700, 3, 0, 25, 5, 'Everything was in the box.'],
  ['Casio fx-82MS Calculator', 'electronics', 'fair', 400, 280, 2, 4, 18, 3, 'Works, but scratched more than shown in photos.'],
  ['Wooden Bookshelf (4-tier)', 'furniture', 'good', 1500, 1100, 4, 3, 28, 4, 'Heavy but a good buy.'],
  ['Study Chair with Cushion', 'furniture', 'fair', 800, 550, 1, 0, 15, 4, ''],
  ['Lab Coat (Size L)', 'clothing', 'good', 300, 200, 3, 1, 22, 5, 'Clean and neat.'],
  ['Hostel Bucket Set + Mug', 'other', 'good', 200, 120, 2, 4, 10, 4, ''],
  ['Cosco Cricket Bat', 'sports', 'good', 900, 650, 0, 2, 8, 5, 'Great bat, seller very friendly.'],
  ['Geometry Box Set', 'stationery', 'like_new', 250, 180, 1, 3, 5, 5, 'Perfect.'],
];

await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([User, Listing, Offer, Meetup, Rating].map((m) => m.deleteMany({})));
await mongoose.syncIndexes();

const hash = await bcrypt.hash(PASSWORD, 10);
const users = await User.insertMany(PEOPLE.map((name) => ({ name, email: `${name.split(' ')[0].toLowerCase()}@${DOMAIN}`, passwordHash: hash })));
const U = (i) => users[i]._id;

// Active listings
const active = [];
for (const [i, [title, category, condition, askingPrice, description, s]] of ACTIVE.entries())
  active.push(await Listing.create({ title, category, condition, askingPrice, description, seller: U(s), createdAt: daysAgo(i % 9, i * 3) }));

// Completed sales -> sold-price history + ratings
for (const [i, [title, category, condition, askingPrice, sold, s, b, ago, stars, comment]] of SOLD.entries()) {
  const when = daysAgo(ago);
  const listing = await Listing.create({ title, category, condition, askingPrice, seller: U(s), status: 'sold', soldPrice: sold, soldAt: when, createdAt: daysAgo(ago + 6) });
  const offer = await Offer.create({ listing: listing._id, buyer: U(b), seller: U(s), amount: sold, finalAmount: sold, status: 'accepted', isOpen: false, expiresAt: when });
  await Listing.updateOne({ _id: listing._id }, { reservedOffer: offer._id });
  await Meetup.create({ offer: offer._id, listing: listing._id, buyer: U(b), seller: U(s), location: LOCATIONS[i % LOCATIONS.length], proposedTime: when,
    proposedBy: U(b), status: 'completed', buyerConfirmed: true, sellerConfirmed: true, completedAt: when });
  await Rating.create({ offer: offer._id, rater: U(b), ratee: U(s), stars, comment, createdAt: when });
}
for (const u of users) {
  const [agg] = await Rating.aggregate([{ $match: { ratee: u._id } }, { $group: { _id: null, avg: { $avg: '$stars' }, n: { $sum: 1 } } }]);
  if (agg) await User.updateOne({ _id: u._id }, { ratingAvg: Math.round(agg.avg * 100) / 100, ratingCount: agg.n });
}

// In-progress deals for the demo (log in as the named user to see them)
const A = (title) => active.find((l) => l.title.startsWith(title));
const cycle = A('Hero Sprint');                       // Aarav's cycle: two pending offers + (below) a counter
await Offer.create({ listing: cycle._id, buyer: U(1), seller: U(0), amount: 2800, message: 'Can you do 2800? I can pick it up today.', expiresAt: inDays(2) });
await Offer.create({ listing: cycle._id, buyer: U(2), seller: U(0), amount: 2600, expiresAt: inDays(2) });
const lamp = A('Philips');                            // Rohan countered by Aarav -> Rohan must respond
await Offer.create({ listing: lamp._id, buyer: U(2), seller: U(0), amount: 400, counterAmount: 480, status: 'countered', expiresAt: inDays(2) });
const table = A('Study Table');                       // reserved: accepted offer, meetup proposed by buyer -> Karthik must agree
const o1 = await Offer.create({ listing: table._id, buyer: U(0), seller: U(4), amount: 1500, finalAmount: 1500, status: 'accepted', isOpen: false, expiresAt: inDays(1) });
await Listing.updateOne({ _id: table._id }, { status: 'reserved', reservedOffer: o1._id });
await Meetup.create({ offer: o1._id, listing: table._id, buyer: U(0), seller: U(4), location: 'Hostel Block Lobby', proposedTime: inDays(1), proposedBy: U(0), status: 'proposed' });
const racket = A('Yonex');                            // reserved + scheduled: both can confirm handover to complete the sale
const o2 = await Offer.create({ listing: racket._id, buyer: U(3), seller: U(2), amount: 950, finalAmount: 950, status: 'accepted', isOpen: false, expiresAt: inDays(1) });
await Listing.updateOne({ _id: racket._id }, { status: 'reserved', reservedOffer: o2._id });
await Meetup.create({ offer: o2._id, listing: racket._id, buyer: U(3), seller: U(2), location: 'Sports Complex', proposedTime: inDays(1), proposedBy: U(2), status: 'scheduled' });

console.log(`Seeded ${users.length} users, ${active.length + SOLD.length + 0} listings (${SOLD.length} sold), with sample deals in progress.\n`);
console.log(`Demo logins (password for all: ${PASSWORD})`);
users.forEach((u) => console.log(`  ${u.email}`));
console.log('\nTry: aarav (2 offers + a counter on his listings) · karthik (must agree to a meetup) · priya (price-hunting buyer)');
await mongoose.disconnect();
