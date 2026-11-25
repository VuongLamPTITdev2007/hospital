// Kiểm tra migration chỉ đọc; không tạo index hoặc sửa database.
require('dotenv').config();
const mongoose = require('mongoose');
const { ACTIVE_STATUSES, INDEX_NAME, normalizeSlot, validSlot, validDate } = require('../services/slotPolicy');

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, serverSelectionTimeoutMS: 12000 });
  if (mongoose.connection.name !== 'medcare_db') throw new Error('Không đúng database nhóm medcare_db.');
  const collection = mongoose.connection.db.collection('appointments');
  const records = await collection.find({}, { projection: { doctorId: 1, date: 1, timeSlot: 1, status: 1, holdingExpiresAt: 1 } }).toArray();
  const invalid = records.filter((record) => !mongoose.isValidObjectId(record.doctorId) || !validDate(record.date) || !validSlot(normalizeSlot(record.timeSlot)) || !ACTIVE_STATUSES.concat('cancelled').includes(record.status));
  const counts = new Map();
  for (const record of records.filter((entry) => ACTIVE_STATUSES.includes(entry.status))) {
    const key = `${record.doctorId}|${record.date}|${normalizeSlot(record.timeSlot)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const duplicates = [...counts.values()].filter((count) => count > 1).length;
  const index = (await collection.indexes()).find((entry) => entry.name === INDEX_NAME);
  console.log(JSON.stringify({ database: mongoose.connection.name, total: records.length, invalid: invalid.length, duplicateActiveGroups: duplicates, slotsToNormalize: records.filter((record) => record.timeSlot !== normalizeSlot(record.timeSlot)).length, targetIndexPresent: !!index, writes: false }));
  await mongoose.disconnect();
};
main().catch(async (error) => { console.error(`SLOT_AUDIT_FAILED: ${error.message}`); await mongoose.disconnect(); process.exitCode = 1; });
