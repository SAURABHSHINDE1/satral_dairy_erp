import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Save, Trash2, Eye, Edit2, RefreshCw, Download, Milk
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { buttermilkAnalysisRecordService } from '../services/buttermilkAnalysisRecord.service';
import type { ButtermilkAnalysisRecord, ButtermilkAnalysisFormData } from '../types';
import { formatDate } from '../lib/utils';

// ─── Preset Options ────────────────────────────────────────────────────────────
const FLAVOUR_PRESETS = ['Plain', 'Salted', 'Masala', 'Jeera', '-'];
const TASTE_PRESETS = ['Good', 'Sour', 'Slightly Acidic', '-'];

// ─── Row type ──────────────────────────────────────────────────────────────────
type RowData = ButtermilkAnalysisFormData & {
  _id: string;
};

// ─── Safe UUID generator ──────────────────────────────────────────────────────
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

const newRow = (date: string, shift: string): RowData => ({
  _id: generateId(),
  date,
  shift,
  type_of_sample: '',
  testing_time: '',
  batch_no: '',
  packing_date: '',
  expiry_date: '',
  flavour: 'Plain',
  taste: 'Good',
  fat_percent: '',
  degree: '',
  acidity_percent: '',
  protein_percent: '',
  adulteration: '',
  remark: '',
  sign_name: '',
  chemist_name: '',
  quality_incharge_name: '',
});

// ─── Standard Text Cell ──────────────────────────────────────────────────────
function Cell({
  value, onChange, placeholder = '', width = '85px', showValidation,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; width?: string; showValidation: boolean;
}) {
  const isEmpty = value.trim() === '';
  const isErr = showValidation && isEmpty;

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width }}
      className={`px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 bg-transparent hover:bg-white dark:hover:bg-secondary-800 transition-colors w-full ${
        isErr
          ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/20'
          : 'border-transparent hover:border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300'
      }`}
    />
  );
}

// ─── Time Picker Cell with N/A support ───────────────────────────────────────
function TimeCell({
  value, onChange, showValidation, width = '105px'
}: {
  value: string; onChange: (v: string) => void; showValidation: boolean; width?: string;
}) {
  const isNA = value === '-';
  const isEmpty = value.trim() === '';
  const isErr = showValidation && isEmpty;

  return (
    <div className="flex items-center gap-1" style={{ minWidth: width }}>
      {isNA ? (
        <input
          type="text"
          readOnly
          value="-"
          className="px-2 py-1.5 text-xs border border-transparent rounded bg-secondary-100 dark:bg-secondary-800 text-center font-medium w-full cursor-not-allowed text-text-secondary"
        />
      ) : (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 bg-transparent hover:bg-white dark:hover:bg-secondary-800 transition-colors w-full ${
            isErr
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/20'
              : 'border-transparent hover:border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300'
          }`}
        />
      )}
      <button
        type="button"
        onClick={() => onChange(isNA ? '' : '-')}
        className={`px-1.5 py-1 text-[9px] font-bold rounded transition-colors uppercase flex-shrink-0 ${
          isNA 
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
            : 'bg-secondary-100 text-secondary-650 hover:bg-secondary-200'
        }`}
        title={isNA ? 'Pick Time' : 'Set N/A'}
      >
        {isNA ? 'Time' : 'N/A'}
      </button>
    </div>
  );
}

// ─── Date Picker Cell with N/A support ───────────────────────────────────────
function DateCell({
  value, onChange, showValidation, width = '130px'
}: {
  value: string; onChange: (v: string) => void; showValidation: boolean; width?: string;
}) {
  const isNA = value === '-';
  const isEmpty = value.trim() === '';
  const isErr = showValidation && isEmpty;

  return (
    <div className="flex items-center gap-1" style={{ minWidth: width }}>
      {isNA ? (
        <input
          type="text"
          readOnly
          value="-"
          className="px-2 py-1.5 text-xs border border-transparent rounded bg-secondary-100 dark:bg-secondary-800 text-center font-medium w-full cursor-not-allowed text-text-secondary"
        />
      ) : (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 bg-transparent hover:bg-white dark:hover:bg-secondary-800 transition-colors w-full ${
            isErr
              ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/20'
              : 'border-transparent hover:border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300'
          }`}
        />
      )}
      <button
        type="button"
        onClick={() => onChange(isNA ? '' : '-')}
        className={`px-1.5 py-1 text-[9px] font-bold rounded transition-colors uppercase flex-shrink-0 ${
          isNA 
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
            : 'bg-secondary-100 text-secondary-650 hover:bg-secondary-200'
        }`}
        title={isNA ? 'Pick Date' : 'Set N/A'}
      >
        {isNA ? 'Date' : 'N/A'}
      </button>
    </div>
  );
}

// ─── Dropdown Cell with Custom Value Input (ComboCell) ───────────────────────
function ComboCell({
  presets, value, onChange, placeholder = 'Custom...', width = '95px', showValidation,
}: {
  presets: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: string;
  showValidation: boolean;
}) {
  const isPreset = presets.includes(value);
  const [customVal, setCustomVal] = useState(isPreset ? '' : value);
  const selectedPreset = isPreset ? value : (value === '' ? '' : 'Other');

  const isEmpty = value.trim() === '';
  const isErr = showValidation && isEmpty;

  return (
    <div className="flex flex-col gap-0.5" style={{ minWidth: width }}>
      <select
        value={selectedPreset}
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'Other') {
            onChange(customVal);
          } else {
            onChange(val);
          }
        }}
        className={`px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 bg-transparent hover:bg-white dark:hover:bg-secondary-800 transition-colors w-full ${
          isErr
            ? 'border-red-400 focus:border-red-400 focus:ring-red-200 bg-red-50/20'
            : 'border-transparent hover:border-indigo-200 focus:border-indigo-400 focus:ring-indigo-300'
        }`}
      >
        <option value="">— Select —</option>
        {presets.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      {selectedPreset === 'Other' && (
        <input
          type="text"
          value={customVal}
          onChange={(e) => {
            setCustomVal(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className={`px-2 py-1 text-[10px] border rounded focus:outline-none bg-white dark:bg-secondary-800 w-full ${
            isErr ? 'border-red-400' : 'border-indigo-200 focus:border-indigo-400'
          }`}
        />
      )}
    </div>
  );
}

// ─── Column Config ─────────────────────────────────────────────────────────────
const COLS = [
  { key: 'type_of_sample',       label: 'Sample Type',      w: '115px', type: 'text'  },
  { key: 'testing_time',         label: 'Time',             w: '110px', type: 'time'  },
  { key: 'batch_no',             label: 'Batch No',         w: '90px',  type: 'text'  },
  { key: 'packing_date',         label: 'Pack Date',        w: '135px', type: 'date'  },
  { key: 'expiry_date',          label: 'Exp Date',         w: '135px', type: 'date'  },
  { key: 'flavour',              label: 'Flavour',          w: '95px',  type: 'combo', presets: FLAVOUR_PRESETS },
  { key: 'taste',                label: 'Taste',            w: '95px',  type: 'combo', presets: TASTE_PRESETS   },
  { key: 'fat_percent',          label: 'Fat %',            w: '75px',  type: 'text'  },
  { key: 'degree',               label: 'Degree',           w: '75px',  type: 'text'  },
  { key: 'acidity_percent',      label: 'Acidity %',        w: '80px',  type: 'text'  },
  { key: 'protein_percent',      label: 'Protein %',        w: '80px',  type: 'text'  },
  { key: 'adulteration',         label: 'Adulteration',     w: '105px', type: 'text'  },
  { key: 'remark',               label: 'Remark',           w: '120px', type: 'text'  },
  { key: 'sign_name',            label: 'Sign / Name',      w: '95px',  type: 'text'  },
] as const;

export default function ButtermilkAnalysisRecordPage() {
  const today = new Date().toISOString().split('T')[0];

  // ── Entry state ──────────────────────────────────────────────────────────────
  const [formDate, setFormDate] = useState(today);
  const [formShift, setFormShift] = useState('Morning');
  const [chemistName, setChemistName] = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [rows, setRows] = useState<RowData[]>([newRow(today, 'Morning')]);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────────────
  const [filterDate, setFilterDate] = useState('');

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [viewRecord, setViewRecord] = useState<ButtermilkAnalysisRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ButtermilkAnalysisRecord | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const queryClient = useQueryClient();

  // ── Fetch Records ────────────────────────────────────────────────────────────
  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['buttermilkAnalysisRecords', filterDate],
    queryFn: () =>
      buttermilkAnalysisRecordService.getAll({
        ...(filterDate ? { date: filterDate } : {}),
      }),
  });

  const filteredRecords: ButtermilkAnalysisRecord[] = records?.data ?? [];

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const headers = [
      'Date', 'Shift', 'Sample Type', 'Time', 'Batch No', 'Packing Date', 'Expiry Date',
      'Flavour', 'Taste', 'Fat %', 'Degree', 'Acidity %', 'Protein %', 'Adulteration',
      'Remark', 'Sign Name', 'Chemist', 'Quality Incharge'
    ];
    const csvRows = filteredRecords.map((r) => [
      r.date, r.shift, r.type_of_sample, r.testing_time, r.batch_no, r.packing_date, r.expiry_date,
      r.flavour, r.taste, r.fat_percent, r.degree, r.acidity_percent, r.protein_percent, r.adulteration,
      r.remark, r.sign_name, r.chemist_name, r.quality_incharge_name
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `buttermilk_analysis_${filterDate || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Row Actions ──────────────────────────────────────────────────────────────
  const addRow = () => {
    if (rows.length >= 10) {
      toast.warning('Maximum 10 rows per entry batch.');
      return;
    }
    setRows((p) => [...p, newRow(formDate, formShift)]);
  };

  const removeRow = (id: string) => setRows((p) => p.filter((r) => r._id !== id));

  const updateRow = (id: string, field: keyof RowData, value: any) =>
    setRows((p) => p.map((r) => (r._id === id ? { ...r, [field]: value } : r)));

  // ── Validation checks ────────────────────────────────────────────────────────
  const isRowValid = (r: RowData) => {
    return COLS.every((col) => r[col.key].trim() !== '');
  };

  const isFormValid =
    rows.every(isRowValid) &&
    chemistName.trim() !== '' &&
    qualityInchargeName.trim() !== '';

  // ── Save action ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      toast.error('Sagle fields mandatory ahet. Rikame fields bhara (nase tar "-" taka). ⚠️');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        rows.map(({ _id, ...rowData }) =>
          buttermilkAnalysisRecordService.create({
            ...rowData,
            date: formDate,
            shift: formShift,
            chemist_name: chemistName,
            quality_incharge_name: qualityInchargeName,
          })
        )
      );
      toast.success(`${rows.length} record(s) saved successfully! ✅`);
      setRows([newRow(formDate, formShift)]);
      setChemistName('');
      setQualityInchargeName('');
      setShowValidation(false);
      queryClient.invalidateQueries({ queryKey: ['buttermilkAnalysisRecords'] });
      setActiveTab('records');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save records.');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit modal save action ───────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editRecord) return;

    // Strict validation
    const hasEmptyField = Object.entries(editRecord).some(([key, val]) => {
      if (['id', 'created_by', 'created_by_name', 'created_at', 'updated_at'].includes(key)) return false;
      return typeof val === 'string' && val.trim() === '';
    });

    if (hasEmptyField) {
      toast.error('All fields are mandatory. Please enter "-" if not applicable.');
      return;
    }

    setEditSaving(true);
    try {
      const { id, created_at, updated_at, created_by, created_by_name, ...data } = editRecord as any;
      await buttermilkAnalysisRecordService.update(editRecord.id, data);
      toast.success('Record updated successfully! ✅');
      setEditRecord(null);
      queryClient.invalidateQueries({ queryKey: ['buttermilkAnalysisRecords'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
              <Milk className="w-5 h-5 text-white" />
            </div>
            Butter Milk Analysis Record
          </h1>
          <p className="text-text-secondary mt-1">
            Quality assurance records and laboratory testing data for Butter Milk batches.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          {activeTab === 'records' && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 w-fit">
        {(['entry', 'records'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-250 ${
              activeTab === tab
                ? 'bg-white dark:bg-secondary-700 shadow-sm text-indigo-600 font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'entry' ? '+ New Entry' : 'View Records'}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ENTRY TAB                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'entry' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Date & Shift Selector */}
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-52">
                <Input
                  id="bm-date"
                  label="Date"
                  type="date"
                  value={formDate}
                  onChange={(e) => {
                    setFormDate(e.target.value);
                    setRows((p) => p.map((r) => ({ ...r, date: e.target.value })));
                  }}
                />
              </div>
              <div className="w-52">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Shift <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formShift}
                  onChange={(e) => {
                    setFormShift(e.target.value);
                    setRows((p) => p.map((r) => ({ ...r, shift: e.target.value })));
                  }}
                  className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="Morning">Morning</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
              <p className="pb-1 text-xs text-text-secondary">
                💡 Ek date & shift la multiple rows add kara — each row = one butter milk testing entry.
              </p>
            </div>
          </Card>

          {/* Editable Grid Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">Butter Milk Testing Rows</h3>
                <p className="text-xs text-text-secondary mt-0.5">Max 10 rows per batch</p>
              </div>
              <Button
                size="sm"
                onClick={addRow}
                disabled={rows.length >= 10}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-soft"
              >
                <Plus className="w-4 h-4 mr-1" />Add Row
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1750 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-secondary-800/50 dark:to-secondary-800/30 border-b border-indigo-100 dark:border-secondary-700">
                    <th className="py-2 px-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 w-8">#</th>
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        className="py-2 px-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap"
                        style={{ minWidth: col.w }}
                      >
                        {col.label} *
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-400 w-10">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr
                      key={row._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className="border-b border-secondary-100 dark:border-secondary-700/50 hover:bg-indigo-50/10 transition-colors"
                    >
                      <td className="py-2 px-2 text-xs text-text-secondary font-medium">
                        {idx + 1}
                      </td>

                      {COLS.map((col) => (
                        <td key={col.key} className="py-1 px-1">
                          {col.type === 'time' ? (
                            <TimeCell
                              value={row.testing_time}
                              onChange={(v) => updateRow(row._id, 'testing_time', v)}
                              showValidation={showValidation}
                              width={col.w}
                            />
                          ) : col.type === 'date' ? (
                            <DateCell
                              value={row[col.key] as string}
                              onChange={(v) => updateRow(row._id, col.key, v)}
                              showValidation={showValidation}
                              width={col.w}
                            />
                          ) : col.type === 'combo' ? (
                            <ComboCell
                              presets={col.presets as any}
                              value={row[col.key] as string}
                              onChange={(v) => updateRow(row._id, col.key, v)}
                              placeholder={col.label}
                              showValidation={showValidation}
                              width={col.w}
                            />
                          ) : (
                            <Cell
                              value={row[col.key] as string}
                              onChange={(v) => updateRow(row._id, col.key, v)}
                              placeholder={col.label}
                              width={col.w}
                              showValidation={showValidation}
                            />
                          )}
                        </td>
                      ))}

                      <td className="py-1 px-2 text-center">
                        <button
                          onClick={() => removeRow(row._id)}
                          disabled={rows.length === 1}
                          className="p-1 rounded text-danger-500 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-secondary-800 disabled:opacity-30 transition-colors"
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

          {/* Footer Card */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Chemist Sign / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={chemistName}
                  onChange={(e) => setChemistName(e.target.value)}
                  placeholder="Enter chemist name"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white dark:bg-secondary-800 ${
                    showValidation && chemistName.trim() === ''
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/10'
                      : 'border-secondary-200 dark:border-secondary-700 focus:ring-indigo-300'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Quality Incharge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={qualityInchargeName}
                  onChange={(e) => setQualityInchargeName(e.target.value)}
                  placeholder="Enter quality incharge name"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white dark:bg-secondary-800 ${
                    showValidation && qualityInchargeName.trim() === ''
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/10'
                      : 'border-secondary-200 dark:border-secondary-700 focus:ring-indigo-300'
                  }`}
                />
              </div>

              <div className="flex gap-3 pb-0.5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRows([newRow(formDate, formShift)]);
                    setChemistName('');
                    setQualityInchargeName('');
                    setShowValidation(false);
                  }}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Records'}
                </Button>
              </div>
            </div>
            {showValidation && !isFormValid && (
              <p className="text-xs text-red-500 mt-2">
                * Please fill in all empty fields. Enter "-" if a field is not applicable.
              </p>
            )}
          </Card>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RECORDS TAB                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
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
              <div className="flex-1 min-w-[180px] max-w-[260px]">
                <Input
                  id="bm-filter-date"
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="pb-0.5">
                <Button variant="outline" onClick={() => setFilterDate('')}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Records Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
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
              <div className="p-10 text-center text-text-secondary">Loading records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-10 text-center text-text-secondary">
                <Milk className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-500" />
                <p>No records found. Apply a date filter or add new entries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table" style={{ minWidth: 1650 }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-secondary-800/50 dark:to-secondary-800/30 border-b border-indigo-100 dark:border-secondary-700">
                      <th className="py-3 px-3 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">Date</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">Shift</th>
                      {COLS.map((col) => (
                        <th key={col.key} className="py-3 px-3 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">Chemist</th>
                      <th className="py-3 px-3 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap">Quality Incharge</th>
                      <th className="py-3 px-3 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-400 whitespace-nowrap w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-secondary-100 dark:border-secondary-700/50 hover:bg-indigo-50/10 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-xs font-medium text-text-primary whitespace-nowrap">{formatDate(rec.date)}</td>
                        <td className="py-2.5 px-3 text-xs">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-secondary-800 dark:text-indigo-400 rounded-full text-xs font-medium whitespace-nowrap">
                            {rec.shift}
                          </span>
                        </td>
                        {COLS.map((col) => (
                          <td key={col.key} className="py-2.5 px-3 text-xs text-text-secondary whitespace-nowrap">
                            {(rec as any)[col.key]}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.chemist_name}</td>
                        <td className="py-2.5 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.quality_incharge_name}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => setViewRecord(rec)}
                              className="p-1.5 rounded text-primary-500 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-secondary-800 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditRecord({ ...rec })}
                              className="p-1.5 rounded text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-secondary-800 transition-colors"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* ── View Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewRecord && (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setViewRecord(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-0 overflow-hidden flex flex-col h-full">
                {/* ── Modal Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-indigo-800 tracking-wide uppercase">
                      Butter Milk Analysis Record
                    </h2>
                    <div className="flex items-center gap-4 mt-1 text-xs text-indigo-700 font-medium">
                      <span>Date: <strong>{formatDate(viewRecord.date)}</strong></span>
                      <span>|</span>
                      <span>Shift: <strong className="capitalize">{viewRecord.shift}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewRecord(null)}
                    className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors text-lg font-bold"
                  >✕</button>
                </div>

                {/* ── Paper-format Table ── */}
                <div className="overflow-x-auto overflow-y-auto flex-1 px-4 py-4">
                  <table className="records-table w-full text-xs" style={{ minWidth: 1000 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}>Sr. No.</th>
                        <th>Type of Sample</th>
                        <th>Testing Time</th>
                        <th>Batch No.</th>
                        <th>Packing Date</th>
                        <th>Expiry Date</th>
                        <th>Flavour</th>
                        <th>Taste</th>
                        <th>Fat (%)</th>
                        <th>Degree</th>
                        <th>Acidity (%)</th>
                        <th>Protein (%)</th>
                        <th>Adulteration</th>
                        <th>Remark</th>
                        <th>Sign / Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center font-semibold">1</td>
                        <td>{viewRecord.type_of_sample}</td>
                        <td>{viewRecord.testing_time}</td>
                        <td className="font-semibold">{viewRecord.batch_no}</td>
                        <td>{viewRecord.packing_date}</td>
                        <td>{viewRecord.expiry_date}</td>
                        <td>{viewRecord.flavour}</td>
                        <td>{viewRecord.taste}</td>
                        <td>{viewRecord.fat_percent}</td>
                        <td>{viewRecord.degree}</td>
                        <td>{viewRecord.acidity_percent}</td>
                        <td>{viewRecord.protein_percent}</td>
                        <td>{viewRecord.adulteration}</td>
                        <td>{viewRecord.remark}</td>
                        <td>{viewRecord.sign_name}</td>
                      </tr>
                      {/* Empty rows to match paper format */}
                      {[...Array(3)].map((_, i) => (
                        <tr key={i} className="h-8">
                          <td className="text-center text-secondary-300">{i + 2}</td>
                          {[...Array(14)].map((__, j) => <td key={j}>&nbsp;</td>)}
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
      </AnimatePresence>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editRecord && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditRecord(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-500" />
                  Edit Buttermilk Analysis Record
                </h2>
                <button onClick={() => setEditRecord(null)} className="text-text-secondary hover:text-text-primary text-xl font-bold">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                    <input
                      type="date"
                      value={editRecord.date.split('T')[0]}
                      onChange={(e) => setEditRecord({ ...editRecord, date: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Shift</label>
                    <select
                      value={editRecord.shift}
                      onChange={(e) => setEditRecord({ ...editRecord, shift: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                  {COLS.map((col) => (
                    <div key={col.key}>
                      <label className="block text-xs font-medium text-text-secondary mb-1">{col.label}</label>
                      {col.type === 'time' ? (
                        <div className="flex gap-1">
                          {editRecord.testing_time === '-' ? (
                            <input
                              type="text"
                              readOnly
                              value="-"
                              className="w-full px-3 py-2 border border-transparent rounded-lg bg-secondary-100 dark:bg-secondary-800 text-sm cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="time"
                              value={editRecord.testing_time}
                              onChange={(e) => setEditRecord({ ...editRecord, testing_time: e.target.value })}
                              className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setEditRecord({ ...editRecord, testing_time: editRecord.testing_time === '-' ? '' : '-' })}
                            className="px-3 py-2 border border-secondary-200 rounded-lg text-xs hover:bg-secondary-100 font-semibold"
                          >
                            {editRecord.testing_time === '-' ? 'Select' : 'N/A'}
                          </button>
                        </div>
                      ) : col.type === 'date' ? (
                        <div className="flex gap-1">
                          {(editRecord as any)[col.key] === '-' ? (
                            <input
                              type="text"
                              readOnly
                              value="-"
                              className="w-full px-3 py-2 border border-transparent rounded-lg bg-secondary-100 dark:bg-secondary-800 text-sm cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="date"
                              value={(editRecord as any)[col.key]}
                              onChange={(e) => setEditRecord({ ...editRecord, [col.key]: e.target.value })}
                              className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setEditRecord({ ...editRecord, [col.key]: (editRecord as any)[col.key] === '-' ? '' : '-' })}
                            className="px-3 py-2 border border-secondary-200 rounded-lg text-xs hover:bg-secondary-100 font-semibold"
                          >
                            {(editRecord as any)[col.key] === '-' ? 'Select' : 'N/A'}
                          </button>
                        </div>
                      ) : col.type === 'combo' ? (
                        <select
                          value={col.presets.includes((editRecord as any)[col.key]) ? (editRecord as any)[col.key] : 'Other'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setEditRecord({ ...editRecord, [col.key]: '' });
                            } else {
                              setEditRecord({ ...editRecord, [col.key]: val });
                            }
                          }}
                          className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          <option value="">— Select —</option>
                          {col.presets.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={(editRecord as any)[col.key] ?? ''}
                          onChange={(e) =>
                            setEditRecord({ ...editRecord, [col.key]: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      )}
                      {col.type === 'combo' && !col.presets.includes((editRecord as any)[col.key]) && (
                        <input
                          type="text"
                          value={(editRecord as any)[col.key]}
                          onChange={(e) => setEditRecord({ ...editRecord, [col.key]: e.target.value })}
                          placeholder={`Enter custom ${col.label}...`}
                          className="w-full mt-1.5 px-3 py-2 border border-indigo-200 rounded-lg text-xs bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      )}
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Chemist Name</label>
                    <input
                      type="text"
                      value={editRecord.chemist_name}
                      onChange={(e) => setEditRecord({ ...editRecord, chemist_name: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Quality Incharge Name</label>
                    <input
                      type="text"
                      value={editRecord.quality_incharge_name}
                      onChange={(e) => setEditRecord({ ...editRecord, quality_incharge_name: e.target.value })}
                      className="w-full px-3 py-2 border border-secondary-200 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                  <Button
                    onClick={handleEditSave}
                    disabled={editSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
