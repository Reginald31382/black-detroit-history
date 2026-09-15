import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src/data/detroit_black_history_seed_v1.json"),
    "utf8",
  ),
);
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not defined");
const schema = new mongoose.Schema(
  {
    month: Number,
    day: Number,
    year: Number,
    title: String,
    description: String,
    significance: String,
    category: String,
    people: [String],
    organizations: [String],
    location: Object,
    sources: Array,
    images: Array,
    verification: Object,
    instagram: Object,
    lifecycle: Object,
  },
  { timestamps: true },
);
const Event =
  mongoose.models.HistoryEvent || mongoose.model("HistoryEvent", schema);
await mongoose.connect(uri);
let inserted = 0,
  updated = 0;
for (const item of data) {
  const filter = {
    month: item.month,
    day: item.day,
    year: item.year,
    title: item.title,
  };
  const payload = {
    ...item,
    lifecycle: { status: "active", usedAt: null, usedNotes: "" },
  };
  const result = await Event.updateOne(
    filter,
    { $set: payload },
    { upsert: true },
  );
  if (result.upsertedCount) inserted++;
  else updated++;
}
console.log({ total: data.length, inserted, updated });
await mongoose.disconnect();
