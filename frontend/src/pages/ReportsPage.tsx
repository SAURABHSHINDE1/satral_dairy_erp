import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, BarChart3, TrendingUp, Droplets, Thermometer, Printer } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';
import type { TankRecord } from '../types';
import { useAuthStore } from '../store/auth.store';
import { toast } from 'sonner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export default function ReportsPage() {
  const { user } = useAuthStore();
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
    queryKey: ['report', reportType, reportDate, customFrom, customTo, selectedYear, selectedMonth, queryKey],
    queryFn: async () => {
      switch (reportType) {
        case 'daily':
          return reportService.getDailyReport(reportDate);
        case 'weekly':
          return reportService.getWeeklyReport(weekAgo, todayStr);
        case 'monthly':
          return reportService.getMonthlyReport(selectedYear, selectedMonth);
        case 'custom':
          return reportService.getCustomReport(customFrom, customTo);
      }
    },
    enabled: triggered,
    retry: false,
  });

  const report = reportData?.data;
  const stats = report?.statistics || {};
  const records: TankRecord[] = report?.records || [];
  const dailyTrend = report?.dailyTrend || [];

  const handleGenerate = () => {
    if (reportType === 'custom' && (!customFrom || !customTo)) {
      return;
    }
    setTriggered(true);
    setQueryKey((k) => k + 1);
  };

  const handleExportCSV = () => {
    if (!records.length) return;

    const escapeCSVField = (val: any) => {
      const str = val === null || val === undefined ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [
      ['Date', 'Tank No.', 'Batch No.', 'Quantity (L)', 'FAT %', 'SNF %', 'Temperature', 'Milk Type', 'Status'],
      ...records.map((r) => [
        formatDate(r.date),
        r.tank_number,
        r.batch_number,
        r.milk_quantity.toFixed(2),
        r.fat_percentage.toFixed(2),
        r.snf_percentage.toFixed(2),
        r.temperature?.toFixed(1) || 'N/A',
        r.milk_type || 'N/A',
        getStatusLabel(r.status),
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCSVField).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${reportType}_${todayStr}.csv`;
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

    // Small delay to let the DOM render the printing header and signature blocks
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution scale
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF', // Clean white background for official report
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 297; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add remaining pages if report spans multiple pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`satral_dairy_report_${reportType}_${dateStr}.pdf`);
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

  const kpiCards = [
    { title: 'Total Records', value: stats.total_records || 0, icon: FileText, color: 'text-primary-600 bg-primary-100' },
    { title: 'Approved', value: stats.approved_records || 0, icon: BarChart3, color: 'text-success-600 bg-success-100' },
    { title: 'Total Milk (L)', value: Number(stats.total_milk_quantity || 0).toFixed(0), icon: Droplets, color: 'text-accent-600 bg-accent-100' },
    { title: 'Avg FAT %', value: Number(stats.avg_fat || 0).toFixed(2), icon: TrendingUp, color: 'text-warning-600 bg-warning-100' },
    { title: 'Avg SNF %', value: Number(stats.avg_snf || 0).toFixed(2), icon: TrendingUp, color: 'text-primary-600 bg-primary-100' },
    { title: 'Avg Temp °C', value: Number(stats.avg_temperature || 0).toFixed(1), icon: Thermometer, color: 'text-danger-600 bg-danger-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Reports</h1>
        <p className="text-text-secondary mt-1">Generate and export analytical reports</p>
      </div>

      {/* Controls */}
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Generate Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as ReportType); setTriggered(false); }}
            options={reportTypes}
          />

          {reportType === 'daily' && (
            <Input
              label="Select Date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          )}

          {reportType === 'monthly' && (
            <>
              <Select label="Month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={monthOptions} />
              <Select label="Year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} options={yearOptions} />
            </>
          )}

          {reportType === 'custom' && (
            <>
              <Input label="From Date" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <Input label="To Date" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
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
                {isExporting ? 'Downloading...' : 'Download PDF'}
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
          <p className="text-center text-danger-600 py-8">Failed to generate report. Please check your date range and try again.</p>
        </Card>
      )}

      {report && !isLoading && (
        <div ref={printRef} className="space-y-6 bg-white p-6 rounded-xl">
          {/* Professional Report Header (Only visible during PDF export) */}
          {isExporting && (
            <div className="border-b-2 border-primary-600 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">Satral Dairy ERP</h1>
                <p className="text-sm text-text-secondary">Official Milk Collection & Quality Analysis Report</p>
              </div>
              <div className="text-right text-xs text-text-secondary">
                <p className="mb-0.5"><span className="font-semibold text-text-primary">Report Type:</span> {reportType.toUpperCase()}</p>
                <p className="mb-0.5"><span className="font-semibold text-text-primary">Generated By:</span> {user?.full_name || 'System'}</p>
                <p><span className="font-semibold text-text-primary">Date:</span> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="text-center">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${card.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{card.value}</p>
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
                <h4 className="text-sm font-semibold text-text-primary mb-4">Milk Collection Trend</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={11} stroke="#64748B"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Line type="monotone" dataKey="total_quantity" stroke="#2563EB" strokeWidth={2} name="Qty (L)" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h4 className="text-sm font-semibold text-text-primary mb-4">Records Per Day</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" fontSize={11} stroke="#64748B"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis fontSize={11} stroke="#64748B" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend />
                    <Bar dataKey="records" fill="#14B8A6" name="Records" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Records Table */}
          {records.length > 0 && (
            <Card>
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Records ({records.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      {['Date', 'Tank No.', 'Batch No.', 'Qty (L)', 'FAT %', 'SNF %', 'Temp', 'Type', 'Status'].map((h) => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-text-secondary">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record: TankRecord) => (
                      <tr key={record.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                        <td className="py-2 px-3 text-xs text-text-primary">{formatDate(record.date)}</td>
                        <td className="py-2 px-3 text-xs font-medium text-text-primary">{record.tank_number}</td>
                        <td className="py-2 px-3 text-xs text-text-primary">{record.batch_number}</td>
                        <td className="py-2 px-3 text-xs text-text-primary">{record.milk_quantity.toFixed(2)}</td>
                        <td className="py-2 px-3 text-xs text-text-primary">{record.fat_percentage.toFixed(2)}</td>
                        <td className="py-2 px-3 text-xs text-text-primary">{record.snf_percentage.toFixed(2)}</td>
                        <td className="py-2 px-3 text-xs text-text-primary">{record.temperature?.toFixed(1) || '—'}</td>
                        <td className="py-2 px-3 text-xs text-text-primary capitalize">{record.milk_type}</td>
                        <td className="py-2 px-3">
                          <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                            {getStatusLabel(record.status)}
                          </Badge>
                        </td>
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
          {/* Professional Report Footer / Signatures (Only visible during PDF export) */}
          {isExporting && (
            <div className="mt-12 pt-8 border-t border-secondary-200 grid grid-cols-3 gap-6 text-center text-sm">
              <div>
                <div className="border-b border-secondary-300 w-32 mx-auto mb-2 h-12" />
                <p className="font-medium text-text-primary">Prepared By</p>
                <p className="text-xs text-text-secondary">Operator / Staff</p>
              </div>
              <div>
                <div className="border-b border-secondary-300 w-32 mx-auto mb-2 h-12" />
                <p className="font-medium text-text-primary">Verified By</p>
                <p className="text-xs text-text-secondary">Lab Incharge</p>
              </div>
              <div>
                <div className="border-b border-secondary-300 w-32 mx-auto mb-2 h-12" />
                <p className="font-medium text-text-primary">Approved By</p>
                <p className="text-xs text-text-secondary">Plant Administrator</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
