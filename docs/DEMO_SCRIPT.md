# Demo script (3–5 minutes)

Setup: seed the database (`npm run seed`), open two browser profiles. Window A = **Priya** (buyer), window B = **Aarav** (seller). Password for all: `Password123!`.

| Time | Do | Say |
|---|---|---|
| 0:00 | Landing page | The problem: campus resale lives in chaotic WhatsApp groups with no search, no status and no fair price. ResellRing is for students only (college-email sign-up). |
| 0:30 | Browse: search "cycle", filter by category and price | Search, filters and sorting over real listings. |
| 1:00 | **Sold prices** page | Real final prices from completed handovers, so both sides negotiate fairly. |
| 1:30 | A: open Aarav's *Philips Desk Lamp* → offer ₹450 | Offer box shows the average sold price as a hint. |
| 2:00 | B: navbar badge → **My deals → Selling** → **Counter** ₹500 | Seller can accept, decline or counter. |
| 2:30 | A: **My deals → Buying** → **Accept counter** | Accepting reserves the item atomically and auto-declines all other offers. |
| 3:00 | A: propose "Main Library Entrance" + time; B: **Agree** | Meetup coordination. |
| 3:30 | Both click **Confirm handover** | Only when both confirm is the item marked sold at the agreed price. |
| 4:00 | A: rate Aarav 5★ → open his profile | One rating per transaction, buyer only; the average updates. |
| 4:30 | Show an error (e.g. try offering on your own listing, or a duplicate offer) | Server enforces every rule: 409/403 with clear messages. Close with the architecture diagram from the README. |
