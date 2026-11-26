// Quy ước chuẩn hóa khung giờ khám và cấu hình Unique Index chống trùng lịch
const ACTIVE_STATUSES = ['holding', 'confirmed', 'waiting', 'in_progress', 'completed'];
const INDEX_NAME = 'unique_active_doctor_slot';

// Chuẩn hóa timeSlot về dạng không dấu cách ('08:00-08:30') để đồng bộ với index trên MongoDB Atlas
const normalizeSlot = (slot) => (typeof slot === 'string' ? slot.replace(/\s+/g, '') : '');

// Kiểm tra định dạng khung giờ hợp lệ (HH:mm-HH:mm và giờ bắt đầu < giờ kết thúc)
const validSlot = (slot) =>
  /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(slot) &&
  slot.slice(0, 5) < slot.slice(6);

// Kiểm tra định dạng ngày YYYY-MM-DD hợp lệ theo lịch thực tế
const validDate = (date) =>
  typeof date === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) &&
  new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;

const indexOptions = {
  name: INDEX_NAME,
  unique: true,
  partialFilterExpression: { status: { $in: ACTIVE_STATUSES } }
};

module.exports = {
  ACTIVE_STATUSES,
  INDEX_NAME,
  normalizeSlot,
  validSlot,
  validDate,
  indexOptions
};
