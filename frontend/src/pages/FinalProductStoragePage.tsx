import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Save, Trash2, Eye, Edit2, RefreshCw, Download,
  FlaskConical, Calendar, Clock, CheckCircle2, XCircle, ShieldCheck
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { finalProductService } from '../services/finalProduct.service';
import type { FinalProductRecord, FinalProductFormData } from '../types';
import { formatDate } from '../lib/utils';
import { useAuthStore } from '../store/auth.store';

// ─── Safe UUID generator (works on HTTP / non-secure origins) ───────────────
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ─── Empty row factory ────────────────────────────────────────────────────────
const emptyRow = (): Omit<FinalProductFormData, 'date' | 'shift' | 'chemist_name' | 'quality_incharge_name'> & { _id: string } => ({
  _id: generateId(),
  testing_time: '',
  tank_no: '',
  type_of_milk: 'cow',
  milk_quantity_l: undefined,
  temp_celsius: undefined,
  flavour_taste: '',
  acidity_percent: undefined,
  alcohol_result: '',
  fat_percent: undefined,
  clr: undefined,
  snf_percent: undefined,
  efficiency_percent: null,
  protein_percent: undefined,
  electrolyte_condition: '',
  remark: '',
});

type RowData = ReturnType<typeof emptyRow>;

const shiftOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

const milkTypeOptions = [
  { value: 'cow', label: 'Cow' },
  { value: 'buffalo', label: 'Buffalo' },
  { value: 'mixed', label: 'Mixed' },
];

const shiftColors: Record<string, string> = {
  morning: 'bg-amber-100 text-amber-800 border-amber-200',
  evening: 'bg-orange-100 text-orange-800 border-orange-200',
  night:   'bg-indigo-100 text-indigo-800 border-indigo-200',
};

// ─── Inline editable cell ────────────────────────────────────────────────────
function Cell({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  options,
}: {
  value: any;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  options?: { value: string; label: string }[];
}) {
  if (options) {
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-2 py-1.5 text-xs border border-transparent rounded focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 bg-transparent hover:bg-white transition-colors ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(type === 'number' ? (v === '' ? undefined : parseFloat(v)) : v);
      }}
      placeholder={placeholder}
      step={type === 'number' ? '0.01' : undefined}
      className={`w-full px-2 py-1.5 text-xs border border-transparent rounded focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 bg-transparent hover:bg-white transition-colors ${className}`}
    />
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FinalProductStoragePage() {
  const today = new Date().toISOString().split('T')[0];

  // Filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Current user & permissions
  const { user: currentUser } = useAuthStore();
  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'lab_incharge' || currentUser?.role === 'quality_incharge' || currentUser?.role === 'qc_manager';

  // Approval modal state
  const [approvalRecord, setApprovalRecord] = useState<FinalProductRecord | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [approvalComment, setApprovalComment] = useState('');
  const [approving, setApproving] = useState(false);

  // Form state (new-entry mode)
  const [formDate, setFormDate] = useState(today);
  const [formShift, setFormShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [chemistName, setChemistName] = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [rows, setRows] = useState<RowData[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  // View / Edit modal state
  const [viewRecord, setViewRecord] = useState<FinalProductRecord | null>(null);
  const [editRecord, setEditRecord] = useState<FinalProductRecord | null>(null);
  const [editRows, setEditRows] = useState<RowData[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Tab: 'entry' | 'records'
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  const queryClient = useQueryClient();

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['finalProductRecords', filterDate, filterShift, filterStatus],
    queryFn: () =>
      finalProductService.getAll({
        ...(filterDate ? { date: filterDate } : {}),
        ...(filterShift !== 'all' ? { shift: filterShift } : {}),
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
      }),
  });

  const filteredRecords: FinalProductRecord[] = records?.data ?? [];

  // ── Row helpers ────────────────────────────────────────────────────────────
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r._id !== id));
  const updateRow = (id: string, field: keyof RowData, value: any) =>
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)));

  // ── Save all rows ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validRows = rows.filter((r) => r.tank_no.trim() !== '');
    if (validRows.length === 0) {
      toast.error('Kripaya kam se kam ek row madhe Tank No. bhari');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        validRows.map(({ _id, ...rowData }) =>
          finalProductService.create({
            date: formDate,
            shift: formShift,
            chemist_name: chemistName,
            quality_incharge_name: qualityInchargeName,
            ...rowData,
          })
        )
      );
      toast.success(`${validRows.length} record${validRows.length > 1 ? 's' : ''} saved successfully!`);
      setRows([emptyRow()]);
      setChemistName('');
      setQualityInchargeName('');
      queryClient.invalidateQueries({ queryKey: ['finalProductRecords'] });
      setActiveTab('records');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save karta aale nahi');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit modal helpers ─────────────────────────────────────────────────────
  const openEdit = (rec: FinalProductRecord) => {
    setEditRecord(rec);
    const { id, created_at, updated_at, created_by, created_by_name, date, shift, chemist_name, quality_incharge_name, ...rest } = rec as any;
    setEditRows([{ _id: generateId(), ...rest }]);
  };

  const handleEditSave = async () => {
    if (!editRecord) return;
    const row = editRows[0];
    if (!row) return;
    setEditSaving(true);
    try {
      const { _id, ...data } = row;
      await finalProductService.update(editRecord.id, data);
      toast.success('Record updated successfully');
      setEditRecord(null);
      queryClient.invalidateQueries({ queryKey: ['finalProductRecords'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const openApprovalModal = (rec: FinalProductRecord, action: 'approved' | 'rejected') => {
    setApprovalRecord(rec);
    setApprovalAction(action);
    setApprovalComment('');
  };

  const handleApprove = async () => {
    if (!approvalRecord) return;
    setApproving(true);
    try {
      await finalProductService.approve(approvalRecord.id, approvalAction, approvalComment || undefined);
      toast.success(`Record ${approvalAction === 'approved' ? 'approved ✅' : 'rejected ❌'} successfully`);
      setApprovalRecord(null);
      queryClient.invalidateQueries({ queryKey: ['finalProductRecords'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setApproving(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = [
      'Date', 'Shift', 'Testing Time', 'Tank No', 'Milk Type',
      'Qty (L)', 'Temp (°C)', 'Flavour/Taste', 'Acidity %', 'Alcohol',
      'FAT %', 'CLR', 'SNF %', 'Efficiency %', 'Protein %',
      'Electrolyte', 'Remark', 'Chemist', 'Quality Incharge'
    ];
    const csvRows = filteredRecords.map((r) => [
      r.date, r.shift, r.testing_time ?? '', r.tank_no, r.type_of_milk,
      r.milk_quantity_l ?? '', r.temp_celsius ?? '', r.flavour_taste ?? '',
      r.acidity_percent ?? '', r.alcohol_result ?? '',
      r.fat_percent ?? '', r.clr ?? '', r.snf_percent ?? '',
      r.efficiency_percent ?? '', r.protein_percent ?? '',
      r.electrolyte_condition ?? '', r.remark ?? '',
      r.chemist_name ?? '', r.quality_incharge_name ?? '',
    ]);
    const csv = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `final_product_${filterDate || 'all'}_${filterShift}.csv`;
    a.click();
  };

  // ── Column header def ──────────────────────────────────────────────────────
  const colDefs: { key: keyof RowData; label: string; type?: string; width?: string; options?: any[] }[] = [
    { key: 'testing_time',         label: 'Testing Time',      type: 'time',   width: '110px' },
    { key: 'tank_no',              label: 'Tank No.',          type: 'text',   width: '90px' },
    { key: 'type_of_milk',         label: 'Milk Type',         width: '90px',  options: milkTypeOptions },
    { key: 'milk_quantity_l',      label: 'Qty (L)',           type: 'number', width: '80px' },
    { key: 'temp_celsius',         label: 'Temp °C',           type: 'number', width: '75px' },
    { key: 'flavour_taste',        label: 'Flavour/Taste',     type: 'text',   width: '110px' },
    { key: 'acidity_percent',      label: 'Acidity %',         type: 'number', width: '80px' },
    { key: 'alcohol_result',       label: 'Alcohol',           type: 'text',   width: '90px' },
    { key: 'fat_percent',          label: 'FAT %',             type: 'number', width: '70px' },
    { key: 'clr',                  label: 'CLR',               type: 'number', width: '70px' },
    { key: 'snf_percent',          label: 'SNF %',             type: 'number', width: '70px' },
    { key: 'efficiency_percent',   label: 'Efficiency %',      type: 'number', width: '90px' },
    { key: 'protein_percent',      label: 'Protein %',         type: 'number', width: '80px' },
    { key: 'electrolyte_condition',label: 'Electrolyte',       type: 'text',   width: '110px' },
    { key: 'remark',               label: 'Remark',            type: 'text',   width: '130px' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            Final Product Storage Tank Record
          </h1>
          <p className="text-text-secondary mt-1 ml-13">
            Quality testing data for processed milk storage tanks
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 w-fit">
        {(['entry', 'records'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white dark:bg-secondary-700 shadow-sm text-primary-600 font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'entry' ? '+ New Entry' : 'View Records'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── ENTRY TAB ────────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'entry' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Date / Shift header */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />Date
                </label>
                <Input
                  id="form-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  label=""
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />Shift
                </label>
                <Select
                  id="form-shift"
                  value={formShift}
                  onChange={(e) => setFormShift(e.target.value as any)}
                  options={shiftOptions}
                  label=""
                />
              </div>
            </div>
          </Card>

          {/* Editable table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Testing Data</h3>
              <Button size="sm" onClick={addRow}>
                <Plus className="w-4 h-4 mr-1" />
                Add Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1400 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-emerald-700 w-10">#</th>
                    {colDefs.map((col) => (
                      <th
                        key={col.key}
                        className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 whitespace-nowrap"
                        style={{ minWidth: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs font-semibold text-emerald-700 w-12">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr
                      key={row._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-secondary-100 hover:bg-emerald-50/30 transition-colors group"
                    >
                      <td className="py-1 px-3 text-xs text-text-secondary font-medium">{idx + 1}</td>
                      {colDefs.map((col) => (
                        <td key={col.key} className="py-1 px-1">
                          <Cell
                            value={row[col.key]}
                            onChange={(v) => updateRow(row._id, col.key, v)}
                            type={col.type}
                            options={col.options}
                            placeholder={col.label}
                          />
                        </td>
                      ))}
                      <td className="py-1 px-3 text-center">
                        <button
                          onClick={() => removeRow(row._id)}
                          disabled={rows.length === 1}
                          className="p-1 rounded text-danger-400 hover:text-danger-600 hover:bg-danger-50 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Chemist / Quality Incharge + Save */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="chemist-name"
                  label="Chemist Name"
                  type="text"
                  value={chemistName}
                  onChange={(e) => setChemistName(e.target.value)}
                  placeholder="Enter chemist name"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="quality-incharge-name"
                  label="Quality Incharge Name"
                  type="text"
                  value={qualityInchargeName}
                  onChange={(e) => setQualityInchargeName(e.target.value)}
                  placeholder="Enter quality incharge name"
                />
              </div>
              <div className="flex gap-3 pb-0.5">
                <Button
                  variant="outline"
                  onClick={() => { setRows([emptyRow()]); setChemistName(''); setQualityInchargeName(''); }}
                >
                  Clear All
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : `Save ${rows.filter(r => r.tank_no.trim()).length > 0 ? `(${rows.filter(r => r.tank_no.trim()).length})` : ''} Records`}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── RECORDS TAB ──────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'records' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <Input
                  id="filter-date"
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select
                  id="filter-shift"
                  label="Filter by Shift"
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  options={[{ value: 'all', label: 'All Shifts' }, ...shiftOptions]}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select
                  id="filter-status"
                  label="Filter by Status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: 'all',      label: 'All Status' },
                    { value: 'pending',  label: '🟡 Pending' },
                    { value: 'approved', label: '✅ Approved' },
                    { value: 'rejected', label: '❌ Rejected' },
                  ]}
                />
              </div>
              <div className="pb-0.5">
                <Button variant="outline" onClick={() => { setFilterDate(''); setFilterShift('all'); setFilterStatus('all'); }}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Records table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">
                Records
                {filteredRecords.length > 0 && (
                  <span className="ml-2 text-xs text-text-secondary font-normal">
                    ({filteredRecords.length} found)
                  </span>
                )}
              </h3>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-text-secondary">Loading records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16">
                <FlaskConical className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-text-secondary">No records found for selected filters</p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setActiveTab('entry')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Entry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table" style={{ minWidth: 1400 }}>
                  <thead>
                    <tr className="bg-secondary-50 border-b border-secondary-200">
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Date</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Shift</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Time</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Tank No.</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Milk Type</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Qty (L)</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Temp °C</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">FAT %</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">SNF %</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Acidity %</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Alcohol</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">CLR</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Protein %</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Efficiency %</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Electrolyte</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Chemist</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Q. Incharge</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-secondary-100 hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-xs text-text-primary font-medium">{formatDate(rec.date)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${shiftColors[rec.shift]}`}>
                            {rec.shift.charAt(0).toUpperCase() + rec.shift.slice(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary">{rec.testing_time ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs font-medium text-text-primary">{rec.tank_no}</td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary capitalize">{rec.type_of_milk}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.milk_quantity_l?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.temp_celsius?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.fat_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.snf_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.acidity_percent?.toFixed(3) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.alcohol_result ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.clr?.toFixed(3) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.protein_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-primary">{rec.efficiency_percent != null ? rec.efficiency_percent.toFixed(2) : '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary">{rec.electrolyte_condition ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary">{rec.chemist_name ?? '—'}</td>
                        <td className="py-2.5 px-4 text-xs text-text-secondary">{rec.quality_incharge_name ?? '—'}</td>
                        {/* Status badge */}
                        <td className="py-2.5 px-4">
                          {rec.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          ) : rec.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <ShieldCheck className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewRecord(rec)}
                              className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-primary-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(rec)}
                              className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-primary-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {canApprove && rec.status !== 'approved' && (
                              <button
                                onClick={() => openApprovalModal(rec, 'approved')}
                                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canApprove && rec.status !== 'rejected' && (
                              <button
                                onClick={() => openApprovalModal(rec, 'rejected')}
                                className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODAL ───────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl max-h-[90vh] flex flex-col"
          >
            <Card className="p-0 overflow-hidden flex flex-col h-full">
              {/* ── Modal Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-emerald-800 tracking-wide uppercase">
                    Final Product Storage Tank Record
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-emerald-700 font-medium">
                    <span>Date: <strong>{formatDate(viewRecord.date)}</strong></span>
                    <span>|</span>
                    <span>Shift: <strong className="capitalize">{viewRecord.shift}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors text-lg font-bold"
                >✕</button>
              </div>

              {/* ── Paper-format Table ── */}
              <div className="overflow-x-auto overflow-y-auto flex-1 px-4 py-4">
                <table className="records-table w-full text-xs" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>Sr. No.</th>
                      <th>Testing Time</th>
                      <th>Tank No.</th>
                      <th>Type of Milk</th>
                      <th>Milk Qty (L)</th>
                      <th>Temp (°C)</th>
                      <th>Flavour / Taste</th>
                      <th>Acidity (%)</th>
                      <th>Alcohol</th>
                      <th>FAT (%)</th>
                      <th>CLR</th>
                      <th>SNF (%)</th>
                      <th>Efficiency (%)</th>
                      <th>Protein (%)</th>
                      <th>Electrolyte</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center font-semibold">1</td>
                      <td>{viewRecord.testing_time ?? '—'}</td>
                      <td className="font-semibold">{viewRecord.tank_no}</td>
                      <td className="capitalize">{viewRecord.type_of_milk}</td>
                      <td>{viewRecord.milk_quantity_l?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.temp_celsius?.toFixed(1) ?? '—'}</td>
                      <td>{viewRecord.flavour_taste ?? '—'}</td>
                      <td>{viewRecord.acidity_percent?.toFixed(3) ?? '—'}</td>
                      <td>{viewRecord.alcohol_result ?? '—'}</td>
                      <td>{viewRecord.fat_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.clr?.toFixed(3) ?? '—'}</td>
                      <td>{viewRecord.snf_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.efficiency_percent != null ? viewRecord.efficiency_percent.toFixed(2) : '—'}</td>
                      <td>{viewRecord.protein_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.electrolyte_condition ?? '—'}</td>
                      <td>{viewRecord.remark ?? '—'}</td>
                    </tr>
                    {/* Empty rows to match paper format */}
                    {[...Array(3)].map((_, i) => (
                      <tr key={i} className="h-8">
                        <td className="text-center text-secondary-300">{i + 2}</td>
                        {[...Array(15)].map((__, j) => <td key={j}>&nbsp;</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Footer: Signatures ── */}
              <div className="border-t border-secondary-200 px-6 py-4 flex-shrink-0 bg-white">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div className="text-center">
                    <div className="w-40 border-b border-secondary-400 mb-1 pb-1 text-sm font-medium text-text-primary">
                      {viewRecord.chemist_name || '—'}
                    </div>
                    <p className="text-xs text-text-secondary">Chemist</p>
                  </div>
                  <div className="text-xs text-text-secondary italic">
                    Created by: {viewRecord.created_by_name ?? '—'}
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b border-secondary-400 mb-1 pb-1 text-sm font-medium text-text-primary">
                      {viewRecord.quality_incharge_name || '—'}
                    </div>
                    <p className="text-xs text-text-secondary">Quality Incharge</p>
                  </div>
                </div>
              </div>

              {/* ── Close Button ── */}
              <div className="flex justify-end px-6 py-3 border-t border-secondary-100 bg-secondary-50 flex-shrink-0">
                <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── APPROVAL MODAL ───────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {approvalRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold flex items-center gap-2 ${
                  approvalAction === 'approved' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {approvalAction === 'approved'
                    ? <><CheckCircle2 className="w-5 h-5" /> Approve Record</>
                    : <><XCircle className="w-5 h-5" /> Reject Record</>}
                </h2>
                <button onClick={() => setApprovalRecord(null)} className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary transition-colors">✕</button>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Tank: <span className="font-semibold text-text-primary">{approvalRecord.tank_no}</span> &nbsp;|
                Date: <span className="font-semibold text-text-primary">{formatDate(approvalRecord.date)}</span>
              </p>
              <div className="mb-5">
                <label className="block text-sm font-medium text-text-secondary mb-1">Comment (optional)</label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setApprovalRecord(null)}>Cancel</Button>
                <Button
                  disabled={approving}
                  onClick={handleApprove}
                  className={approvalAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {approving ? 'Processing...' : approvalAction === 'approved' ? '✅ Confirm Approve' : '❌ Confirm Reject'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── EDIT MODAL ───────────────────────────────────────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl"
          >
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-text-primary">
                  Edit Record — {editRecord.tank_no} ({formatDate(editRecord.date)})
                </h2>
                <button
                  onClick={() => setEditRecord(null)}
                  className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary transition-colors"
                >✕</button>
              </div>
              <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                <table className="w-full text-sm" style={{ minWidth: 1300 }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                      {colDefs.map((col) => (
                        <th key={col.key} className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 whitespace-nowrap" style={{ minWidth: col.width }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editRows.map((row) => (
                      <tr key={row._id} className="border-b border-secondary-100">
                        {colDefs.map((col) => (
                          <td key={col.key} className="py-1 px-1">
                            <Cell
                              value={row[col.key]}
                              onChange={(v) =>
                                setEditRows((prev) =>
                                  prev.map((r) => (r._id === row._id ? { ...r, [col.key]: v } : r))
                                )
                              }
                              type={col.type}
                              options={col.options}
                              placeholder={col.label}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Chemist / Quality fields in edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-secondary-100">
                <Input
                  id="edit-chemist"
                  label="Chemist Name"
                  type="text"
                  value={editRecord.chemist_name ?? ''}
                  onChange={(e) => setEditRecord({ ...editRecord, chemist_name: e.target.value })}
                  placeholder="Chemist name"
                />
                <Input
                  id="edit-quality"
                  label="Quality Incharge Name"
                  type="text"
                  value={editRecord.quality_incharge_name ?? ''}
                  onChange={(e) => setEditRecord({ ...editRecord, quality_incharge_name: e.target.value })}
                  placeholder="Quality incharge name"
                />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
