import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Save, Trash2, Eye, Edit2, RefreshCw, Download, Package,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { packingMilkReportService } from '../services/packingMilkReport.service';
import type { PackingMilkReport, PackingMilkFormData } from '../types';
import { formatDate, downloadReportAsExcel } from '../lib/utils';

// ─── Preset options ────────────────────────────────────────────────────────────
const PRODUCT_NAME_PRESETS = [
  'Gold-500ml', 'Gold-1L', 'Green-200ml', 'Green-500ml', 'Green-1L',
  'Slim-500ml', 'Slim-1L', 'Toned-500ml', 'Toned-1L', 'Full Cream-500ml',
  'Full Cream-1L', 'Standardised-500ml', 'Standardised-1L', 'Other',
];

const PACKING_HEAD_PRESETS = [
  'Head-1', 'Head-2', 'Head-3', 'Head-4',
  'Machine-A', 'Machine-B', 'Machine-C', 'Other',
];

const ALCOHOL_OPTS = ['Positive', 'Negative', 'N/A'];
const PHOSPHATASE_OPTS = ['Positive', 'Negative', 'N/A'];

// ─── Row type ──────────────────────────────────────────────────────────────────
type RowData = PackingMilkFormData & {
  _id: string;
  _productPreset: string;
  _packingHeadPreset: string;
};

// ─── Safe UUID generator (works on HTTP / non-secure origins) ─────────────────
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
  _id:                generateId(),
  _productPreset:     'Gold-500ml',
  _packingHeadPreset: 'Head-1',
  date,
  testing_time:       '',
  tank_no:            '',
  batch_no:           '',
  packing_head:       'Head-1',
  product_name:       'Gold-500ml',
  temp_celsius:       undefined,
  acidity_percent:    undefined,
  alcohol_result:     '',
  fat_percent:        undefined,
  clr:                undefined,
  snf_percent:        undefined,
  phosphatase_test:   '',
  br:                 null,
  ph:                 null,
  ts:                 undefined,
  protein_percent:    undefined,
  remark:             '',
});

// ─── Plain numeric / text inline cell ─────────────────────────────────────────
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
      className="px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 bg-transparent hover:bg-white transition-colors w-full"
    />
  );
}

// ─── Simple select inline cell ─────────────────────────────────────────────────
function SelectCell({
  value, onChange, options, width = '90px',
}: {
  value: string; onChange: (v: string) => void;
  options: string[]; width?: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      style={{ width }}
      className="px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 bg-transparent hover:bg-white transition-colors w-full"
    >
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ─── Dropdown + optional custom text (ComboCell) ──────────────────────────────
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
    <div className="space-y-0.5 min-w-[120px]">
      <select
        value={presetValue}
        onChange={(e) => onPresetChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-transparent rounded hover:border-primary-200 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 bg-transparent hover:bg-white transition-colors"
      >
        {presets.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {presetValue === 'Other' && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="Custom value..."
          className="w-full px-2 py-1 text-xs border border-violet-200 rounded focus:border-violet-400 focus:outline-none bg-white"
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PackingMilkReportPage() {
  const today = new Date().toISOString().split('T')[0];

  // ── Entry state ──────────────────────────────────────────────────────────────
  const [formDate, setFormDate] = useState(today);
  const [chemistName, setChemistName] = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [rows, setRows] = useState<RowData[]>([newRow(today)]);
  const [saving, setSaving] = useState(false);

  // ── Filter state (Records tab) ────────────────────────────────────────────────
  const [filterDate, setFilterDate] = useState('');
  const [filterProduct, setFilterProduct] = useState('');

  // ── Tab ───────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  // ── View/Edit modals ──────────────────────────────────────────────────────────
  const [viewRecord, setViewRecord] = useState<PackingMilkReport | null>(null);
  const [editRecord, setEditRecord] = useState<PackingMilkReport | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const queryClient = useQueryClient();

  // ── Fetch records ─────────────────────────────────────────────────────────────
  const { data: records, isLoading, refetch } = useQuery({
    queryKey: ['packingMilkReports', filterDate, filterProduct],
    queryFn: () =>
      packingMilkReportService.getAll({
        ...(filterDate ? { date: filterDate } : {}),
        ...(filterProduct ? { product_name: filterProduct } : {}),
      }),
  });

  const filteredRecords: PackingMilkReport[] = records?.data ?? [];

  // ── Row helpers ───────────────────────────────────────────────────────────────
  const addRow = () => {
    if (rows.length >= 20) {
      toast.warning('Maximum 20 rows per entry batch.');
      return;
    }
    setRows((p) => [...p, newRow(formDate)]);
  };
  const removeRow = (id: string) => setRows((p) => p.filter((r) => r._id !== id));
  const updateRow = (id: string, field: keyof RowData, value: any) =>
    setRows((p) => p.map((r) => (r._id === id ? { ...r, [field]: value } : r)));

  const handleProductPreset = (id: string, preset: string) => {
    updateRow(id, '_productPreset', preset);
    if (preset !== 'Other') updateRow(id, 'product_name', preset);
    else updateRow(id, 'product_name', '');
  };

  const handlePackingHeadPreset = (id: string, preset: string) => {
    updateRow(id, '_packingHeadPreset', preset);
    if (preset !== 'Other') updateRow(id, 'packing_head', preset);
    else updateRow(id, 'packing_head', '');
  };

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const valid = rows.filter(
      (r) =>
        r.tank_no.trim() !== '' &&
        r.batch_no.trim() !== '' &&
        r.product_name.trim() !== '' &&
        r.packing_head.trim() !== ''
    );
    if (valid.length === 0) {
      toast.error('Tank No, Batch No, Product Name ani Packing Head bhari — save hovu shaknar nahi');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        valid.map(({ _id, _productPreset, _packingHeadPreset, ...rowData }) =>
          packingMilkReportService.create({
            ...rowData,
            date: formDate,
            testing_time: rowData.testing_time || undefined,
            chemist_name: chemistName || undefined,
            quality_incharge_name: qualityInchargeName || undefined,
          })
        )
      );
      toast.success(`${valid.length} record${valid.length > 1 ? 's' : ''} saved successfully! ✅`);
      setRows([newRow(formDate)]);
      setChemistName('');
      setQualityInchargeName('');
      queryClient.invalidateQueries({ queryKey: ['packingMilkReports'] });
      setActiveTab('records');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save karata aale nahi');
    } finally {
      setSaving(false);
    }
  };

  // ── Excel Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    downloadReportAsExcel({
      title: 'Packing Milk Report',
      metadata: [
        { label: 'Export Date', value: formatDate(new Date()) },
        { label: 'Filters', value: `Date: ${filterDate || 'All'}` },
      ],
      headers: [
        'Sr. No.', 'Date', 'Testing Time', 'Tank No.', 'Batch No.', 'Packing Head',
        'Product Name', 'Temp (°C)', 'Acidity (%)', 'Alcohol', 'FAT (%)',
        'CLR', 'SNF (%)', 'Phosphatase Test', 'BR', 'pH', 'T.S. (%)',
        'Protein (%)', 'Remark', 'Chemist', 'Quality Incharge'
      ],
      rows: filteredRecords.map((r, i) => [
        i + 1,
        formatDate(r.date),
        r.testing_time ?? '—',
        r.tank_no,
        r.batch_no,
        r.packing_head,
        r.product_name,
        r.temp_celsius ?? '—',
        r.acidity_percent ?? '—',
        r.alcohol_result ?? '—',
        r.fat_percent ?? '—',
        r.clr ?? '—',
        r.snf_percent ?? '—',
        r.phosphatase_test ?? '—',
        r.br ?? '—',
        r.ph ?? '—',
        r.ts ?? '—',
        r.protein_percent ?? '—',
        r.remark ?? '—',
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

  // ── Edit save ─────────────────────────────────────────────────────────────────
  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    try {
      const { id, created_at, updated_at, created_by, created_by_name, ...data } = editRecord as any;
      await packingMilkReportService.update(editRecord.id, data);
      toast.success('Record updated successfully ✅');
      setEditRecord(null);
      queryClient.invalidateQueries({ queryKey: ['packingMilkReports'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Column definitions ────────────────────────────────────────────────────────
  const COLS = [
    { key: 'testing_time',    label: 'Time',         type: 'time',   w: '90px'  },
    { key: 'tank_no',         label: 'Tank No *',    type: 'text',   w: '80px'  },
    { key: 'batch_no',        label: 'Batch No *',   type: 'text',   w: '90px'  },
    { key: 'temp_celsius',    label: 'Temp °C',      type: 'number', w: '72px'  },
    { key: 'acidity_percent', label: 'Acidity %',    type: 'number', w: '75px'  },
    { key: 'fat_percent',     label: 'FAT %',        type: 'number', w: '65px'  },
    { key: 'clr',             label: 'CLR',          type: 'number', w: '60px'  },
    { key: 'snf_percent',     label: 'SNF %',        type: 'number', w: '65px'  },
    { key: 'br',              label: 'BR',           type: 'number', w: '60px'  },
    { key: 'ph',              label: 'pH',           type: 'number', w: '55px'  },
    { key: 'ts',              label: 'TS',           type: 'number', w: '60px'  },
    { key: 'protein_percent', label: 'Protein %',    type: 'number', w: '72px'  },
    { key: 'remark',          label: 'Remark',       type: 'text',   w: '110px' },
  ] as const;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            Packing Milk Report
          </h1>
          <p className="text-text-secondary mt-1">
            Packed milk quality testing records — product wise, batch wise
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

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ENTRY TAB                                                            */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'entry' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          {/* Date selector */}
          <Card>
            <div className="flex items-end gap-4">
              <div className="w-52">
                <Input
                  id="pmr-date"
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
                💡 Ek date la multiple rows add kara — each row = one packing run
              </p>
            </div>
          </Card>

          {/* Editable table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">Packing Testing Rows</h3>
                <p className="text-xs text-text-secondary mt-0.5">Max 20 rows per save</p>
              </div>
              <Button
                size="sm"
                onClick={addRow}
                disabled={rows.length >= 20}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-1" />Add Row
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 1700 }}>
                <thead>
                  <tr className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 w-8">#</th>
                    {/* Product Name (combo) */}
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 130 }}>
                      Product Name *
                    </th>
                    {/* Packing Head (combo) */}
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 110 }}>
                      Packing Head *
                    </th>
                    {/* Alcohol */}
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 90 }}>
                      Alcohol
                    </th>
                    {/* Phosphatase */}
                    <th className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: 100 }}>
                      Phosphatase
                    </th>
                    {/* Other data columns */}
                    {COLS.map((col) => (
                      <th key={col.key} className="py-2 px-2 text-left text-xs font-semibold text-violet-700 whitespace-nowrap" style={{ minWidth: col.w }}>
                        {col.label}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center text-xs font-semibold text-violet-700 w-10">Del</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr
                      key={row._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className="border-b border-secondary-100 hover:bg-violet-50/30 transition-colors"
                    >
                      <td className="py-1 px-2 text-xs text-text-secondary font-medium">{idx + 1}</td>

                      {/* Product Name */}
                      <td className="py-1 px-1">
                        <ComboCell
                          presets={PRODUCT_NAME_PRESETS}
                          presetValue={row._productPreset}
                          customValue={row.product_name}
                          onPresetChange={(v) => handleProductPreset(row._id, v)}
                          onCustomChange={(v) => updateRow(row._id, 'product_name', v)}
                        />
                      </td>

                      {/* Packing Head */}
                      <td className="py-1 px-1">
                        <ComboCell
                          presets={PACKING_HEAD_PRESETS}
                          presetValue={row._packingHeadPreset}
                          customValue={row.packing_head}
                          onPresetChange={(v) => handlePackingHeadPreset(row._id, v)}
                          onCustomChange={(v) => updateRow(row._id, 'packing_head', v)}
                        />
                      </td>

                      {/* Alcohol result */}
                      <td className="py-1 px-1">
                        <SelectCell
                          value={row.alcohol_result ?? ''}
                          onChange={(v) => updateRow(row._id, 'alcohol_result', v)}
                          options={ALCOHOL_OPTS}
                          width="90px"
                        />
                      </td>

                      {/* Phosphatase test */}
                      <td className="py-1 px-1">
                        <SelectCell
                          value={row.phosphatase_test ?? ''}
                          onChange={(v) => updateRow(row._id, 'phosphatase_test', v)}
                          options={PHOSPHATASE_OPTS}
                          width="100px"
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
                <Input
                  id="pmr-chemist"
                  label="Chemist Name"
                  type="text"
                  value={chemistName}
                  onChange={(e) => setChemistName(e.target.value)}
                  placeholder="Enter chemist name"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="pmr-qi"
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
                  onClick={() => {
                    setRows([newRow(formDate)]);
                    setChemistName('');
                    setQualityInchargeName('');
                  }}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700 min-w-[140px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving
                    ? 'Saving...'
                    : `Save${rows.filter((r) => r.tank_no.trim() && r.product_name.trim()).length > 0
                      ? ` (${rows.filter((r) => r.tank_no.trim() && r.product_name.trim()).length})`
                      : ''} Records`}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* RECORDS TAB                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'records' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
          {/* Filters */}
          <Card>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <Input
                  id="pmr-filter-date"
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-text-secondary mb-1">Filter by Product</label>
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value === 'All Products' ? '' : e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                >
                  <option value="">All Products</option>
                  {PRODUCT_NAME_PRESETS.filter((p) => p !== 'Other').map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="pb-0.5">
                <Button
                  variant="outline"
                  onClick={() => { setFilterDate(''); setFilterProduct(''); }}
                >
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
              <div className="p-10 text-center text-text-secondary">Loading records...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-10 text-center text-text-secondary">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No records found. Apply a date filter or add new entries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table" style={{ minWidth: 1400 }}>
                  <thead>
                    <tr className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                      {[
                        'Date', 'Time', 'Tank', 'Batch', 'Head', 'Product',
                        'Temp', 'Acidity', 'Alcohol', 'FAT%', 'CLR', 'SNF%',
                        'Phosphatase', 'BR', 'pH', 'TS', 'Protein%', 'Remark',
                        'Chemist', 'QI', 'Actions',
                      ].map((h) => (
                        <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-violet-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-secondary-100 hover:bg-violet-50/20 transition-colors"
                      >
                        <td className="py-2 px-3 text-xs font-medium text-text-primary whitespace-nowrap">{formatDate(rec.date)}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.testing_time ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-primary font-medium">{rec.tank_no}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.batch_no}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.packing_head}</td>
                        <td className="py-2 px-3 text-xs">
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium whitespace-nowrap">
                            {rec.product_name}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.temp_celsius ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.acidity_percent ?? '—'}</td>
                        <td className="py-2 px-3 text-xs">
                          {rec.alcohol_result ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              rec.alcohol_result === 'Negative'
                                ? 'bg-green-100 text-green-700'
                                : rec.alcohol_result === 'Positive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rec.alcohol_result}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.fat_percent ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.clr ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.snf_percent ?? '—'}</td>
                        <td className="py-2 px-3 text-xs">
                          {rec.phosphatase_test ? (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              rec.phosphatase_test === 'Negative'
                                ? 'bg-green-100 text-green-700'
                                : rec.phosphatase_test === 'Positive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {rec.phosphatase_test}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.br ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.ph ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.ts ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary">{rec.protein_percent ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary max-w-[120px] truncate" title={rec.remark}>{rec.remark ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.chemist_name ?? '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-secondary whitespace-nowrap">{rec.quality_incharge_name ?? '—'}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setViewRecord(rec)}
                              className="p-1.5 rounded text-primary-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditRecord({ ...rec })}
                              className="p-1.5 rounded text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Edit"
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
                    Packing Milk Report
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-xs text-violet-700 font-medium">
                    <span>Date: <strong>{formatDate(viewRecord.date)}</strong></span>
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
                      <th>Testing Time</th>
                      <th>Tank No.</th>
                      <th>Batch No.</th>
                      <th>Packing Head</th>
                      <th>Product Name</th>
                      <th>Temp (°C)</th>
                      <th>Acidity (%)</th>
                      <th>Alcohol</th>
                      <th>FAT (%)</th>
                      <th>CLR</th>
                      <th>SNF (%)</th>
                      <th>Phosphatase Test</th>
                      <th>BR</th>
                      <th>pH</th>
                      <th>T.S. (%)</th>
                      <th>Protein (%)</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-center font-semibold">1</td>
                      <td>{viewRecord.testing_time ?? '—'}</td>
                      <td className="font-semibold">{viewRecord.tank_no}</td>
                      <td>{viewRecord.batch_no}</td>
                      <td>{viewRecord.packing_head}</td>
                      <td className="font-semibold">{viewRecord.product_name}</td>
                      <td>{viewRecord.temp_celsius ?? '—'}</td>
                      <td>{viewRecord.acidity_percent ?? '—'}</td>
                      <td>{viewRecord.alcohol_result ?? '—'}</td>
                      <td>{viewRecord.fat_percent ?? '—'}</td>
                      <td>{viewRecord.clr ?? '—'}</td>
                      <td>{viewRecord.snf_percent ?? '—'}</td>
                      <td>{viewRecord.phosphatase_test ?? '—'}</td>
                      <td>{viewRecord.br ?? '—'}</td>
                      <td>{viewRecord.ph ?? '—'}</td>
                      <td>{viewRecord.ts ?? '—'}</td>
                      <td>{viewRecord.protein_percent ?? '—'}</td>
                      <td>{viewRecord.remark ?? '—'}</td>
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
                      title: 'Packing Milk Report',
                      metadata: [
                        { label: 'Date', value: formatDate(viewRecord.date) }
                      ],
                      headers: [
                        'Sr. No.', 'Testing Time', 'Tank No.', 'Batch No.', 'Packing Head',
                        'Product Name', 'Temp (°C)', 'Acidity (%)', 'Alcohol', 'FAT (%)',
                        'CLR', 'SNF (%)', 'Phosphatase Test', 'BR', 'pH', 'T.S. (%)',
                        'Protein (%)', 'Remark'
                      ],
                      rows: [[
                        1,
                        viewRecord.testing_time ?? '—',
                        viewRecord.tank_no,
                        viewRecord.batch_no,
                        viewRecord.packing_head,
                        viewRecord.product_name,
                        viewRecord.temp_celsius ?? '—',
                        viewRecord.acidity_percent ?? '—',
                        viewRecord.alcohol_result ?? '—',
                        viewRecord.fat_percent ?? '—',
                        viewRecord.clr ?? '—',
                        viewRecord.snf_percent ?? '—',
                        viewRecord.phosphatase_test ?? '—',
                        viewRecord.br ?? '—',
                        viewRecord.ph ?? '—',
                        viewRecord.ts ?? '—',
                        viewRecord.protein_percent ?? '—',
                        viewRecord.remark ?? '—'
                      ]],
                      signatures: {
                        chemist: viewRecord.chemist_name,
                        reviewer: viewRecord.quality_incharge_name,
                        reviewerTitle: 'Quality Incharge'
                      }
                    });
                  }}
                  className="bg-violet-600 hover:bg-violet-750 text-white font-medium shadow-sm transition-all"
                >
                  Download Excel
                </Button>
                <Button variant="outline" onClick={() => setViewRecord(null)}>Close</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditRecord(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-secondary-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-500" />
                  Edit Record — {editRecord.product_name}
                </h2>
                <button onClick={() => setEditRecord(null)} className="text-text-secondary hover:text-text-primary text-xl font-bold">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Date', field: 'date', type: 'date' },
                  { label: 'Testing Time', field: 'testing_time', type: 'time' },
                  { label: 'Tank No', field: 'tank_no', type: 'text' },
                  { label: 'Batch No', field: 'batch_no', type: 'text' },
                  { label: 'Packing Head', field: 'packing_head', type: 'text' },
                  { label: 'Product Name', field: 'product_name', type: 'text' },
                  { label: 'Temperature (°C)', field: 'temp_celsius', type: 'number' },
                  { label: 'Acidity %', field: 'acidity_percent', type: 'number' },
                  { label: 'FAT %', field: 'fat_percent', type: 'number' },
                  { label: 'CLR', field: 'clr', type: 'number' },
                  { label: 'SNF %', field: 'snf_percent', type: 'number' },
                  { label: 'BR', field: 'br', type: 'number' },
                  { label: 'pH', field: 'ph', type: 'number' },
                  { label: 'TS', field: 'ts', type: 'number' },
                  { label: 'Protein %', field: 'protein_percent', type: 'number' },
                  { label: 'Chemist Name', field: 'chemist_name', type: 'text' },
                  { label: 'Quality Incharge', field: 'quality_incharge_name', type: 'text' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                    <input
                      type={type}
                      value={(editRecord as any)[field] ?? ''}
                      step={type === 'number' ? '0.001' : undefined}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditRecord((prev) => prev ? {
                          ...prev,
                          [field]: type === 'number' ? (v === '' ? null : parseFloat(v)) : v,
                        } : prev);
                      }}
                      className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    />
                  </div>
                ))}
                {/* Alcohol & Phosphatase selects */}
                {[
                  { label: 'Alcohol Result', field: 'alcohol_result' },
                  { label: 'Phosphatase Test', field: 'phosphatase_test' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
                    <select
                      value={(editRecord as any)[field] ?? ''}
                      onChange={(e) => setEditRecord((prev) => prev ? { ...prev, [field]: e.target.value } : prev)}
                      className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                    >
                      <option value="">—</option>
                      <option>Positive</option>
                      <option>Negative</option>
                      <option>N/A</option>
                    </select>
                  </div>
                ))}
              </div>
              {/* Remark full width */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Remark</label>
                <textarea
                  value={editRecord.remark ?? ''}
                  onChange={(e) => setEditRecord((prev) => prev ? { ...prev, remark: e.target.value } : prev)}
                  rows={2}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
