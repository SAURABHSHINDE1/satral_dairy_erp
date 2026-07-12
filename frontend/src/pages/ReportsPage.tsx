import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Droplets,
  Thermometer,
  Printer,
  CheckCircle,
  Milk,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

const moduleOptions = [
  { value: 'tank_records', label: 'Tank Records' },
  { value: 'final_product_storage_records', label: 'Final Product Storage' },
  { value: 'bi_product_reports', label: 'Final Bi-Product Report' },
  { value: 'raw_bulk_milk_testing_records', label: 'Raw Bulk Milk Testing' },
  { value: 'packing_milk_reports', label: 'Packing Milk Report' },
  { value: 'milk_taken_report_bi_products', label: 'Milk Taken Report (Bi-Product)' },
  { value: 'buttermilk_analysis_records', label: 'Buttermilk Analysis' },
  { value: 'pouch_weighing_sessions', label: 'Pouch Weighing Log' }
];

const formatHeader = (key: string): string => {
  const customMap: Record<string, string> = {
    date: 'Date',
    tank_number: 'Tank No.',
    batch_number: 'Batch No.',
    batch_no: 'Batch No.',
    milk_quantity: 'Milk Qty (L)',
    milk_quantity_l: 'Milk Qty (L)',
    fat_percentage: 'FAT %',
    fat_percent: 'FAT %',
    snf_percentage: 'SNF %',
    snf_percent: 'SNF %',
    temperature: 'Temp (°C)',
    temp_celsius: 'Temp (°C)',
    milk_type: 'Milk Type',
    type_of_milk: 'Milk Type',
    status: 'Status',
    shift: 'Shift',
    operator_name: 'Operator',
    chemist_name: 'Chemist',
    quality_incharge_name: 'Quality Incharge',
    product_name: 'Product',
    acidity_percent: 'Acidity %',
    ph: 'pH',
    moisture: 'Moisture %'
  };

  if (customMap[key]) return customMap[key];

  return key
    .split('_')
    .map(word => {
      if (word.toUpperCase() === 'ML') return 'ml';
      if (word.toUpperCase() === 'FAT') return 'FAT';
      if (word.toUpperCase() === 'SNF') return 'SNF';
      if (word.toUpperCase() === 'PH') return 'pH';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return '—';

  if (key === 'date' || key === 'mfg_date' || key === 'exp_date') {
    return formatDate(String(value));
  }

  if (typeof value === 'number') {
    if (key.includes('percentage') || key.includes('percent') || key === 'ph') {
      return value.toFixed(2);
    }
    if (key.includes('quantity') || key.includes('volume') || key.includes('size')) {
      return value.toFixed(1);
    }
    return String(value);
  }

  return String(value);
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [selectedModule, setSelectedModule] = useState('tank_records');
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [isExporting, setIsExporting] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [triggered, setTriggered] = useState(false);
  const [queryKey, setQueryKey] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const { data: reportData, isLoading, isError } = useQuery({
    queryKey: ['report', selectedModule, reportType, reportDate, customFrom, customTo, selectedYear, selectedMonth, queryKey],
    queryFn: async () => {
      switch (reportType) {
        case 'daily':
          return reportService.getDailyReport(reportDate, selectedModule);
        case 'weekly':
          return reportService.getWeeklyReport(weekAgo, todayStr, selectedModule);
        case 'monthly':
          return reportService.getMonthlyReport(selectedYear, selectedMonth, selectedModule);
        case 'custom':
          return reportService.getCustomReport(customFrom, customTo, {}, selectedModule);
      }
    },
    enabled: triggered,
    retry: false,
  });

  const report = reportData?.data;
  const stats = report?.statistics || {};
  const records: any[] = report?.records || [];
  const dailyTrend = report?.dailyTrend || [];

  const handleGenerate = () => {
    if (reportType === 'custom' && (!customFrom || !customTo)) {
      return;
    }
    setTriggered(true);
    setQueryKey((k) => k + 1);
  };

  // Determine visible columns dynamically
  const visibleColumns = records.length > 0
    ? Object.keys(records[0]).filter(key => {
        return !['id', 'created_by', 'created_at', 'updated_at', 'user_id', 'session_id', 'process_operator_id', 'lab_incharge_id'].includes(key);
      })
    : [];

  const handleExportCSV = () => {
    if (!records.length) return;

    const escapeCSVField = (val: any) => {
      const str = val === null || val === undefined ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = visibleColumns.map(col => formatHeader(col));
    const rows = [
      headers,
      ...records.map((r) => visibleColumns.map(col => formatValue(col, r[col])))
    ];

    const csv = rows.map((row) => row.map(escapeCSVField).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${selectedModule}_${reportType}_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    toast.info('Preparing professional PDF report...');

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`satral_dairy_${selectedModule}_report_${reportType}_${todayStr}.pdf`);
      toast.success('Professional PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate professional PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Report' },
    { value: 'weekly', label: 'Weekly Report (Last 7 days)' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'custom', label: 'Custom Date Range' },
  ];

  const monthOptions = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = today.getFullYear() - i;
    return { value: y.toString(), label: y.toString() };
  });

  const getPeriodString = () => {
    switch (reportType) {
      case 'daily':
        return formatDate(reportDate);
      case 'weekly':
        return `${formatDate(weekAgo)} to ${formatDate(todayStr)}`;
      case 'monthly': {
        const monthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;
        return `${monthLabel} ${selectedYear}`;
      }
      case 'custom':
        return `${customFrom ? formatDate(customFrom) : '—'} to ${customTo ? formatDate(customTo) : '—'}`;
      default:
        return '—';
    }
  };

  // Calculate dynamic KPI cards based on returned statistics keys
  const kpiCards = [
    { title: 'Total Logs', value: stats.total_records || 0, icon: FileText, color: 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-950/30' }
  ];

  if (stats.approved_records !== undefined) {
    kpiCards.push({
      title: 'Approved',
      value: stats.approved_records,
      icon: CheckCircle,
      color: 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-950/30'
    });
  }

  Object.keys(stats).forEach(key => {
    if (['total_records', 'approved_records', 'pending_records', 'rejected_records'].includes(key)) {
      return;
    }

    let title = '';
    let valStr = '';
    let color = 'text-accent-600 bg-accent-100 dark:text-accent-400 dark:bg-accent-950/30';
    let Icon = TrendingUp;

    if (key.startsWith('avg_')) {
      const field = key.replace('avg_', '');
      title = `Avg ${formatHeader(field)}`;
      valStr = Number(stats[key]).toFixed(2);
      if (field.includes('temp')) {
        Icon = Thermometer;
        color = 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-950/30';
      }
    } else if (key.startsWith('total_')) {
      const field = key.replace('total_', '');
      title = `Total ${formatHeader(field)}`;
      valStr = Number(stats[key]).toLocaleString('en-IN', { maximumFractionDigits: 1 });
      if (field.includes('milk') || field.includes('qty')) {
        Icon = Droplets;
        color = 'text-primary-600 bg-primary-100 dark:text-primary-400 dark:bg-primary-950/30';
      }
    }

    if (title) {
      kpiCards.push({ title, value: valStr, icon: Icon, color });
    }
  });

  const activeModuleLabel = moduleOptions.find(o => o.value === selectedModule)?.label || selectedModule;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-secondary mt-1">Generate, print, and export reports for quality modules</p>
      </div>

      {/* Controls */}
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Generate Module Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <Select
            label="Module Name"
            value={selectedModule}
            onChange={(e) => { setSelectedModule(e.target.value); setTriggered(false); }}
            options={moduleOptions}
          />

          <Select
            label="Report Frequency"
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as ReportType); setTriggered(false); }}
            options={reportTypes}
          />

          {reportType === 'daily' && (
            <Input
              label="Select Date"
              type="date"
              value={reportDate}
              onChange={(e) => { setReportDate(e.target.value); setTriggered(false); }}
            />
          )}

          {reportType === 'monthly' && (
            <div className="flex gap-2">
              <Select label="Month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setTriggered(false); }} options={monthOptions} />
              <Select label="Year" value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setTriggered(false); }} options={yearOptions} />
            </div>
          )}

          {reportType === 'custom' && (
            <>
              <Input label="From Date" type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); setTriggered(false); }} />
              <Input label="To Date" type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); setTriggered(false); }} />
            </>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleGenerate} disabled={isLoading}>
            <BarChart3 className="w-4 h-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
          {report && (
            <>
              <Button variant="outline" onClick={handleExportCSV} disabled={!records.length}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print / PDF
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}>
                <FileText className="w-4 h-4 mr-2" />
                {isExporting ? 'Downloading PDF...' : 'Download PDF'}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-text-secondary">Generating report...</p>
        </div>
      )}

      {isError && (
        <Card>
          <p className="text-center text-danger-600 py-8">Failed to generate report. Please check your data or range and try again.</p>
        </Card>
      )}

      {report && !isLoading && (
        <div
          ref={printRef}
          id="printable-report"
          className="space-y-6 bg-white dark:bg-secondary-900 p-6 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm"
        >
          {/* Custom style block to hide everything else in print mode */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-report, #printable-report * {
                visibility: visible !important;
              }
              #printable-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
              }
              .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl {
                box-shadow: none !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              th, td {
                border: 1px solid #CBD5E1 !important;
                padding: 6px 8px !important;
              }
              tr {
                page-break-inside: avoid !important;
              }
            }
          `}} />

          {/* Official Report Corporate Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b-2 border-emerald-600 gap-4">
            {/* Left side: Logo & Corporate Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Milk className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-emerald-700 uppercase">
                  Satral Dairy & Agro Industries
                </h1>
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider">
                  Quality Control & Analysis Department
                </p>
              </div>
            </div>

            {/* Right side: Report metadata block */}
            <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 text-xs text-text-secondary min-w-[240px] space-y-1.5 shadow-sm">
              <p className="flex justify-between gap-4 border-b border-secondary-100 dark:border-secondary-700/50 pb-1">
                <span className="font-semibold text-text-primary">Report Module:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeModuleLabel}</span>
              </p>
              <p className="flex justify-between gap-4 border-b border-emerald-100 dark:border-secondary-700/50 pb-1">
                <span className="font-semibold text-text-primary">Frequency:</span>
                <span className="uppercase">{reportType}</span>
              </p>
              <p className="flex justify-between gap-4 border-b border-secondary-100 dark:border-secondary-700/50 pb-1">
                <span className="font-semibold text-text-primary">Period / Date:</span>
                <span className="font-mono">{getPeriodString()}</span>
              </p>
              <p className="flex justify-between gap-4 border-b border-secondary-100 dark:border-secondary-700/50 pb-1">
                <span className="font-semibold text-text-primary">Generated By:</span>
                <span>{user?.full_name || 'System'}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="font-semibold text-text-primary">Print Date:</span>
                <span className="font-mono">{new Date().toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Dynamic KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="text-center p-4">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary break-words">{card.value}</p>
                    <p className="text-xs text-text-secondary mt-1">{card.title}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Charts */}
          {dailyTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <h4 className="text-sm font-semibold text-text-primary mb-4">Daily Activity Log Trend</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={11} stroke="#64748B"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Line type="monotone" dataKey="records" stroke="#2563EB" strokeWidth={2} name="Logs Count" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h4 className="text-sm font-semibold text-text-primary mb-4">Records Distribution</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={11} stroke="#64748B"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Bar dataKey="records" fill="#14B8A6" name="Records Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Records Table */}
          {records.length > 0 && (
            <Card className="p-0 overflow-hidden border border-secondary-200 dark:border-secondary-800">
              <div className="px-4 py-3 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/30">
                <h4 className="text-sm font-bold text-text-primary">
                  Generated Logs ({records.length})
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
                      {visibleColumns.map((col) => (
                        <th key={col} className="text-left py-3 px-4 font-bold text-text-secondary whitespace-nowrap">
                          {formatHeader(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record: any, idx: number) => (
                      <tr key={record.id || idx} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20">
                        {visibleColumns.map((col) => {
                          const isStatusCol = col === 'status';
                          return (
                            <td key={col} className="py-2.5 px-4 text-text-primary whitespace-nowrap">
                              {isStatusCol ? (
                                <Badge className={getStatusColor(record[col])}>
                                  {getStatusLabel(record[col])}
                                </Badge>
                              ) : (
                                formatValue(col, record[col])
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {records.length === 0 && (
            <Card>
              <p className="text-center text-text-secondary py-8">No records found for the selected period.</p>
            </Card>
          )}

          {/* Signature Blocks */}
          <div className="mt-12 pt-8 border-t border-secondary-200 dark:border-secondary-800 grid grid-cols-3 gap-6 text-center text-sm">
            <div>
              <div className="border-b border-secondary-300 dark:border-secondary-700 w-32 mx-auto mb-2 h-12" />
              <p className="font-medium text-text-primary">Prepared By</p>
              <p className="text-xs text-text-secondary mt-0.5">Operator / Chemist Signature</p>
            </div>
            <div>
              <div className="border-b border-secondary-300 dark:border-secondary-700 w-32 mx-auto mb-2 h-12" />
              <p className="font-medium text-text-primary">Verified By</p>
              <p className="text-xs text-text-secondary mt-0.5">Quality Control Incharge</p>
            </div>
            <div>
              <div className="border-b border-secondary-300 dark:border-secondary-700 w-32 mx-auto mb-2 h-12" />
              <p className="font-medium text-text-primary">Approved By</p>
              <p className="text-xs text-text-secondary mt-0.5">Plant Administrator</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
