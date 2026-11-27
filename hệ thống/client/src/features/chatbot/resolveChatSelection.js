const normalizeName = (name) => name.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();

const startsIn = (time, partOfDay) => {
  if (time < '12:00') return partOfDay === 'morning';
  if (time < '18:00') return partOfDay === 'afternoon';
  return partOfDay === 'evening';
};

export const resolveChatSelection = (intent, search, context) => {
  if (intent.previousSearch) return { reply: 'Bạn hãy chọn từ lần tra gần nhất hoặc tra lại lịch muốn đặt.' };
  const options = search?.options || [];
  if (!options.length) return { reply: 'Bạn hãy hỏi lịch trống trước, rồi chọn một ca trong kết quả.' };

  const { followUp, previousSearch, ...requested } = intent;
  const previous = followUp && !requested.slotNumber ? { ...context?.criteria } : {};
  if (requested.doctorNumber || requested.doctorName || requested.sameDoctor) {
    delete previous.doctorNumber;
    delete previous.doctorName;
    delete previous.sameDoctor;
  }
  const criteria = { ...previous, ...requested };
  const { slotNumber, doctorNumber, doctorName, sameDoctor, date, dayOfMonth, month, startTime, partOfDay } = criteria;
  const doctors = [...new Set(options.map((option) => option.doctorId))];
  const currentDoctor = context?.doctorId || (doctors.length === 1 ? doctors[0] : null);
  const doctor = doctorNumber ? doctors[doctorNumber - 1] : sameDoctor ? currentDoctor : null;
  if (sameDoctor && !doctor && !doctorName) {
    return { reply: 'Bạn đang nói đến bác sĩ nào? Bạn có thể nhập tên hoặc thứ tự bác sĩ.', criteria };
  }
  if (!slotNumber && !doctorNumber && !doctorName && !sameDoctor && !date && !dayOfMonth && !month && !startTime && !partOfDay) {
    return { reply: 'Bạn muốn chọn ca số mấy? Bạn cũng có thể nêu bác sĩ, ngày hoặc giờ khám.', criteria };
  }
  if (slotNumber > options.length || doctorNumber > doctors.length) {
    return { reply: `Số bạn chọn chưa có trong danh sách đang hiển thị.${search.nextPage ? ' Bạn có thể bấm Xem thêm để tải các ca tiếp theo.' : ' Hãy chọn một số đang hiển thị hoặc tra lịch khác.'}` };
  }

  const name = doctorName ? normalizeName(doctorName) : '';
  const matching = options.filter((option, index) =>
    (!slotNumber || index + 1 === slotNumber) &&
    (!doctor || option.doctorId === doctor) &&
    (!doctorName || (name && (` ${normalizeName(option.doctorName)} `).includes(` ${name} `))) &&
    (!date || option.date === date) &&
    (!dayOfMonth || Number(option.date.slice(-2)) === dayOfMonth) &&
    (!month || Number(option.date.slice(5, 7)) === month) &&
    (!startTime || option.timeSlot.slice(0, 5) === startTime) &&
    (!partOfDay || startsIn(option.timeSlot.slice(0, 5), partOfDay))
  );
  if (matching.length === 1) return { optionId: matching[0].optionId };
  if (!matching.length) return { reply: 'Mình chưa thấy ca phù hợp trong kết quả đang hiển thị. Bạn có thể chọn một ca khác hoặc tra lịch mới.' };

  const matchingDoctors = new Set(matching.map((option) => option.doctorId));
  const details = [];
  if (matchingDoctors.size > 1) details.push('bác sĩ');
  if (new Set(matching.map((option) => option.date)).size > 1) details.push('ngày');
  if (new Set(matching.map((option) => option.timeSlot)).size > 1) details.push('giờ');
  const examples = matching.slice(0, 3).map((option) =>
    `#${options.indexOf(option) + 1} · ${option.doctorName} · ${option.date.split('-').reverse().join('/')} · ${option.timeSlot}`
  );
  return {
    reply: `Có ${matching.length} ca phù hợp. Bạn cho mình biết thêm ${details.join(', ') || 'số ca'}, hoặc nhập số ca muốn chọn.\n${examples.join('\n')}`,
    criteria,
    doctorId: matchingDoctors.size === 1 ? matching[0].doctorId : null
  };
};
