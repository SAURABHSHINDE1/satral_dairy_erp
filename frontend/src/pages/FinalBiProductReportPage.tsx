import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Save, Trash2, Eye, Edit2, RefreshCw, Download, Package2,
  CheckCircle2, XCircle, ShieldCheck
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { biProductService } from '../services/biProduct.service';
import type { BiProductReport, BiProductFormData } from '../types';
import { formatDate } from '../lib/utils';
import { useAuthStore } from '../store/auth.store';

// ─── Product config — which fields are relevant per product ─────────────────
const PRESET_PRODUCTS = ['Dahi', 'Lassi', 'Paneer', 'Peda', 'Khoya', 'Other'];

type FieldKey = 'body_structure' | 'sensory' | 'taste' | 'temp_celsius' |
  'acidity_percent' | 'ph' | 'self_life' | 'fdm' | 'fat_percent' |
  'ts' | 'lassi_viscosity' | 'moisture';

// Fields that are ACTIVE (not greyed out) per product type
const PRODUCT_ACTIVE_FIELDS: Record<string, FieldKey[]> = {
  Dahi:   ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'ph', 'self_life', 'fat_percent', 'ts', 'fdm', 'lassi_viscosity', 'moisture'],
  Lassi:  ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'ph', 'self_life', 'fat_percent', 'ts', 'lassi_viscosity', 'fdm', 'moisture'],
  Paneer: ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'ph', 'self_life', 'fdm', 'fat_percent', 'ts', 'moisture', 'lassi_viscosity'],
  Peda:   ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'self_life', 'fdm', 'fat_percent', 'ts', 'moisture', 'lassi_viscosity'],
  Khoya:  ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'self_life', 'fat_percent', 'ts', 'moisture', 'fdm', 'lassi_viscosity'],
  Other:  ['body_structure', 'sensory', 'taste', 'temp_celsius', 'acidity_percent', 'ph', 'self_life', 'fdm', 'fat_percent', 'ts', 'lassi_viscosity', 'moisture'],
};

function isFieldActive(product: string, field: FieldKey): boolean {
  const activeFields = PRODUCT_ACTIVE_FIELDS[product] ?? PRODUCT_ACTIVE_FIELDS['Other'];
  return activeFields.includes(field);
}

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
type RowData = BiProductFormData & { _id: string; _customProduct?: string };

const emptyRow = (date: string): RowData => ({
  _id: generateId(),
  batch_no: '',
  date,
  product_name: 'Dahi',
  _customProduct: '',
  body_structure: '',
  sensory: '',
  taste: '',
  temp_celsius: undefined,
  acidity_percent: undefined,
  ph: undefined,
  self_life: '',
  fdm: null,
  fat_percent: null,
  ts: null,
  lassi_viscosity: null,
  moisture: null,
});

// ─── Inline editable cell ────────────────────────────────────────────────────
function Cell({
  value, onChange, type = 'text', placeholder = '', disabled = false,
}: {
  value: any;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => {
        const v = e.target.value;
        onChange(type === 'number' ? (v === '' ? null : parseFloat(v)) : v);
      }}
      placeholder={disabled ? '—' : placeholder}
      step={type === 'number' ? '0.001' : undefined}
      className={`w-full px-2 py-1.5 text-xs rounded border transition-colors ${
        disabled
          ? 'bg-secondary-50 border-transparent text-secondary-300 cursor-not-allowed'
          : 'border-transparent hover:border-primary-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 bg-transparent hover:bg-white'
      }`}
    />
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COL_DEFS: { key: FieldKey; label: string; type?: string; width?: string }[] = [
  { key: 'body_structure',  label: 'Body/Structure',  type: 'text',   width: '110px' },
  { key: 'sensory',         label: 'Sensory',         type: 'text',   width: '90px' },
  { key: 'taste',           label: 'Taste',           type: 'text',   width: '90px' },
  { key: 'temp_celsius',    label: 'Temp °C',         type: 'number', width: '75px' },
  { key: 'acidity_percent', label: 'Acidity %',       type: 'number', width: '80px' },
  { key: 'ph',              label: 'pH',              type: 'number', width: '65px' },
  { key: 'self_life',       label: 'Self Life',       type: 'text',   width: '90px' },
  { key: 'fdm',             label: 'FDM %',           type: 'number', width: '70px' },
  { key: 'fat_percent',     label: 'FAT %',           type: 'number', width: '70px' },
  { key: 'ts',              label: 'TS %',            type: 'number', width: '65px' },
  { key: 'lassi_viscosity', label: 'Lassi Viscosity', type: 'number', width: '110px' },
  { key: 'moisture',        label: 'Moisture %',      type: 'number', width: '90px' },
];

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function FinalBiProductReportPage() {
  const today = new Date().toISOString().split('T')[0];

  // Filter state (Records tab)
  const [filterDate, setFilterDate] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Current user & permissions
  const { user: currentUser } = useAuthStore();
  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'lab_incharge' || currentUser?.role === 'quality_incharge' || currentUser?.role === 'qc_manager';

  // Approval modal state
  const [approvalRecord, setApprovalRecord] = useState<BiProductReport | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [approvalComment, setApprovalComment] = useState('');
  const [approving, setApproving] = useState(false);

  // Entry form state
  const [formDate, setFormDate] = useState(today);
  const [chemistName, setChemistName] = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [rows, setRows] = useState<RowData[]>([emptyRow(today)]);
  const [saving, setSaving] = useState(false);

  // Modals
  const [viewRecord, setViewRecord] = useState<BiProductReport | null>(null);
  const [editRecord, setEditRecord] = useState<BiProductReport | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  const queryClient = useQueryClient();

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['biProductReports', filterDate, filterProduct, filterStatus],
    queryFn: () =>
      biProductService.getAll({
        ...(filterDate ? { date: filterDate } : {}),
        ...(filterProduct ? { product_name: filterProduct } : {}),
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
      }),
  });

  const filteredRecords: BiProductReport[] = records?.data ?? [];

  // ── Row helpers ────────────────────────────────────────────────────────────
  const addRow = () => setRows((p) => [...p, emptyRow(formDate)]);
  const removeRow = (id: string) => setRows((p) => p.filter((r) => r._id !== id));
  const updateRow = (id: string, field: keyof RowData, value: any) =>
    setRows((p) => p.map((r) => (r._id === id ? { ...r, [field]: value } : r)));

  // When product changes, clear inactive fields
  const changeProduct = (id: string, product: string) => {
    setRows((p) =>
      p.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, product_name: product === 'Other' ? (r._customProduct || '') : product };
        // Clear fields that become inactive
        COL_DEFS.forEach((col) => {
          if (!isFieldActive(product, col.key)) {
            (updated as any)[col.key] = null;
          }
        });
        return updated;
      })
    );
  };

  // ── Save all rows ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const valid = rows.filter((r) => r.batch_no.trim() !== '' && r.product_name.trim() !== '');
    if (valid.length === 0) {
      toast.error('Kripaya kam se kam ek row madhe Batch No. ani Product Name bhari');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        valid.map(({ _id, _customProduct, ...rowData }) =>
          biProductService.create({
            ...rowData,
            date: formDate,
            chemist_name: chemistName,
            quality_incharge_name: qualityInchargeName,
          })
        )
      );
      toast.success(`${valid.length} report${valid.length > 1 ? 's' : ''} saved successfully!`);
      setRows([emptyRow(formDate)]);
      setChemistName('');
      setQualityInchargeName('');
      queryClient.invalidateQueries({ queryKey: ['biProductReports'] });
      setActiveTab('records');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save karta aale nahi');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit helpers ───────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    try {
      const { id, created_at, updated_at, created_by, created_by_name, ...data } = editRecord as any;
      await biProductService.update(editRecord.id, data);
      toast.success('Report updated successfully');
      setEditRecord(null);
      queryClient.invalidateQueries({ queryKey: ['biProductReports'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────
  const openApprovalModal = (rec: BiProductReport, action: 'approved' | 'rejected') => {
    setApprovalRecord(rec);
    setApprovalAction(action);
    setApprovalComment('');
  };

  const handleApprove = async () => {
    if (!approvalRecord) return;
    setApproving(true);
    try {
      await biProductService.approve(approvalRecord.id, approvalAction, approvalComment || undefined);
      toast.success(`Report ${approvalAction === 'approved' ? 'approved ✅' : 'rejected ❌'} successfully`);
      setApprovalRecord(null);
      queryClient.invalidateQueries({ queryKey: ['biProductReports'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setApproving(false);
    }
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = [
      'Date', 'Batch No', 'Product', 'Body/Structure', 'Sensory', 'Taste',
      'Temp °C', 'Acidity %', 'pH', 'Self Life', 'FDM %', 'FAT %',
      'TS %', 'Lassi Viscosity', 'Moisture %', 'Chemist', 'Quality Incharge',
    ];
    const csvRows = filteredRecords.map((r) => [
      r.date, r.batch_no, r.product_name, r.body_structure ?? '',
      r.sensory ?? '', r.taste ?? '',
      r.temp_celsius ?? '', r.acidity_percent ?? '', r.ph ?? '',
      r.self_life ?? '', r.fdm ?? '', r.fat_percent ?? '',
      r.ts ?? '', r.lassi_viscosity ?? '', r.moisture ?? '',
      r.chemist_name ?? '', r.quality_incharge_name ?? '',
    ]);
    const csv = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi_product_report_${filterDate || 'all'}.csv`;
    a.click();
  };

  // ── Product badge color ────────────────────────────────────────────────────
  const productColor: Record<string, string> = {
    Dahi:   'bg-blue-100 text-blue-800',
    Lassi:  'bg-cyan-100 text-cyan-800',
    Paneer: 'bg-yellow-100 text-yellow-800',
    Peda:   'bg-pink-100 text-pink-800',
    Khoya:  'bg-amber-100 text-amber-800',
  };

  const getProductColor = (name: string) =>
    productColor[name] ?? 'bg-purple-100 text-purple-800';

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            Final Bi-Product Report
          </h1>
          <p className="text-text-secondary mt-1">
            Quality testing data for Dahi, Lassi, Paneer, Peda, Khoya & more
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export CSV
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
                ? 'bg-white dark:bg-secondary-700 shadow-sm text-violet-600 font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'entry' ? '+ New Entry' : 'View Records'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ENTRY TAB                                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'entry' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Date picker */}
          <Card>
            <div className="flex items-end gap-4">
              <div className="w-52">
                <Input
                  id="bp-form-date"
                  label="Date"
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    setRows((p) => p.map((r) => ({ ...r, date: e.target.value })));
                  }}
                />
              </div>
              <p className="pb-1 text-xs text-text-secondary">
                💡 Active fields depend on selected product type
              </p>
            </div>
          </Card>

          {/* Editable table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Product Testing Rows</h3>
              <Button size="sm" onClick={addRow} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-1" />Add Row
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1500 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                    <th className="py-2 px-3 text-left text-xs font-semibold text-violet-700 w-8">#</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 100 }}>Batch No. *</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 130 }}>Product *</th>
                    {COL_DEFS.map((col) => (
                      <th
                        key={col.key}
                        className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap"
                        style={{ minWidth: col.width }}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs font-semibold text-violet-700 w-10">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    // Determine the display product key for field-active lookup
                    const productKey = PRESET_PRODUCTS.includes(row.product_name) && row.product_name !== 'Other'
                      ? row.product_name
                      : 'Other';
                    // Which preset select value to show
                    const selectValue = PRESET_PRODUCTS.includes(row.product_name) ? row.product_name : 'Other';

                    return (
                      <motion.tr
                        key={row._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-secondary-100 hover:bg-violet-50/30 transition-colors"
                      >
                        <td className="py-1 px-3 text-xs text-text-secondary font-medium">{idx + 1}</td>

                        {/* Batch No */}
                        <td className="py-1 px-1">
                          <input
                            type="text"
                            value={row.batch_no}
                            onChange={(e) => updateRow(row._id, 'batch_no', e.target.value)}
                            placeholder="B-001"
                            className="w-full px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 bg-transparent hover:bg-white transition-colors"
                          />
                        </td>

                        {/* Product dropdown */}
                        <td className="py-1 px-1">
                          <div className="space-y-1">
                            <select
                              value={selectValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== 'Other') {
                                  updateRow(row._id, 'product_name', val);
                                } else {
                                  updateRow(row._id, 'product_name', row._customProduct || '');
                                }
                                changeProduct(row._id, val);
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-300 bg-transparent hover:bg-white transition-colors"
                            >
                              {PRESET_PRODUCTS.map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                            {selectValue === 'Other' && (
                              <input
                                type="text"
                                value={row._customProduct ?? ''}
                                onChange={(e) => {
                                  updateRow(row._id, '_customProduct', e.target.value);
                                  updateRow(row._id, 'product_name', e.target.value);
                                }}
                                placeholder="Custom product name"
                                className="w-full px-2 py-1 text-xs border border-violet-200 rounded focus:border-violet-400 focus:outline-none bg-white"
                              />
                            )}
                          </div>
                        </td>

                        {/* Conditional data columns */}
                        {COL_DEFS.map((col) => {
                          const active = isFieldActive(productKey, col.key);
                          return (
                            <td key={col.key} className="py-1 px-1">
                              <Cell
                                value={active ? (row as any)[col.key] : null}
                                onChange={(v) => active && updateRow(row._id, col.key as any, v)}
                                type={col.type}
                                placeholder={col.label}
                                disabled={!active}
                              />
                            </td>
                          );
                        })}

                        {/* Delete */}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Chemist / QI + Save */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="bp-chemist"
                  label="Chemist Name"
                  type="text"
                  value={chemistName}
                  onChange={(e) => setChemistName(e.target.value)}
                  placeholder="Enter chemist name"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="bp-quality"
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
                  onClick={() => { setRows([emptyRow(formDate)]); setChemistName(''); setQualityInchargeName(''); }}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700 min-w-[130px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : `Save${rows.filter(r => r.batch_no.trim()).length > 0 ? ` (${rows.filter(r => r.batch_no.trim()).length})` : ''} Reports`}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* RECORDS TAB                                                      */}
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
                  id="bp-filter-date"
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select
                  id="bp-filter-product"
                  label="Filter by Product"
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  options={[
                    { value: '', label: 'All Products' },
                    ...PRESET_PRODUCTS.filter(p => p !== 'Other').map(p => ({ value: p, label: p })),
                  ]}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <Select
                  id="bp-filter-status"
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
                <Button variant="outline" onClick={() => { setFilterDate(''); setFilterProduct(''); setFilterStatus('all'); }}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
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
                <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-text-secondary">Loading reports...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16">
                <Package2 className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-text-secondary">No reports found for selected filters</p>
                <Button className="mt-4 bg-violet-600 hover:bg-violet-700" size="sm" onClick={() => setActiveTab('entry')}>
                  <Plus className="w-4 h-4 mr-2" />Add New Report
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table" style={{ minWidth: 1400 }}>
                  <thead>
                    <tr className="bg-secondary-50 border-b border-secondary-200">
                      {[
                        'Date', 'Batch No.', 'Product', 'Body/Structure', 'Sensory',
                        'Taste', 'Temp °C', 'Acidity %', 'pH', 'Self Life',
                        'FDM %', 'FAT %', 'TS %', 'Lassi Viscosity', 'Moisture %',
                        'Chemist', 'Q. Incharge', 'Status', 'Actions'
                      ].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-text-secondary whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-secondary-100 hover:bg-violet-50/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-xs font-medium text-text-primary whitespace-nowrap">{formatDate(rec.date)}</td>
                        <td className="py-2.5 px-3 text-xs font-mono text-text-primary">{rec.batch_no}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getProductColor(rec.product_name)}`}>
                            {rec.product_name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.body_structure ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.sensory ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.taste ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.temp_celsius?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.acidity_percent?.toFixed(3) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.ph?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.self_life ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.fdm?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.fat_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.ts?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.lassi_viscosity?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.moisture?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.chemist_name ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.quality_incharge_name ?? '—'}</td>
                        {/* Status badge */}
                        <td className="py-2.5 px-3">
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
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setViewRecord(rec)}
                              className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-violet-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditRecord({ ...rec })}
                              className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-violet-600 transition-colors"
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

      {/* APPROVAL MODAL */}
      {approvalRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold flex items-center gap-2 ${
                  approvalAction === 'approved' ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {approvalAction === 'approved'
                    ? <><CheckCircle2 className="w-5 h-5" /> Approve Report</>
                    : <><XCircle className="w-5 h-5" /> Reject Report</>}
                </h2>
                <button onClick={() => setApprovalRecord(null)} className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary transition-colors">✕</button>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Product: <span className="font-semibold text-text-primary">{approvalRecord.product_name}</span> &nbsp;|
                Batch: <span className="font-mono font-semibold text-text-primary">{approvalRecord.batch_no}</span>
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

      {/* VIEW MODAL */}
      {viewRecord && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl max-h-[90vh] flex flex-col"
          >
            <Card className="p-0 overflow-hidden flex flex-col h-full">
              {/* ── Modal Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-gradient-to-r from-violet-50 to-purple-50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-violet-800 tracking-wide uppercase">
                    Final Bi-Product Report
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-violet-700 font-medium">
                    <span>Date: <strong>{formatDate(viewRecord.date)}</strong></span>
                    <span>|</span>
                    <span>Batch No: <strong>{viewRecord.batch_no}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="p-2 rounded-lg hover:bg-violet-100 text-violet-700 transition-colors text-lg font-bold"
                >✕</button>
              </div>

              {/* ── Paper-format Table ── */}
              <div className="overflow-x-auto overflow-y-auto flex-1 px-4 py-4">
                <table className="records-table w-full text-xs" style={{ minWidth: 1000 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>Sr. No.</th>
                      <th>Product Name</th>
                      <th>Body / Structure</th>
                      <th>Sensory</th>
                      <th>Taste</th>
                      <th>Temp (°C)</th>
                      <th>Acidity (%)</th>
                      <th>pH</th>
                      <th>Self Life</th>
                      <th>FDM (%)</th>
                      <th>FAT (%)</th>
                      <th>T.S. (%)</th>
                      <th>Lassi Viscosity</th>
                      <th>Moisture (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center font-semibold">1</td>
                      <td className="font-semibold">{viewRecord.product_name}</td>
                      <td>{viewRecord.body_structure ?? '—'}</td>
                      <td>{viewRecord.sensory ?? '—'}</td>
                      <td>{viewRecord.taste ?? '—'}</td>
                      <td>{viewRecord.temp_celsius?.toFixed(1) ?? '—'}</td>
                      <td>{viewRecord.acidity_percent?.toFixed(3) ?? '—'}</td>
                      <td>{viewRecord.ph?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.self_life ?? '—'}</td>
                      <td>{viewRecord.fdm?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.fat_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.ts?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.lassi_viscosity?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.moisture?.toFixed(2) ?? '—'}</td>
                    </tr>
                    {/* Empty rows to match paper format */}
                    {[...Array(3)].map((_, i) => (
                      <tr key={i} className="h-8">
                        <td className="text-center text-secondary-300">{i + 2}</td>
                        {[...Array(13)].map((__, j) => <td key={j}>&nbsp;</td>)}
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
      {/* EDIT MODAL                                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-text-primary">
                  Edit Report — {editRecord.product_name}
                </h2>
                <button onClick={() => setEditRecord(null)} className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                <Input id="e-batch" label="Batch No." type="text" value={editRecord.batch_no} onChange={(e) => setEditRecord({ ...editRecord, batch_no: e.target.value })} />
                <Input id="e-date" label="Date" type="date" value={editRecord.date} onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })} />
                <div className="md:col-span-2">
                  <Input id="e-product" label="Product Name" type="text" value={editRecord.product_name} onChange={(e) => setEditRecord({ ...editRecord, product_name: e.target.value })} />
                </div>
                <Input id="e-body" label="Body/Structure" type="text" value={editRecord.body_structure ?? ''} onChange={(e) => setEditRecord({ ...editRecord, body_structure: e.target.value })} />
                <Input id="e-sensory" label="Sensory" type="text" value={editRecord.sensory ?? ''} onChange={(e) => setEditRecord({ ...editRecord, sensory: e.target.value })} />
                <Input id="e-taste" label="Taste" type="text" value={editRecord.taste ?? ''} onChange={(e) => setEditRecord({ ...editRecord, taste: e.target.value })} />
                <Input id="e-temp" label="Temp (°C)" type="number" value={editRecord.temp_celsius ?? ''} onChange={(e) => setEditRecord({ ...editRecord, temp_celsius: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-acid" label="Acidity %" type="number" value={editRecord.acidity_percent ?? ''} onChange={(e) => setEditRecord({ ...editRecord, acidity_percent: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-ph" label="pH" type="number" value={editRecord.ph ?? ''} onChange={(e) => setEditRecord({ ...editRecord, ph: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-self" label="Self Life" type="text" value={editRecord.self_life ?? ''} onChange={(e) => setEditRecord({ ...editRecord, self_life: e.target.value })} />
                <Input id="e-fdm" label="FDM %" type="number" value={editRecord.fdm ?? ''} onChange={(e) => setEditRecord({ ...editRecord, fdm: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-fat" label="FAT %" type="number" value={editRecord.fat_percent ?? ''} onChange={(e) => setEditRecord({ ...editRecord, fat_percent: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-ts" label="TS %" type="number" value={editRecord.ts ?? ''} onChange={(e) => setEditRecord({ ...editRecord, ts: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-lassi" label="Lassi Viscosity" type="number" value={editRecord.lassi_viscosity ?? ''} onChange={(e) => setEditRecord({ ...editRecord, lassi_viscosity: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-moist" label="Moisture %" type="number" value={editRecord.moisture ?? ''} onChange={(e) => setEditRecord({ ...editRecord, moisture: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-chem" label="Chemist Name" type="text" value={editRecord.chemist_name ?? ''} onChange={(e) => setEditRecord({ ...editRecord, chemist_name: e.target.value })} />
                <Input id="e-qi" label="Quality Incharge" type="text" value={editRecord.quality_incharge_name ?? ''} onChange={(e) => setEditRecord({ ...editRecord, quality_incharge_name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-secondary-100">
                <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editSaving} className="bg-violet-600 hover:bg-violet-700">
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
