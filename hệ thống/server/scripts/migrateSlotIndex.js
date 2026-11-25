// Chỉ chạy sau khi đã tạm dừng mọi tiến trình ghi Booking và có phương án phục hồi.
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { EJSON } = require('bson');
const { ACTIVE_STATUSES, normalizeSlot, validSlot, validDate, indexOptions } = require('../services/slotPolicy');

const run = async () => {
  if (process.env.MEDCARE_BOOKING_PAUSED !== 'YES') throw new Error('Chưa xác nhận mọi tiến trình ghi lịch đã dừng (MEDCARE_BOOKING_PAUSED=YES).');
  const backupPath = process.env.MEDCARE_SLOT_BACKUP_PATH;
  if (!backupPath || !path.isAbsolute(backupPath)) throw new Error('Cần MEDCARE_SLOT_BACKUP_PATH là đường dẫn tuyệt đối cho bản sao lưu mới.');
  await mongoose.connect(process.env.MONGO_URI, { autoIndex: false, serverSelectionTimeoutMS: 12000 });
  if (mongoose.connection.name !== 'medcare_db') throw new Error('Database không phải medcare_db; dừng migration.');
  const collection = mongoose.connection.db.collection('appointments');
  const records = await collection.find({}).toArray();
  const invalid = records.filter((record) => !mongoose.isValidObjectId(record.doctorId) || !validDate(record.date) || !validSlot(normalizeSlot(record.timeSlot)) || !ACTIVE_STATUSES.concat('cancelled').includes(record.status));
  if (invalid.length) throw new Error(`Có ${invalid.length} lịch không hợp lệ, cần kiểm tra thủ công.`);
  const counts = new Map();
  for (const record of records.filter((item) => ACTIVE_STATUSES.includes(item.status))) {
    const key = `${record.doctorId}|${record.date}|${normalizeSlot(record.timeSlot)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  if ([...counts.values()].some((count) => count > 1)) throw new Error('Có slot hiệu lực trùng sau chuẩn hóa; dừng và xử lý thủ công.');
  const priorIndexes = await collection.indexes();
  // Chống ghi đè bản sao cũ. Bản sao chứa dữ liệu thật, cần được lưu bảo mật.
  fs.writeFileSync(backupPath, EJSON.stringify({ database: mongoose.connection.name, collection: 'appointments', timestamp: new Date(), indexes: priorIndexes, records }, { relaxed: false }), { flag: 'wx', mode: 0o600 });
  const changed = records.filter((item) => item.timeSlot !== normalizeSlot(item.timeSlot));
  for (const item of changed) {
    const result = await collection.updateOne({ _id: item._id, timeSlot: item.timeSlot, status: item.status, doctorId: item.doctorId, date: item.date }, { $set: { timeSlot: normalizeSlot(item.timeSlot) } });
    if (result.matchedCount !== 1) throw new Error('Dữ liệu thay đổi trong lúc migration; dừng và đối chiếu bản sao lưu.');
  }
  const index = await collection.createIndex({ doctorId: 1, date: 1, timeSlot: 1 }, indexOptions);
  const actual = (await collection.indexes()).find((item) => item.name === indexOptions.name);
  if (!actual?.unique || JSON.stringify(actual.partialFilterExpression?.status?.$in) !== JSON.stringify(ACTIVE_STATUSES)) throw new Error('Index tạo ra không khớp yêu cầu; tiếp tục giữ trạng thái bảo trì.');
  console.log(JSON.stringify({ database: mongoose.connection.name, records: records.length, normalized: changed.length, index, backupCreated: true }));
  await mongoose.disconnect();
};
run().catch(async (error) => { console.error(`MIGRATION_FAILED: ${error.message}`); await mongoose.disconnect(); process.exitCode = 1; });
