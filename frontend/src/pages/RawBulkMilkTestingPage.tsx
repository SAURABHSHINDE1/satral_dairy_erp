import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Save, Trash2, Eye, Edit2, RefreshCw, Download, Droplets,
  CheckCircle2, XCircle, ShieldCheck,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { rawBulkMilkService } from '../services/rawBulkMilk.service';
import type { RawBulkMilkRecord, RawBulkMilkFormData } from '../types';
import { formatDate, downloadReportAsExcel } from '../lib/utils';
import { useAuthStore } from '../store/auth.store';

// ─── Preset options ────────────────────────────────────────────────────────────
const SAMPLE_NAME_PRESETS = ['Silo-1', 'Silo-2', 'CT', 'BMC', 'Route', 'Local', 'Other'];
const MILK_TYPE_PRESETS   = ['Cow', 'Buffalo', 'Mixed', 'Skimmed', 'Other'];

// ─── Row type ─────────────────────────────────────────────────────────────────
type RowData = RawBulkMilkFormData & {
  _id: string;
  _samplePreset: string;
  _milkTypePreset: string;
};

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

const newRow = (date: string): RowData => ({
  _id:              generateId(),
  _samplePreset:    'Silo-1',
  _milkTypePreset:  'Cow',
  date,
  testing_time:     '',
  sample_name:      'Silo-1',
  type_of_milk:     'Cow',
  milk_quantity_lit: undefined,
  temp_celsius:      undefined,
  ot:                undefined,
  acidity_percent:   undefined,
  alcohol_result:    '',
  fat_percent:       undefined,
  clr:               undefined,
  snf:               undefined,
  protein_percent:   null,
  sodium_electrolyte_condition: null,
  ph:                undefined,
});

// ─── Inline cell ──────────────────────────────────────────────────────────────
function Cell({
  value, onChange, type = 'text', placeholder = '', width = '75px',
}: {
  value: any; onChange: (v: any) => void;
  type?: string; placeholder?: string; width?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      step={type === 'number' ? '0.001' : undefined}
      onChange={(e) => {
        const v = e.target.value;
        onChange(type === 'number' ? (v === '' ? null : parseFloat(v)) : v);
      }}
      placeholder={placeholder}
      style={{ width }}
      className="px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-transparent hover:bg-white transition-colors w-full"
    />
  );
}

// ─── Dropdown+custom combo ─────────────────────────────────────────────────────
function ComboCell({
  presets, presetValue, customValue, onPresetChange, onCustomChange,
}: {
  presets: string[];
  presetValue: string;
  customValue: string;
  onPresetChange: (v: string) => void;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div className="space-y-0.5 min-w-[110px]">
      <select
        value={presetValue}
        onChange={(e) => onPresetChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-transparent hover:bg-white transition-colors"
      >
        {presets.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {presetValue === 'Other' && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Custom value..."
          className="w-full px-2 py-1 text-xs border border-emerald-200 rounded focus:border-emerald-400 focus:outline-none bg-white"
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function RawBulkMilkTestingPage() {
  const today = new Date().toISOString().split('T')[0];

  // Entry state
  const [formDate, setFormDate] = useState(today);
  const [chemistName, setChemistName] = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [rows, setRows] = useState<RowData[]>([newRow(today)]);
  const [saving, setSaving] = useState(false);

  // Records filter state
  const [filterDate, setFilterDate] = useState('');
  const [filterSample, setFilterSample] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Current user & permissions
  const { user: currentUser } = useAuthStore();
  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'lab_incharge' || currentUser?.role === 'quality_incharge' || currentUser?.role === 'qc_manager';

  // Approval modal state
  const [approvalRecord, setApprovalRecord] = useState<RawBulkMilkRecord | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected'>('approved');
  const [approvalComment, setApprovalComment] = useState('');
  const [approving, setApproving] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  // Modals
  const [viewRecord, setViewRecord] = useState<RawBulkMilkRecord | null>(null);
  const [editRecord, setEditRecord] = useState<RawBulkMilkRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const queryClient = useQueryClient();

  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['rawBulkMilk', filterDate, filterSample, filterStatus],
    queryFn: () =>
      rawBulkMilkService.getAll({
        ...(filterDate ? { date: filterDate } : {}),
        ...(filterSample ? { sample_name: filterSample } : {}),
        ...(filterStatus !== 'all' ? { status: filterStatus } : {}),
      }),
  });

  const filteredRecords: RawBulkMilkRecord[] = records?.data ?? [];

  // ── Row helpers ──────────────────────────────────────────────────────────────
  const addRow = () => setRows((p) => [...p, newRow(formDate)]);
  const removeRow = (id: string) => setRows((p) => p.filter((r) => r._id !== id));
  const updateRow = (id: string, field: keyof RowData, value: any) =>
    setRows((p) => p.map((r) => (r._id === id ? { ...r, [field]: value } : r)));

  const handleSamplePreset = (id: string, preset: string) => {
    updateRow(id, '_samplePreset', preset);
    if (preset !== 'Other') updateRow(id, 'sample_name', preset);
    else updateRow(id, 'sample_name', '');
  };

  const handleMilkTypePreset = (id: string, preset: string) => {
    updateRow(id, '_milkTypePreset', preset);
    if (preset !== 'Other') updateRow(id, 'type_of_milk', preset);
    else updateRow(id, 'type_of_milk', '');
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const valid = rows.filter((r) => r.sample_name.trim() !== '' && r.type_of_milk.trim() !== '');
    if (valid.length === 0) {
      toast.error('Sample Name ani Type of Milk bhari — save hovu shaknar nahi');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        valid.map(({ _id, _samplePreset, _milkTypePreset, ...rowData }) =>
          rawBulkMilkService.create({
            ...rowData,
            date: formDate,
            testing_time: rowData.testing_time || undefined,
            chemist_name: chemistName || undefined,
            quality_incharge_name: qualityInchargeName || undefined,
          })
        )
      );
      toast.success(`${valid.length} record${valid.length > 1 ? 's' : ''} saved successfully!`);
      setRows([newRow(formDate)]);
      setChemistName('');
      setQualityInchargeName('');
      queryClient.invalidateQueries({ queryKey: ['rawBulkMilk'] });
      setActiveTab('records');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save karata aale nahi');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit save ─────────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    try {
      const { id, created_at, updated_at, created_by, created_by_name, ...data } = editRecord as any;
      await rawBulkMilkService.update(editRecord.id, data);
      toast.success('Record updated successfully');
      setEditRecord(null);
      queryClient.invalidateQueries({ queryKey: ['rawBulkMilk'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────
  const openApprovalModal = (rec: RawBulkMilkRecord, action: 'approved' | 'rejected') => {
    setApprovalRecord(rec);
    setApprovalAction(action);
    setApprovalComment('');
  };

  const handleApprove = async () => {
    if (!approvalRecord) return;
    setApproving(true);
    try {
      await rawBulkMilkService.approve(approvalRecord.id, approvalAction, approvalComment || undefined);
      toast.success(`Record ${approvalAction === 'approved' ? 'approved ✅' : 'rejected ❌'} successfully`);
      setApprovalRecord(null);
      queryClient.invalidateQueries({ queryKey: ['rawBulkMilk'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setApproving(false);
    }
  };

  // ── Excel Export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    downloadReportAsExcel({
      title: 'Raw Bulk Milk Testing Record',
      metadata: [
        { label: 'Export Date', value: formatDate(new Date()) },
        { label: 'Filters', value: `Date: ${filterDate || 'All'}` },
      ],
      headers: [
        'Sr. No.', 'Date', 'Testing Time', 'Sample Name', 'Type of Milk', 'Milk Qty (L)',
        'Temp (°C)', 'OT', 'Acidity (%)', 'Alcohol', 'FAT (%)',
        'CLR', 'SNF', 'Protein (%)', 'Sodium Electrolyte Condition', 'PH', 'Chemist', 'Quality Incharge'
      ],
      rows: filteredRecords.map((r, i) => [
        i + 1,
        formatDate(r.date),
        r.testing_time ?? '—',
        r.sample_name,
        r.type_of_milk,
        r.milk_quantity_lit ?? '—',
        r.temp_celsius ?? '—',
        r.ot ?? '—',
        r.acidity_percent ?? '—',
        r.alcohol_result ?? '—',
        r.fat_percent ?? '—',
        r.clr ?? '—',
        r.snf ?? '—',
        r.protein_percent ?? '—',
        r.sodium_electrolyte_condition ?? '—',
        r.ph ?? '—',
        r.chemist_name ?? '—',
        r.quality_incharge_name ?? '—'
      ]),
      signatures: {
        chemist: '',
        reviewer: '',
        reviewerTitle: 'Quality Incharge'
      }
    });
  };

  // ── Column definitions for the table ──────────────────────────────────────────
  const COLS = [
    { key: 'testing_time',                label: 'Time',           type: 'time',   w: '90px'  },
    { key: 'milk_quantity_lit',            label: 'Qty (Lit)',      type: 'number', w: '75px'  },
    { key: 'temp_celsius',                 label: 'Temp °C',        type: 'number', w: '72px'  },
    { key: 'ot',                           label: 'OT',             type: 'number', w: '60px'  },
    { key: 'acidity_percent',              label: 'Acidity %',      type: 'number', w: '72px'  },
    { key: 'alcohol_result',               label: 'Alcohol',        type: 'text',   w: '80px'  },
    { key: 'fat_percent',                  label: 'FAT %',          type: 'number', w: '65px'  },
    { key: 'clr',                          label: 'CLR',            type: 'number', w: '60px'  },
    { key: 'snf',                          label: 'SNF',            type: 'number', w: '60px'  },
    { key: 'protein_percent',              label: 'Protein %',      type: 'number', w: '72px'  },
    { key: 'sodium_electrolyte_condition', label: 'Na/Electrolyte', type: 'text',   w: '110px' },
    { key: 'ph',                           label: 'pH',             type: 'number', w: '60px'  },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            Raw Bulk Milk Testing Record
          </h1>
          <p className="text-text-secondary mt-1">
            Silo, CT, BMC, Route milk quality testing entries
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          {activeTab === 'records' && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />Export Excel
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 w-fit">
        {(['entry', 'records'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white dark:bg-secondary-700 shadow-sm text-emerald-600 font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'entry' ? '+ New Entry' : 'View Records'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ENTRY TAB                                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'entry' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          {/* Date row */}
          <Card>
            <div className="flex items-end gap-4">
              <div className="w-52">
                <Input
                  id="rbm-date"
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
                💡 Ek date la multiple rows add kara (Silo-1, CT, BMC etc.)
              </p>
            </div>
          </Card>

          {/* Editable table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">Testing Rows</h3>
              <Button size="sm" onClick={addRow} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-1" />Add Row
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1400 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
                    <th className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 w-8">#</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 whitespace-nowrap" style={{ minWidth: 120 }}>Sample Name *</th>
                    <th className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 whitespace-nowrap" style={{ minWidth: 110 }}>Type of Milk *</th>
                    {COLS.map((col) => (
                      <th key={col.key} className="py-2 px-2 text-left text-xs font-semibold text-emerald-700 whitespace-nowrap" style={{ minWidth: col.w }}>
                        {col.label}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center text-xs font-semibold text-emerald-700 w-10">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr
                      key={row._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className="border-b border-secondary-100 hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="py-1 px-2 text-xs text-text-secondary font-medium">{idx + 1}</td>

                      {/* Sample Name */}
                      <td className="py-1 px-1">
                        <ComboCell
                          presets={SAMPLE_NAME_PRESETS}
                          presetValue={row._samplePreset}
                          customValue={row.sample_name}
                          onPresetChange={(v) => handleSamplePreset(row._id, v)}
                          onCustomChange={(v) => updateRow(row._id, 'sample_name', v)}
                        />
                      </td>

                      {/* Type of Milk */}
                      <td className="py-1 px-1">
                        <ComboCell
                          presets={MILK_TYPE_PRESETS}
                          presetValue={row._milkTypePreset}
                          customValue={row.type_of_milk}
                          onPresetChange={(v) => handleMilkTypePreset(row._id, v)}
                          onCustomChange={(v) => updateRow(row._id, 'type_of_milk', v)}
                        />
                      </td>

                      {/* Data columns */}
                      {COLS.map((col) => (
                        <td key={col.key} className="py-1 px-1">
                          <Cell
                            type={col.type}
                            value={(row as any)[col.key]}
                            onChange={(v) => updateRow(row._id, col.key as any, v)}
                            placeholder={col.label}
                            width={col.w}
                          />
                        </td>
                      ))}

                      {/* Delete */}
                      <td className="py-1 px-2 text-center">
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

          {/* Footer — Chemist + QI + Save */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input id="rbm-chemist" label="Chemist Name" type="text" value={chemistName} onChange={(e) => setChemistName(e.target.value)} placeholder="Enter chemist name" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input id="rbm-qi" label="Quality Incharge Name" type="text" value={qualityInchargeName} onChange={(e) => setQualityInchargeName(e.target.value)} placeholder="Enter quality incharge name" />
              </div>
              <div className="flex gap-3 pb-0.5">
                <Button variant="outline" onClick={() => { setRows([newRow(formDate)]); setChemistName(''); setQualityInchargeName(''); }}>
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 min-w-[130px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : `Save${rows.filter(r => r.sample_name.trim()).length > 0 ? ` (${rows.filter(r => r.sample_name.trim()).length})` : ''} Records`}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* RECORDS TAB                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'records' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <Input id="rbm-filter-date" label="Filter by Date" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">Filter by Sample</label>
                <select
                  value={filterSample}
                  onChange={(e) => setFilterSample(e.target.value === 'All' ? '' : e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                >
                  <option value="">All Samples</option>
                  {SAMPLE_NAME_PRESETS.filter(s => s !== 'Other').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">🟡 Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
              <div className="pb-0.5">
                <Button variant="outline" onClick={() => { setFilterDate(''); setFilterSample(''); setFilterStatus('all'); }}>Clear</Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">
                Records
                {filteredRecords.length > 0 && (
                  <span className="ml-2 text-xs text-text-secondary font-normal">({filteredRecords.length} found)</span>
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
                <Droplets className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-text-secondary">No records found</p>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setActiveTab('entry')}>
                  <Plus className="w-4 h-4 mr-2" />Add New Entry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table" style={{ minWidth: 1500 }}>
                  <thead>
                    <tr className="bg-secondary-50 border-b border-secondary-200">
                      {['Date', 'Time', 'Sample', 'Milk Type', 'Qty (L)', 'Temp °C', 'OT', 'Acidity %', 'Alcohol', 'FAT %', 'CLR', 'SNF', 'Protein %', 'Na/Electrolyte', 'pH', 'Chemist', 'Q. Incharge', 'Status', 'Actions'].map(h => (
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
                        transition={{ delay: idx * 0.025 }}
                        className="border-b border-secondary-100 hover:bg-emerald-50/20 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-xs font-medium text-text-primary whitespace-nowrap">{formatDate(rec.date)}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.testing_time ?? '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{rec.sample_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.type_of_milk}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.milk_quantity_lit?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.temp_celsius?.toFixed(1) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.ot?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.acidity_percent?.toFixed(3) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.alcohol_result ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.fat_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.clr?.toFixed(3) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.snf?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.protein_percent?.toFixed(2) ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary">{rec.sodium_electrolyte_condition ?? '—'}</td>
                        <td className="py-2.5 px-3 text-xs text-text-primary">{rec.ph?.toFixed(2) ?? '—'}</td>
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
                            <button onClick={() => setViewRecord(rec)} className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-emerald-600 transition-colors" title="View">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditRecord({ ...rec })} className="p-1.5 rounded hover:bg-secondary-100 text-text-secondary hover:text-emerald-600 transition-colors" title="Edit">
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
                    ? <><CheckCircle2 className="w-5 h-5" /> Approve Record</>
                    : <><XCircle className="w-5 h-5" /> Reject Record</>}
                </h2>
                <button onClick={() => setApprovalRecord(null)} className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary transition-colors">✕</button>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Sample: <span className="font-semibold text-text-primary">{approvalRecord.sample_name}</span> &nbsp;|
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
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-emerald-800 tracking-wide uppercase">
                    Raw Bulk Milk Testing Record
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-emerald-700 font-medium">
                    <span>Date: <strong>{formatDate(viewRecord.date)}</strong></span>
                  </div>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors text-lg font-bold"
                >✕</button>
              </div>

              {/* ── Paper-format Table ── */}
              <div className="overflow-x-auto overflow-y-auto flex-1 px-4 py-4">
                <table className="records-table w-full text-xs" style={{ minWidth: 1000 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>Sr. No.</th>
                      <th>Testing Time</th>
                      <th>Sample Name</th>
                      <th>Type of Milk</th>
                      <th>Milk Qty (L)</th>
                      <th>Temp (°C)</th>
                      <th>OT</th>
                      <th>Acidity (%)</th>
                      <th>Alcohol</th>
                      <th>FAT (%)</th>
                      <th>CLR</th>
                      <th>SNF</th>
                      <th>Protein (%)</th>
                      <th>Sodium Electrolyte Condition</th>
                      <th>PH</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center font-semibold">1</td>
                      <td>{viewRecord.testing_time ?? '—'}</td>
                      <td className="font-semibold">{viewRecord.sample_name}</td>
                      <td>{viewRecord.type_of_milk}</td>
                      <td>{viewRecord.milk_quantity_lit?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.temp_celsius?.toFixed(1) ?? '—'}</td>
                      <td>{viewRecord.ot?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.acidity_percent?.toFixed(3) ?? '—'}</td>
                      <td>{viewRecord.alcohol_result ?? '—'}</td>
                      <td>{viewRecord.fat_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.clr?.toFixed(3) ?? '—'}</td>
                      <td>{viewRecord.snf?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.protein_percent?.toFixed(2) ?? '—'}</td>
                      <td>{viewRecord.sodium_electrolyte_condition ?? '—'}</td>
                      <td>{viewRecord.ph?.toFixed(2) ?? '—'}</td>
                    </tr>
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
              <div className="flex justify-end gap-3 px-6 py-3 border-t border-secondary-100 bg-secondary-50 flex-shrink-0">
                <Button
                  onClick={() => {
                    downloadReportAsExcel({
                      title: 'Raw Bulk Milk Testing Record',
                      metadata: [
                        { label: 'Date', value: formatDate(viewRecord.date) }
                      ],
                      headers: [
                        'Sr. No.', 'Testing Time', 'Sample Name', 'Type of Milk', 'Milk Qty (L)',
                        'Temp (°C)', 'OT', 'Acidity (%)', 'Alcohol', 'FAT (%)',
                        'CLR', 'SNF', 'Protein (%)', 'Sodium Electrolyte Condition', 'PH'
                      ],
                      rows: [[
                        1,
                        viewRecord.testing_time ?? '—',
                        viewRecord.sample_name,
                        viewRecord.type_of_milk,
                        viewRecord.milk_quantity_lit ?? '—',
                        viewRecord.temp_celsius ?? '—',
                        viewRecord.ot ?? '—',
                        viewRecord.acidity_percent ?? '—',
                        viewRecord.alcohol_result ?? '—',
                        viewRecord.fat_percent ?? '—',
                        viewRecord.clr ?? '—',
                        viewRecord.snf ?? '—',
                        viewRecord.protein_percent ?? '—',
                        viewRecord.sodium_electrolyte_condition ?? '—',
                        viewRecord.ph ?? '—'
                      ]],
                      signatures: {
                        chemist: viewRecord.chemist_name,
                        reviewer: viewRecord.quality_incharge_name,
                        reviewerTitle: 'Quality Incharge'
                      }
                    });
                  }}
                  className="bg-emerald-650 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
                >
                  Download Excel
                </Button>
                <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* EDIT MODAL                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-text-primary">Edit Record — {editRecord.sample_name}</h2>
                <button onClick={() => setEditRecord(null)} className="p-2 rounded-lg hover:bg-secondary-100 text-text-secondary">✕</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[62vh] overflow-y-auto pr-1">
                <Input id="e-date"     label="Date"            type="date"   value={editRecord.date}                onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })} />
                <Input id="e-time"     label="Testing Time"    type="time"   value={editRecord.testing_time ?? ''}  onChange={(e) => setEditRecord({ ...editRecord, testing_time: e.target.value })} />
                <Input id="e-sample"   label="Sample Name"     type="text"   value={editRecord.sample_name}         onChange={(e) => setEditRecord({ ...editRecord, sample_name: e.target.value })} />
                <Input id="e-milktype" label="Type of Milk"    type="text"   value={editRecord.type_of_milk}        onChange={(e) => setEditRecord({ ...editRecord, type_of_milk: e.target.value })} />
                <Input id="e-qty"      label="Qty (Lit)"       type="number" value={editRecord.milk_quantity_lit ?? ''} onChange={(e) => setEditRecord({ ...editRecord, milk_quantity_lit: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-temp"     label="Temp (°C)"       type="number" value={editRecord.temp_celsius ?? ''}  onChange={(e) => setEditRecord({ ...editRecord, temp_celsius: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-ot"       label="OT"              type="number" value={editRecord.ot ?? ''}             onChange={(e) => setEditRecord({ ...editRecord, ot: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-acid"     label="Acidity %"       type="number" value={editRecord.acidity_percent ?? ''} onChange={(e) => setEditRecord({ ...editRecord, acidity_percent: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-alc"      label="Alcohol Result"  type="text"   value={editRecord.alcohol_result ?? ''} onChange={(e) => setEditRecord({ ...editRecord, alcohol_result: e.target.value })} />
                <Input id="e-fat"      label="FAT %"           type="number" value={editRecord.fat_percent ?? ''}    onChange={(e) => setEditRecord({ ...editRecord, fat_percent: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-clr"      label="CLR"             type="number" value={editRecord.clr ?? ''}            onChange={(e) => setEditRecord({ ...editRecord, clr: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-snf"      label="SNF"             type="number" value={editRecord.snf ?? ''}            onChange={(e) => setEditRecord({ ...editRecord, snf: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-prot"     label="Protein %"       type="number" value={editRecord.protein_percent ?? ''} onChange={(e) => setEditRecord({ ...editRecord, protein_percent: e.target.value === '' ? null : parseFloat(e.target.value) })} />
                <Input id="e-na"       label="Na/Electrolyte"  type="text"   value={editRecord.sodium_electrolyte_condition ?? ''} onChange={(e) => setEditRecord({ ...editRecord, sodium_electrolyte_condition: e.target.value })} />
                <Input id="e-ph"       label="pH"              type="number" value={editRecord.ph ?? ''}             onChange={(e) => setEditRecord({ ...editRecord, ph: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
                <Input id="e-chem"     label="Chemist Name"    type="text"   value={editRecord.chemist_name ?? ''}   onChange={(e) => setEditRecord({ ...editRecord, chemist_name: e.target.value })} />
                <Input id="e-qi"       label="Quality Incharge" type="text"  value={editRecord.quality_incharge_name ?? ''} onChange={(e) => setEditRecord({ ...editRecord, quality_incharge_name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-secondary-100">
                <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editSaving} className="bg-emerald-600 hover:bg-emerald-700">
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
