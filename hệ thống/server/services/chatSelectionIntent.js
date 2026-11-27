const { fold, getAvailabilityFilters } = require('./availabilityService');
const { validDate } = require('./slotPolicy');

const numberWords = ['dau tien', 'mot', 'hai', 'ba', 'tu', 'nam', 'sau', 'bay', 'tam', 'chin', 'muoi'];
const ordinalPattern = `(?:dau tien|(?:so|thu) (?:${numberWords.slice(1).join('|')}|\\d+))`;
const negativeSelection = /\b(?:khong (?:(?:muon|can) )?|dung )(?:chon|chot|lay|dat)\b/;
const readOrdinal = (match) => {
  if (!match) return undefined;
  const word = match.replace(/^(so|thu) /, '');
  const index = numberWords.indexOf(word);
  if (index === 0) return 1;
  return index > 0 ? index : Number(word);
};

const shouldSelectDisplayedSlot = (message, { hasDisplayedSlots, awaitingSelectionDetail }) => {
  const text = fold(message);
  if (negativeSelection.test(text) || /\b(tim|tra|xem|kiem tra|huy|con (?:lich|ca|gio|trong)|the nao|da (?:chon|dat)|bao nhieu)\b/.test(text)) return false;

  if (awaitingSelectionDetail && /^(?:(?:bac si|bs|ngay)\b|#\s*\d+|\d{1,2}\s*(?:h(?:[0-5]\d)?\b|gio\b|[:.]\d{2}))/.test(text)) return true;
  const refersToOption = /\b(lich|ca|bac si|gio|so \d+)\b|#\s*\d+/.test(text);
  const refersToPosition = /\b(dau tien|thu (?:hai|ba|tu|nam|sau|bay|tam|chin|\d+)|bac si (?:nay|do))\b|#\s*\d+/.test(text);
  return refersToOption && (/\b(chon|chot|lay)\b/.test(text) || (/\bdat\b/.test(text) && (hasDisplayedSlots || refersToPosition)));
};

const readSpokenSelection = (message, followUp) => {
  const text = fold(message).replace(/\s+/g, ' ');
  if (negativeSelection.test(text)) return null;
  const previousSearch = /\b(?:danh sach|luot tra|ket qua) (?:cu|truoc|ban dau)\b/.test(text);
  if (previousSearch) return { previousSearch: true };

  const numberedSlot = text.match(/#\s*(\d+)|\b(?:chon|lay|chot) so (\d+)\b/);
  const slotNumber = numberedSlot ? Number(numberedSlot[1] || numberedSlot[2]) :
    readOrdinal(text.match(new RegExp(`\\b(?:lich|ca|khung gio) (${ordinalPattern})\\b`))?.[1]);
  const doctorNumber = readOrdinal(text.match(new RegExp(`\\b(?:bac si|bs) (${ordinalPattern})\\b`))?.[1]);
  const sameDoctor = /\b(?:bac si|bs) (?:nay|do|vua chon|vua neu)\b/.test(text);
  const doctorName = doctorNumber || sameDoctor ? undefined : text.match(/\b(?:bac si|bs) (.+)$/)?.[1]
    .split(/\s+(?:vao|luc|ngay|hom nay|buoi|thu|va|hoac|cho|giup|nhe)\b|\s+\d|[.,;?!]/)[0];
  if (doctorName && /\b(?:nao|khac|giup|duoc khong)\b/.test(doctorName)) return null;

  const isoDate = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
  const slashDate = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  let date = isoDate;
  if (slashDate?.[3]) date = `${slashDate[3]}-${slashDate[2].padStart(2, '0')}-${slashDate[1].padStart(2, '0')}`;
  if (!date && /\b(hom nay|ngay mai)\b/.test(text)) {
    date = getAvailabilityFilters({ period: /\bngay mai\b/.test(text) ? 'tomorrow' : 'today' }).dateFrom;
  }
  if (date && !validDate(date)) return null;
  const day = slashDate?.[1] || text.match(/\bngay (\d{1,2})\b/)?.[1];
  const dayOfMonth = !date && day ? Number(day) : undefined;
  const month = !date && slashDate ? Number(slashDate[2]) : undefined;

  const clocks = [...text.matchAll(/\b(\d{1,2})\s*(?:[:.h]\s*(\d{2})|(gio|h)\b|(am|pm)\b)\s*(am|pm)?\b/g)];
  if (clocks.length > 1 || (clocks.length && /\b(?:sau|truoc|khoang|tu)\s+\d/.test(text))) return null;
  const clock = clocks[0];
  let startTime;
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = clock[2] || '00';
    const meridiem = clock[4] || clock[5];
    if (hours > 23 || Number(minutes) > 59 || (meridiem && (hours < 1 || hours > 12))) return null;
    const localHours = meridiem ? (hours % 12) + (meridiem === 'pm' ? 12 : 0) : hours;
    startTime = `${String(localHours).padStart(2, '0')}:${minutes}`;
  }
  const period = text.match(/\b(?:lich|ca|buoi) (sang|chieu|toi)\b/)?.[1];
  const partOfDay = { sang: 'morning', chieu: 'afternoon', toi: 'evening' }[period];
  return { slotNumber, doctorNumber, doctorName, sameDoctor: sameDoctor || undefined, date, dayOfMonth, month, startTime, partOfDay, followUp };
};

module.exports = { shouldSelectDisplayedSlot, readSpokenSelection };
