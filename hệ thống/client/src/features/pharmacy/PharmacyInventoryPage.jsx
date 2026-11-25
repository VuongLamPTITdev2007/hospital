import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Pill, ClipboardList, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  fetchPrescriptions,
  fetchPatients,
  createPrescription,
  dispensePrescription
} from './pharmacyApi';
import MedicineTable from './components/MedicineTable';
import MedicineFormModal from './components/MedicineFormModal';
import PrescriptionBuilder from './components/PrescriptionBuilder';
import PrescriptionList from './components/PrescriptionList';
import PrintablePrescription from './components/PrintablePrescription';

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  pharmacist: 'Dược sĩ',
  patient: 'Bệnh nhân'
};

const PharmacyInventoryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || '';

  const canManageInventory = role === 'pharmacist' || role === 'admin';
  const canPrescribe = role === 'doctor' || role === 'admin';
  const canDispense = role === 'pharmacist' || role === 'admin';

  const [activeTab, setActiveTab] = useState('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [submittingMedicine, setSubmittingMedicine] = useState(false);
  const [patients, setPatients] = useState([]);

  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState('');
  const [printingPrescription, setPrintingPrescription] = useState(null);

  const {
    data: medicinesRes,
    loading: medicinesLoading,
    error: medicinesError,
    refetch: refetchMedicines
  } = useFetch('/medicines');

  const medicines = medicinesRes?.data || [];

  const loadPrescriptions = async () => {
    if (!isAuthenticated) return;
    setPrescriptionsLoading(true);
    setPrescriptionsError('');
    try {
      const res = await fetchPrescriptions();
      setPrescriptions(res.data || []);
    } catch (err) {
      setPrescriptionsError(err.message || 'Không thể tải danh sách đơn thuốc!');
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadPrescriptions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !canPrescribe) return;

    const loadPatients = async () => {
      try {
        const res = await fetchPatients();
        setPatients(res.data || []);
      } catch {
        setPatients([]);
      }
    };

    loadPatients();
  }, [isAuthenticated, canPrescribe]);

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleSaveMedicine = async (payload) => {
    setSubmittingMedicine(true);
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine._id, payload);
      } else {
        await createMedicine(payload);
      }
      await refetchMedicines();
    } finally {
      setSubmittingMedicine(false);
    }
  };

  const handleDeleteMedicine = async (medicine) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa thuốc "${medicine.name}" khỏi kho?`);
    if (!confirmed) return;

    try {
      await deleteMedicine(medicine._id);
      await refetchMedicines();
    } catch (err) {
      window.alert(err.message || 'Không thể xóa thuốc!');
    }
  };

  const handleCreatePrescription = async (payload) => {
    await createPrescription(payload);
    await loadPrescriptions();
  };

  const handleDispensePrescription = async (id) => {
    await dispensePrescription(id);
    await loadPrescriptions();
    await refetchMedicines();
  };

  const pendingCount = useMemo(
    () => prescriptions.filter((p) => !p.isDispensed).length,
    [prescriptions]
  );

  const tabs = [
    { key: 'inventory', label: 'Kho thuốc phòng khám', icon: Package, visible: true },
    { key: 'prescribe', label: 'Kê đơn thuốc', icon: Pill, visible: canPrescribe },
    { key: 'prescriptions', label: 'Đơn thuốc & Xuất kho', icon: ClipboardList, visible: isAuthenticated, badge: pendingCount }
  ].filter((tab) => tab.visible);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-semibold mb-2">
            Quản lý Dược phẩm
          </span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Kho Thuốc & Kê Đơn Điện Tử
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu tồn kho, cảnh báo thuốc sắp hết, kê đơn thuốc và duyệt xuất kho.
          </p>
        </div>

        {!isAuthenticated ? (
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors shrink-0"
          >
            <LogIn className="w-4 h-4 mr-2" /> Đăng nhập để kê đơn / xuất kho
          </Link>
        ) : (
          <div className="text-xs px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 shrink-0">
            Đang đăng nhập: <span className="font-semibold">{user?.fullName}</span> ({ROLE_LABELS[role] || role})
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.badge > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="print:hidden">
        {activeTab === 'inventory' && (
          <MedicineTable
            medicines={medicines}
            loading={medicinesLoading}
            error={medicinesError}
            onRetry={refetchMedicines}
            canManage={canManageInventory}
            onAdd={handleOpenAdd}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteMedicine}
          />
        )}

        {activeTab === 'prescribe' && canPrescribe && (
          <PrescriptionBuilder
            medicines={medicines}
            patients={patients}
            onCreatePrescription={handleCreatePrescription}
          />
        )}

        {activeTab === 'prescriptions' && isAuthenticated && (
          <PrescriptionList
            prescriptions={prescriptions}
            loading={prescriptionsLoading}
            error={prescriptionsError}
            onRetry={loadPrescriptions}
            canDispense={canDispense}
            onDispense={handleDispensePrescription}
            onPrint={setPrintingPrescription}
          />
        )}
      </div>

      <MedicineFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingMedicine}
        onSubmit={handleSaveMedicine}
        submitting={submittingMedicine}
      />

      <PrintablePrescription
        prescription={printingPrescription}
        onClose={() => setPrintingPrescription(null)}
      />
    </div>
  );
};

export default PharmacyInventoryPage;
