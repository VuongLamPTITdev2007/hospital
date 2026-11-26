const ACTIVE_STATUSES = ['holding', 'confirmed', 'waiting', 'in_progress', 'completed'];
const INDEX_NAME = 'unique_active_doctor_slot';
const normalizeSlot = (slot) => typeof slot === 'string' ? slot.replace(/\s+/g, '') : '';
const validSlot = (slot) => /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(slot) && slot.slice(0, 5) < slot.slice(6);
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const indexOptions = { name: INDEX_NAME, unique: true, partialFilterExpression: { status: { $in: ACTIVE_STATUSES } } };

module.exports = { ACTIVE_STATUSES, INDEX_NAME, normalizeSlot, validSlot, validDate, indexOptions };
