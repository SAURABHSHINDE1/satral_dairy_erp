import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Save, Trash2, Scale, RefreshCw, Eye, Edit2, Check, X, Send,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { pouchWeighingService } from '../services/pouchWeighing.service';
import type { PouchWeighingHead, PouchWeighingReading } from '../types';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';

const toInputDateStr = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};


// ─── Constants ─────────────────────────────────────────────────────────────────

const HEAD_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
type HeadLabel = typeof HEAD_LABELS[number];

const FIXED_TIMESLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];

// ─── Local form types (client-side only, no DB ids needed during entry) ────────

type LocalReading = { timing: string; weight_reading_ml: string }; // string for input binding

type LocalHead = {
  _id: string;                        // client-only key
  head_name: HeadLabel;
  batch_release_tank_number: string;
  operator_name: string;
  batch_no: string;
  mfg_date: string;
  exp_date: string;
  pack_size_ml: string;
  target_weight_min_ml: string;
  target_weight_max_ml: string;
  readings: LocalReading[];           // indexed 1:1 with FIXED_TIMESLOTS
  collapsed: boolean;                 // header card toggle
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const genId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const makeDefaultReadings = (): LocalReading[] =>
  FIXED_TIMESLOTS.map((timing) => ({ timing, weight_reading_ml: '' }));

const makeNewHead = (label: HeadLabel): LocalHead => ({
  _id: genId(),
  head_name: label,
  batch_release_tank_number: '',
  operator_name: '',
  batch_no: '',
  mfg_date: '',
  exp_date: '',
  pack_size_ml: '',
  target_weight_min_ml: '',
  target_weight_max_ml: '',
  readings: makeDefaultReadings(),
  collapsed: false,
});

const isHeadActive = (h: LocalHead): boolean => {
  const hasMeta =
    (h.batch_release_tank_number || '').trim() !== '' ||
    (h.operator_name || '').trim() !== '' ||
    (h.batch_no || '').trim() !== '';
  const hasReading = h.readings.some((r) => (r.weight_reading_ml || '').trim() !== '');
  return hasMeta || hasReading;
};

/** Convert LocalHead[] → API payload heads */
const serializeHeads = (heads: LocalHead[]): PouchWeighingHead[] =>
  heads
    .filter(isHeadActive)
    .map(({ _id, collapsed, readings, ...h }) => ({
      ...h,
      batch_release_tank_number: h.batch_release_tank_number || null,
      operator_name:             h.operator_name             || null,
      batch_no:                  h.batch_no                  || null,
      mfg_date:                  h.mfg_date                  || null,
      exp_date:                  h.exp_date                  || null,
      pack_size_ml:              h.pack_size_ml  !== '' ? parseFloat(h.pack_size_ml)         : null,
      target_weight_min_ml:      h.target_weight_min_ml !== '' ? parseFloat(h.target_weight_min_ml) : null,
      target_weight_max_ml:      h.target_weight_max_ml !== '' ? parseFloat(h.target_weight_max_ml) : null,
      readings: readings.map((r) => ({
        timing: r.timing,
        weight_reading_ml: r.weight_reading_ml !== '' ? parseFloat(r.weight_reading_ml) : null,
      })) as PouchWeighingReading[],
    }));

/** A small editable input cell inside the grid */
function WeightCell({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number | null;
  max?: number | null;
}) {
  const numVal = value !== '' ? parseFloat(value) : null;
  const outOfRange =
    numVal !== null && min != null && max != null
      ? numVal < min || numVal > max
      : false;

  return (
    <input
      type="number"
      value={value}
      step="0.01"
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={[
        'w-full min-w-[72px] px-2 py-1.5 text-xs text-center rounded border transition-colors',
        'bg-transparent focus:outline-none focus:ring-1',
        outOfRange
          ? 'border-red-300 bg-red-50 focus:ring-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400'
          : 'border-transparent hover:border-primary-200 focus:border-emerald-400 focus:ring-emerald-300',
      ].join(' ')}
    />
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function PouchWeighingLogSheet() {
  const { user } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'entry' | 'records'>('entry');

  // ── Form state ──────────────────────────────────────────────────────────────
  const [formDate,            setFormDate]            = useState(today);
  const [supervisorName,      setSupervisorName]      = useState('');
  const [qualityInchargeName, setQualityInchargeName] = useState('');
  const [heads,               setHeads]               = useState<LocalHead[]>(() =>
    HEAD_LABELS.map((label) => makeNewHead(label))
  );

  // ── Load/Filter existing session state ──────────────────────────────────────
  const [loadDate,     setLoadDate]     = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [existingId,   setExistingId]   = useState<number | null>(null);
  const [viewSession,  setViewSession]  = useState<import('../types').PouchWeighingSession | null>(null);

  const queryClient = useQueryClient();

  // ── Records list Query ──────────────────────────────────────────────────────
  const { data: recordsResponse, isLoading: isRecordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['pouchWeighingSessions', filterDate],
    queryFn: () => pouchWeighingService.getByDate(filterDate),
  });
  const sessions = recordsResponse?.data || [];

  // ── Session loading helper (Merge loaded heads with the 9 templates) ────────
  const loadSessionIntoForm = useCallback((session: import('../types').PouchWeighingSession) => {
    setExistingId(session.id);
    setFormDate(toInputDateStr(session.date));
    setSupervisorName(session.packing_supervisor_name || '');
    setQualityInchargeName(session.quality_incharge_name || '');

    const loadedHeads: LocalHead[] = HEAD_LABELS.map((label) => {
      const foundHead = session.heads.find((h) => h.head_name === label);
      if (foundHead) {
        return {
          _id: genId(),
          head_name: label,
          batch_release_tank_number: foundHead.batch_release_tank_number || '',
          operator_name:             foundHead.operator_name             || '',
          batch_no:                  foundHead.batch_no                  || '',
          mfg_date:                  toInputDateStr(foundHead.mfg_date),
          exp_date:                  toInputDateStr(foundHead.exp_date),
          pack_size_ml:              foundHead.pack_size_ml        != null ? String(foundHead.pack_size_ml)         : '',
          target_weight_min_ml:      foundHead.target_weight_min_ml != null ? String(foundHead.target_weight_min_ml) : '',
          target_weight_max_ml:      foundHead.target_weight_max_ml != null ? String(foundHead.target_weight_max_ml) : '',
          collapsed: false,
          readings: FIXED_TIMESLOTS.map((timing) => {
            const foundReading = foundHead.readings.find((r) => r.timing === timing);
            return {
              timing,
              weight_reading_ml:
                foundReading?.weight_reading_ml != null ? String(foundReading.weight_reading_ml) : '',
            };
          }),
        };
      }
      return makeNewHead(label);
    });
    setHeads(loadedHeads);
  }, []);

  // ── Load session mutation ─────────────────────────────────────────────
  const loadSessionMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await pouchWeighingService.getByDate(date);
      return res.data;
    },
    onSuccess: (sessionsList: import('../types').PouchWeighingSession[]) => {
      if (!sessionsList || sessionsList.length === 0) {
        toast.info('Ya date sathi koi session nahi mila. Naveen bana sakta hai.');
        return;
      }
      loadSessionIntoForm(sessionsList[0]);
      toast.success(`Session loaded — ${sessionsList[0].heads.length} head(s) milale.`);
    },
    onError: () => {
      toast.error('Session load karata aale nahi');
    },
  });

  // ── Save mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeHeadsPayload = serializeHeads(heads);
      if (activeHeadsPayload.length === 0) {
        throw new Error('Fill details or readings for at least one Packing Head.');
      }
      const payload = {
        date: formDate,
        packing_supervisor_name: supervisorName || undefined,
        quality_incharge_name:   qualityInchargeName || undefined,
        heads: activeHeadsPayload,
      };
      if (existingId) {
        return pouchWeighingService.update(existingId, payload);
      }
      return pouchWeighingService.create(payload);
    },
    onSuccess: (res) => {
      toast.success(
        existingId
          ? 'Session updated successfully!'
          : 'Pouch Weighing session saved successfully!'
      );
      if (!existingId && res.data?.id) {
        setExistingId(res.data.id);
      }
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSession'] });
      setActiveTab('records');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Save karata aale nahi');
    },
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return pouchWeighingService.delete(id);
    },
    onSuccess: () => {
      toast.success('Session deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Delete karata aale nahi');
    },
  });

  // ── Submit mutation ─────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: (id: number) => pouchWeighingService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      toast.success('Session submitted for lab approval!');
      setViewSession(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  });

  // ── Lab approval mutations ──────────────────────────────────────────────────
  const approveLabMutation = useMutation({
    mutationFn: (id: number) => pouchWeighingService.approveByLab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      toast.success('Session approved by Lab Incharge!');
      setViewSession(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lab approval failed');
    }
  });

  const rejectLabMutation = useMutation({
    mutationFn: (id: number) => pouchWeighingService.rejectByLab(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      toast.success('Session rejected by Lab Incharge!');
      setViewSession(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lab rejection failed');
    }
  });

  // ── Admin approval mutations ────────────────────────────────────────────────
  const approveAdminMutation = useMutation({
    mutationFn: (id: number) => pouchWeighingService.approveByAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      toast.success('Session approved by Admin!');
      setViewSession(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Admin approval failed');
    }
  });

  const rejectAdminMutation = useMutation({
    mutationFn: (id: number) => pouchWeighingService.rejectByAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pouchWeighingSessions'] });
      toast.success('Session rejected by Admin!');
      setViewSession(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Admin rejection failed');
    }
  });

  const updateHead = useCallback((id: string, field: keyof LocalHead, value: any) => {
    setHeads((prev) =>
      prev.map((h) => (h._id === id ? { ...h, [field]: value } : h))
    );
  }, []);

  const updateReading = useCallback(
    (headId: string, timingIndex: number, value: string) => {
      setHeads((prev) =>
        prev.map((h) => {
          if (h._id !== headId) return h;
          const newReadings = [...h.readings];
          newReadings[timingIndex] = { ...newReadings[timingIndex], weight_reading_ml: value };
          return { ...h, readings: newReadings };
        })
      );
    },
    []
  );

  const handleReset = () => {
    setHeads(HEAD_LABELS.map((label) => makeNewHead(label)));
    setSupervisorName('');
    setQualityInchargeName('');
    setExistingId(null);
    setFormDate(today);
    toast.info('Form reset kela');
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Pouch Weighing Log Sheet</h1>
            <p className="text-xs text-text-secondary">Packing head-wise weight readings (9:00 AM – 8:00 PM)</p>
          </div>
        </div>

        {activeTab === 'entry' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={handleReset} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || heads.length === 0}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? 'Saving...' : existingId ? 'Update Session' : 'Save Session'}
            </Button>
          </div>
        )}
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-xl p-1 w-fit">
        {(['entry', 'records'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'records') {
                refetchRecords();
              }
            }}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white dark:bg-secondary-700 shadow-sm text-emerald-600 font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab === 'entry' ? '+ New Entry / Edit' : 'View Records'}
          </button>
        ))}
      </div>

      {/* ── ENTRY TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'entry' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* ── Top controls: Date + Load existing ──────────────────────────────── */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              {/* Session date */}
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Session Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => { setFormDate(e.target.value); setExistingId(null); }}
                  className="w-full px-3 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Load existing */}
              <div className="flex items-end gap-2">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                    Load Existing Session
                  </label>
                  <input
                    type="date"
                    value={loadDate}
                    onChange={(e) => setLoadDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadSessionMutation.mutate(loadDate)}
                  disabled={!loadDate || loadSessionMutation.isPending}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadSessionMutation.isPending ? 'animate-spin' : ''}`} />
                  {loadSessionMutation.isPending ? 'Loading...' : 'Load'}
                </Button>
              </div>

              {existingId && (
                <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Session #{existingId} loaded (update mode)
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* ── Unified Pouch Weighing Log Grid ─────────────────────────── */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 bg-gradient-to-r from-secondary-50 to-white dark:from-secondary-800 dark:to-secondary-800">
              <h2 className="text-sm font-semibold text-text-primary font-bold">Pouch Weighing Log Grid</h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Fill metadata at the top and bottom rows, and weight readings (ml) in the time slots.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-max">
                <thead>
                  <tr className="bg-secondary-100 dark:bg-secondary-800 border-b border-secondary-300 dark:border-secondary-600">
                    <th className="sticky left-0 z-20 bg-secondary-100 dark:bg-secondary-800 px-4 py-3 text-left font-bold text-text-primary border-r border-secondary-300 dark:border-secondary-600 whitespace-nowrap min-w-[200px]">
                      Timings / Parameters
                    </th>
                    {heads.map((h) => (
                      <th key={h._id} className="px-3 py-3 text-center font-bold text-text-primary min-w-[120px] border-l border-secondary-200 dark:border-secondary-700">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold text-center tracking-wide shadow-sm min-w-[80px] inline-block uppercase">
                          Head {h.head_name}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Batch Release Tank Number */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Batch Release Tank Number
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="text"
                          value={h.batch_release_tank_number}
                          onChange={(e) => updateHead(h._id, 'batch_release_tank_number', e.target.value)}
                          placeholder="Tank Number"
                          className="w-full px-2 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 2: Operator's Name */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Operator's Name
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="text"
                          value={h.operator_name}
                          onChange={(e) => updateHead(h._id, 'operator_name', e.target.value)}
                          placeholder="Operator Name"
                          className="w-full px-2 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 3: Batch No. */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Batch No.
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="text"
                          value={h.batch_no}
                          onChange={(e) => updateHead(h._id, 'batch_no', e.target.value)}
                          placeholder="Batch No."
                          className="w-full px-2 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 4: Mfg. Date */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Mfg. Date
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="date"
                          value={h.mfg_date}
                          onChange={(e) => updateHead(h._id, 'mfg_date', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center animate-none"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 5: Exp. Date */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-300 dark:border-secondary-600">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Exp. Date
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="date"
                          value={h.exp_date}
                          onChange={(e) => updateHead(h._id, 'exp_date', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center animate-none"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Weight readings (Middle Rows) */}
                  {FIXED_TIMESLOTS.map((timing, tIdx) => (
                    <tr
                      key={timing}
                      className={
                        tIdx % 2 === 0
                          ? 'bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800'
                          : 'bg-secondary-50/60 dark:bg-secondary-800/60 border-b border-secondary-100 dark:border-secondary-800'
                      }
                    >
                      <td className="sticky left-0 z-10 px-4 py-1.5 font-mono text-xs font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-inherit whitespace-nowrap">
                        {timing}
                      </td>

                      {heads.map((h) => {
                        const reading = h.readings[tIdx];
                        const minVal = h.target_weight_min_ml !== '' ? parseFloat(h.target_weight_min_ml) : null;
                        const maxVal = h.target_weight_max_ml !== '' ? parseFloat(h.target_weight_max_ml) : null;
                        return (
                          <td
                            key={h._id}
                            className="px-2 py-0.5 border-l border-secondary-100 dark:border-secondary-700 text-center"
                          >
                            <WeightCell
                              value={reading.weight_reading_ml}
                              onChange={(v) => updateReading(h._id, tIdx, v)}
                              min={minVal}
                              max={maxVal}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Row 29: Pack Size */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-t border-b border-secondary-200 dark:border-secondary-700">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Pack Size (ml)
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <input
                          type="number"
                          step="0.01"
                          value={h.pack_size_ml}
                          onChange={(e) => updateHead(h._id, 'pack_size_ml', e.target.value)}
                          placeholder="Pack Size"
                          className="w-full px-2 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Row 30: Target weight range */}
                  <tr className="bg-emerald-50/30 dark:bg-secondary-900 border-b border-secondary-300 dark:border-secondary-600">
                    <td className="sticky left-0 z-10 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/50 dark:bg-secondary-900 whitespace-nowrap">
                      Target weight (ml)
                    </td>
                    {heads.map((h) => (
                      <td key={h._id} className="px-2 py-1.5 border-l border-secondary-100 dark:border-secondary-700">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            value={h.target_weight_min_ml}
                            onChange={(e) => updateHead(h._id, 'target_weight_min_ml', e.target.value)}
                            placeholder="Min"
                            className="w-1/2 px-1.5 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                          />
                          <span className="text-[10px] text-text-secondary select-none">to</span>
                          <input
                            type="number"
                            step="0.01"
                            value={h.target_weight_max_ml}
                            onChange={(e) => updateHead(h._id, 'target_weight_max_ml', e.target.value)}
                            placeholder="Max"
                            className="w-1/2 px-1.5 py-1 text-xs border border-secondary-200 dark:border-secondary-700 rounded bg-white dark:bg-secondary-800 focus:outline-none focus:ring-1 focus:ring-emerald-400 text-center"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Signature section ────────────────────────────────────────────────── */}
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Signatures</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Packing Supervisor Name
                </label>
                <Input
                  value={supervisorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupervisorName(e.target.value)}
                  placeholder="Enter supervisor name..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">
                  Quality Incharge Name
                </label>
                <Input
                  value={qualityInchargeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQualityInchargeName(e.target.value)}
                  placeholder="Enter quality incharge name..."
                />
              </div>
            </div>
          </Card>

          {/* ── Save footer ──────────────────────────────────────────────────────── */}
          {heads.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="lg"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="gap-2 px-8"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending
                  ? 'Saving...'
                  : existingId
                  ? 'Update Session'
                  : 'Save Pouch Weighing Session'}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── RECORDS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  id="pouch-filter-date"
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div>
                <Button variant="outline" onClick={() => setFilterDate('')}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 dark:border-secondary-700 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">
                Saved Sessions
                {sessions.length > 0 && (
                  <span className="ml-2 text-xs text-text-secondary font-normal">
                    ({sessions.length} found)
                  </span>
                )}
              </h3>
            </div>

            {isRecordsLoading ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-text-secondary">Loading records...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16">
                <Scale className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                <p className="text-text-secondary">No sessions found</p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                  onClick={() => setActiveTab('entry')}
                >
                  <Plus className="w-4 h-4 mr-2" />Add New Entry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm records-table">
                  <thead>
                    <tr className="bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
                      {['Date', 'Supervisor', 'Quality Incharge', 'Packing Heads', 'Created By', 'Created At', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-text-secondary whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((rec, idx) => (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-emerald-50/10 dark:hover:bg-secondary-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-xs font-medium text-text-primary whitespace-nowrap">
                          {formatDate(rec.date)}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {rec.packing_supervisor_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {rec.quality_incharge_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            {rec.heads?.length || 0} Heads
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {rec.created_by_name || '—'}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary whitespace-nowrap">
                          {formatDate(rec.created_at)}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <Badge className={getStatusColor(rec.status || 'draft')}>
                            {getStatusLabel(rec.status || 'draft')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewSession(rec)}
                              className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="View Grid"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Submit Button (Only for draft/rejected) */}
                            {(rec.status === 'draft' || rec.status === 'rejected') && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Nikki hi session approval sathi submit karayachi ahe ka?')) {
                                    submitMutation.mutate(rec.id);
                                  }
                                }}
                                className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Submit for Approval"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {/* Lab approval buttons */}
                            {rec.status === 'pending_lab' && (user?.role === 'lab_incharge' || user?.role === 'admin') && (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Approve this session (Lab)?')) {
                                      approveLabMutation.mutate(rec.id);
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title="Lab Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Reject this session (Lab)?')) {
                                      rejectLabMutation.mutate(rec.id);
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 hover:text-red-700 transition-colors"
                                  title="Lab Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Admin approval buttons */}
                            {rec.status === 'pending_admin' && user?.role === 'admin' && (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Approve this session (Admin)?')) {
                                      approveAdminMutation.mutate(rec.id);
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title="Admin Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Reject this session (Admin)?')) {
                                      rejectAdminMutation.mutate(rec.id);
                                    }
                                  }}
                                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 hover:text-red-700 transition-colors"
                                  title="Admin Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Edit Button (Only for draft/rejected) */}
                            {(rec.status === 'draft' || rec.status === 'rejected') && (
                              <button
                                onClick={() => {
                                  loadSessionIntoForm(rec);
                                  setActiveTab('entry');
                                }}
                                className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-800 text-text-secondary hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                title="Edit Session"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (window.confirm('Nikki hi pouch weighing session delete karayachi ahe ka?')) {
                                  deleteMutation.mutate(rec.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete Session"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* ── View Modal ───────────────────────────────────────────────────────── */}
      {viewSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-5xl bg-white dark:bg-secondary-900 rounded-2xl shadow-xl overflow-hidden border border-secondary-200 dark:border-secondary-700"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">Pouch Weighing Session Details</h3>
                  <Badge className="bg-white/20 text-white border-white/30 capitalize">
                    {getStatusLabel(viewSession.status || 'draft')}
                  </Badge>
                </div>
                <p className="text-xs opacity-90">Session Date: {formatDate(viewSession.date)}</p>
              </div>
              <button
                onClick={() => setViewSession(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-secondary-50 dark:bg-secondary-800 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Date</span>
                  <p className="text-sm font-medium text-text-primary">{formatDate(viewSession.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Packing Supervisor</span>
                  <p className="text-sm font-medium text-text-primary">{viewSession.packing_supervisor_name || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Quality Incharge</span>
                  <p className="text-sm font-medium text-text-primary">{viewSession.quality_incharge_name || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">Created By</span>
                  <p className="text-sm font-medium text-text-primary">{viewSession.created_by_name || '—'}</p>
                </div>
              </div>

              {/* Single Consolidated Read-Only Grid */}
              <div className="border border-secondary-200 dark:border-secondary-700 rounded-xl overflow-hidden bg-white dark:bg-secondary-800">
                <div className="px-4 py-2 border-b border-secondary-100 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-bold">Pouch Weighing Log Sheet Grid</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-max">
                    <thead>
                      <tr className="bg-secondary-100 dark:bg-secondary-800 border-b border-secondary-300 dark:border-secondary-600">
                        <th className="sticky left-0 bg-secondary-100 dark:bg-secondary-800 px-4 py-3 text-left font-bold text-text-primary border-r border-secondary-300 dark:border-secondary-600 whitespace-nowrap min-w-[200px]">
                          Timings / Parameters
                        </th>
                        {HEAD_LABELS.map((label) => (
                          <th key={label} className="px-3 py-3 text-center font-bold text-text-primary min-w-[120px] border-l border-secondary-200 dark:border-secondary-700">
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold text-center tracking-wide shadow-sm min-w-[80px] inline-block uppercase">
                              Head {label}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Helper to find head by label */}
                      {(() => {
                        const findHead = (label: string) => viewSession.heads.find((h) => h.head_name === label);

                        return (
                          <>
                            {/* Row 1: Tank No */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Batch Release Tank Number
                              </td>
                              {HEAD_LABELS.map((label) => (
                                <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 font-mono">
                                  {findHead(label)?.batch_release_tank_number || '—'}
                                </td>
                              ))}
                            </tr>

                            {/* Row 2: Operator Name */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Operator's Name
                              </td>
                              {HEAD_LABELS.map((label) => (
                                <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700">
                                  {findHead(label)?.operator_name || '—'}
                                </td>
                              ))}
                            </tr>

                            {/* Row 3: Batch No */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Batch No.
                              </td>
                              {HEAD_LABELS.map((label) => (
                                <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 font-mono">
                                  {findHead(label)?.batch_no || '—'}
                                </td>
                              ))}
                            </tr>

                            {/* Row 4: Mfg Date */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Mfg. Date
                              </td>
                              {HEAD_LABELS.map((label) => {
                                const mfg = findHead(label)?.mfg_date;
                                return (
                                  <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 whitespace-nowrap">
                                    {mfg ? formatDate(mfg) : '—'}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 5: Exp Date */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-300 dark:border-secondary-600">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Exp. Date
                              </td>
                              {HEAD_LABELS.map((label) => {
                                const exp = findHead(label)?.exp_date;
                                return (
                                  <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 whitespace-nowrap">
                                    {exp ? formatDate(exp) : '—'}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Middle Rows: Timings */}
                            {FIXED_TIMESLOTS.map((timing, tIdx) => (
                              <tr
                                key={timing}
                                className={
                                  tIdx % 2 === 0
                                    ? 'bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800'
                                    : 'bg-secondary-50/60 dark:bg-secondary-800/60 border-b border-secondary-100 dark:border-secondary-800'
                                }
                              >
                                <td className="sticky left-0 px-4 py-1.5 font-mono text-xs font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-inherit whitespace-nowrap">
                                  {timing}
                                </td>
                                {HEAD_LABELS.map((label) => {
                                  const h = findHead(label);
                                  const found = h?.readings.find((r) => r.timing === timing);
                                  const readingVal = found?.weight_reading_ml;
                                  const minVal = h?.target_weight_min_ml;
                                  const maxVal = h?.target_weight_max_ml;
                                  const outOfRange =
                                    readingVal != null && minVal != null && maxVal != null
                                      ? readingVal < minVal || readingVal > maxVal
                                      : false;
                                  return (
                                    <td
                                      key={label}
                                      className={`px-2 py-1 text-center font-mono border-l border-secondary-100 dark:border-secondary-700 ${
                                        outOfRange ? 'text-red-600 bg-red-50/50 dark:text-red-400 dark:bg-red-950/20 font-bold' : ''
                                      }`}
                                    >
                                      {readingVal != null ? readingVal.toFixed(1) : '—'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}

                            {/* Row 29: Pack Size */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-t border-b border-secondary-200 dark:border-secondary-700">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Pack Size (ml)
                              </td>
                              {HEAD_LABELS.map((label) => {
                                const h = findHead(label);
                                return (
                                  <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 font-mono">
                                    {h?.pack_size_ml != null ? `${h.pack_size_ml} ml` : '—'}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Row 30: Target Weight */}
                            <tr className="bg-emerald-50/20 dark:bg-secondary-900 border-b border-secondary-300 dark:border-secondary-600">
                              <td className="sticky left-0 px-4 py-2 font-semibold text-text-secondary border-r border-secondary-300 dark:border-secondary-600 bg-emerald-50/30 dark:bg-secondary-900 whitespace-nowrap">
                                Target weight (ml)
                              </td>
                              {HEAD_LABELS.map((label) => {
                                const h = findHead(label);
                                return (
                                  <td key={label} className="px-2 py-2 text-center border-l border-secondary-100 dark:border-secondary-700 font-mono whitespace-nowrap font-semibold">
                                    {h?.target_weight_min_ml != null && h?.target_weight_max_ml != null
                                      ? `${h.target_weight_min_ml} to ${h.target_weight_max_ml}`
                                      : '—'}
                                  </td>
                                );
                              })}
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-secondary-50 dark:bg-secondary-800 border-t border-secondary-100 dark:border-secondary-700 flex justify-between items-center gap-3">
              <div className="flex gap-2">
                {/* Submit for Approval */}
                {(viewSession.status === 'draft' || viewSession.status === 'rejected') && (
                  <Button
                    onClick={() => {
                      if (window.confirm('Do you want to submit this session for approval?')) {
                        submitMutation.mutate(viewSession.id);
                      }
                    }}
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Approval
                  </Button>
                )}

                {/* Lab Approval */}
                {viewSession.status === 'pending_lab' && (user?.role === 'lab_incharge' || user?.role === 'admin') && (
                  <>
                    <Button
                      onClick={() => {
                        if (window.confirm('Approve this session (Lab)?')) {
                          approveLabMutation.mutate(viewSession.id);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve (Lab)
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm('Reject this session (Lab)?')) {
                          rejectLabMutation.mutate(viewSession.id);
                        }
                      }}
                      variant="outline"
                      className="border-red-600 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject (Lab)
                    </Button>
                  </>
                )}

                {/* Admin Approval */}
                {viewSession.status === 'pending_admin' && user?.role === 'admin' && (
                  <>
                    <Button
                      onClick={() => {
                        if (window.confirm('Approve this session (Admin)?')) {
                          approveAdminMutation.mutate(viewSession.id);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve (Admin)
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm('Reject this session (Admin)?')) {
                          rejectAdminMutation.mutate(viewSession.id);
                        }
                      }}
                      variant="outline"
                      className="border-red-600 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/20"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject (Admin)
                    </Button>
                  </>
                )}
              </div>

              <Button onClick={() => setViewSession(null)} variant="secondary">
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
