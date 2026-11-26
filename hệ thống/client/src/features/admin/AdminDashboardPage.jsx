import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useFetch } from '../../hooks/useFetch';

const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const AdminDashboardPage = () => {
  const today = localDate(new Date());
  const [draft, setDraft] = useState({ from: `${today.slice(0, 7)}-01`, to: today });
  const [filters, setFilters] = useState(draft);
  const [validation, setValidation] = useState('');
  const { data, loading, error, refetch } = useFetch(`/admin/analytics?from=${filters.from}&to=${filters.to}`);
  const report = data?.data;
  const apply = (event) => { event.preventDefault(); if (!draft.from || !draft.to || draft.from > draft.to) { setValidation('Ngày bắt đầu phải không sau ngày kết thúc.'); return; } setValidation(''); setFilters({ ...draft }); };
  const cards = report ? [['Phí khám mô phỏng', `${report.summary.simulatedFee.toLocaleString('vi-VN')} đ`], ['Ca khám hoàn tất', report.summary.completed], ['Bệnh nhân', report.summary.patients], ['Bác sĩ và dược sĩ', report.summary.staff]] : [];
  return <div className="space-y-6"><header className="rounded-2xl border bg-white p-6 dark:bg-slate-800"><h1 className="text-2xl font-bold">Quản trị & Thống kê</h1><p className="mt-2 text-sm text-slate-500">Phí khám dự kiến của các ca hoàn tất có xác nhận cọc demo; không phải doanh thu ngân hàng thực thu. Tài khoản được tính toàn hệ thống, không theo khoảng ngày.</p></header>
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 dark:bg-slate-800"><label className="text-sm">Từ ngày<input className="mt-1 block rounded border p-2 dark:bg-slate-900" type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label><label className="text-sm">Đến ngày<input className="mt-1 block rounded border p-2 dark:bg-slate-900" type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label><Button type="submit">Xem báo cáo</Button></form>
    {validation && <p role="alert" className="text-red-600">{validation}</p>}
    {loading ? <Loader text="Đang tải báo cáo..." /> : error ? <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"><p>{error}</p><Button variant="outline" onClick={refetch}>Thử lại</Button></div> : report && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <section key={label} className="rounded-xl border bg-white p-5 dark:bg-slate-800"><p className="text-sm text-slate-500">{label}</p><strong className="text-xl">{value}</strong></section>)}</div><section className="rounded-xl border bg-white p-6 dark:bg-slate-800"><h2 className="mb-4 font-bold">Phí khám mô phỏng theo chuyên khoa</h2>{report.specialties.length === 0 ? <p className="text-slate-500">Không có ca phù hợp trong khoảng ngày đã chọn.</p> : <div className="space-y-3">{report.specialties.map((item) => <div key={item.specialty} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><span>{item.specialty} · {item.appointments} ca</span><strong>{item.simulatedFee.toLocaleString('vi-VN')} đ</strong></div>)}</div>}</section></>}
  </div>;
};
export default AdminDashboardPage;
