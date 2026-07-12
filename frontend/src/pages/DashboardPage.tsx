import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  FlaskConical,
  CheckCircle,
  Clock,
  XCircle,
  Droplets,
  Thermometer,
  Beaker,
  ClipboardList,
  Package,
  TestTube2,
  Milk,
  Scale,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { tankService } from '../services/tank.service';
import { formatDate } from '../lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

// Static metadata mapping for existing tables
const tableMetadata: Record<string, { label: string; path: string; icon: any; color: string; description: string }> = {
  tank_records: {
    label: 'Tank Records',
    path: '/tank-records',
    icon: FlaskConical,
    color: 'primary',
    description: 'Milk quantity, Fat, SNF, and Temp parameters for incoming tank runs.'
  },
  final_product_storage_records: {
    label: 'Final Product Storage',
    path: '/final-product-storage',
    icon: Beaker,
    color: 'success',
    description: 'Lab test logs for chemical and sensory analysis of storage silos.'
  },
  bi_product_reports: {
    label: 'Final Bi-Product Report',
    path: '/final-bi-product',
    icon: ClipboardList,
    color: 'warning',
    description: 'Batch records, TS, moisture, viscosity, and sensory of bi-products.'
  },
  raw_bulk_milk_testing_records: {
    label: 'Raw Bulk Milk Testing',
    path: '/raw-bulk-milk',
    icon: Droplets,
    color: 'danger',
    description: 'Organoleptic, COB, MBRT, alcohol, and density tests of raw bulk milk.'
  },
  packing_milk_reports: {
    label: 'Packing Milk Report',
    path: '/packing-milk-report',
    icon: Package,
    color: 'accent',
    description: 'Homogenization efficiency, fat/SNF control, and packaging logs.'
  },
  milk_taken_report_bi_products: {
    label: 'Milk Taken Report (Bi-Product)',
    path: '/milk-taken-report-bi-product',
    icon: TestTube2,
    color: 'primary',
    description: 'Volume and fat/SNF levels of milk processed into final bi-products.'
  },
  buttermilk_analysis_records: {
    label: 'Buttermilk Analysis',
    path: '/buttermilk-analysis-record',
    icon: Milk,
    color: 'success',
    description: 'Acidity, fat, packaging seals, and storage temperature records.'
  },
  pouch_weighing_sessions: {
    label: 'Pouch Weighing Log',
    path: '/pouch-weighing-log',
    icon: Scale,
    color: 'accent',
    description: 'Hourly net weight checks across all packing heads (Head A–I).'
  }
};

const getTableMeta = (tableName: string) => {
  if (tableMetadata[tableName]) {
    return tableMetadata[tableName];
  }

  // Convert snake_case table name to Title Case label. E.g. ghee_analysis_records -> Ghee Analysis Records
  const formattedLabel = tableName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Convert to dash route path. E.g. ghee_analysis_records -> /ghee-analysis-records
  const dashName = tableName.replace(/_/g, '-');
  const path = `/${dashName}`;

  return {
    label: formattedLabel,
    path: path,
    icon: FileText,
    color: 'primary',
    description: `Dynamic quality module logs for table ${tableName}.`
  };
};

export default function DashboardPage() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: statistics } = useQuery({
    queryKey: ['statistics', formatDate(thirtyDaysAgo), formatDate(today)],
    queryFn: () => tankService.getStatistics(formatDate(thirtyDaysAgo), formatDate(today)),
  });

  const { data: dailyTrend } = useQuery({
    queryKey: ['dailyTrend', formatDate(thirtyDaysAgo), formatDate(today)],
    queryFn: () => tankService.getDailyTrend(formatDate(thirtyDaysAgo), formatDate(today)),
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: () => tankService.getDashboardSummary(),
  });

  const stats = (statistics?.data || {}) as any;
  const trend = (dailyTrend?.data || []) as any[];
  const summary = (dashboardSummary?.data || []) as { tableName: string; count: number }[];

  const kpiCards = [
    {
      title: 'Total Records',
      value: stats.total_records || 0,
      icon: FlaskConical,
      color: 'primary',
    },
    {
      title: 'Approved',
      value: stats.approved_records || 0,
      icon: CheckCircle,
      color: 'success',
    },
    {
      title: 'Pending',
      value: stats.pending_records || 0,
      icon: Clock,
      color: 'warning',
    },
    {
      title: 'Rejected',
      value: stats.rejected_records || 0,
      icon: XCircle,
      color: 'danger',
    },
  ];

  const qualityCards = [
    {
      title: 'Total Milk Quantity',
      value: `${Number(stats.total_milk_quantity || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`,
      icon: Droplets,
      color: 'primary',
    },
    {
      title: 'Average FAT',
      value: `${Number(stats.avg_fat || 0).toFixed(2)}%`,
      icon: TrendingUp,
      color: 'accent',
    },
    {
      title: 'Average SNF',
      value: `${Number(stats.avg_snf || 0).toFixed(2)}%`,
      icon: TrendingUp,
      color: 'accent',
    },
    {
      title: 'Average Temperature',
      value: `${Number(stats.avg_temperature || 0).toFixed(2)}°C`,
      icon: Thermometer,
      color: 'warning',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            primary: 'bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
            success: 'bg-success-100 text-success-600 dark:bg-success-950/30 dark:text-success-400',
            warning: 'bg-warning-100 text-warning-600 dark:bg-warning-950/30 dark:text-warning-400',
            danger: 'bg-danger-100 text-danger-600 dark:bg-danger-950/30 dark:text-danger-400',
            accent: 'bg-accent-100 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400',
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-medium transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{card.title}</p>
                    <p className="text-3xl font-bold text-text-primary mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tank Quality Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            primary: 'bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400',
            success: 'bg-success-100 text-success-600 dark:bg-success-950/30 dark:text-success-400',
            warning: 'bg-warning-100 text-warning-600 dark:bg-warning-950/30 dark:text-warning-400',
            danger: 'bg-danger-100 text-danger-600 dark:bg-danger-950/30 dark:text-danger-400',
            accent: 'bg-accent-100 text-accent-600 dark:bg-accent-950/30 dark:text-accent-400',
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover:shadow-medium transition-shadow duration-300">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-secondary truncate">{card.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-text-primary mt-2 break-all">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg flex-shrink-0 ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quality Modules Overview Grid */}
      {summary.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Quality Modules & Forms</h2>
            <p className="text-sm text-text-secondary mt-0.5">Total logs recorded and active modules in Satral ERP.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {summary.map((item, idx) => {
              const meta = getTableMeta(item.tableName);
              const Icon = meta.icon;

              const borderColors = {
                primary: 'border-l-primary-500 hover:border-primary-400',
                success: 'border-l-success-500 hover:border-success-400',
                warning: 'border-l-warning-500 hover:border-warning-400',
                danger: 'border-l-danger-500 hover:border-danger-400',
                accent: 'border-l-accent-500 hover:border-accent-400',
              };

              const bgClasses = {
                primary: 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400',
                success: 'bg-success-50 dark:bg-success-950/20 text-success-600 dark:text-success-400',
                warning: 'bg-warning-50 dark:bg-warning-950/20 text-warning-600 dark:text-warning-400',
                danger: 'bg-danger-50 dark:bg-danger-950/20 text-danger-600 dark:text-danger-400',
                accent: 'bg-accent-50 dark:bg-accent-950/20 text-accent-600 dark:text-accent-400',
              };

              return (
                <motion.div
                  key={item.tableName}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -3 }}
                >
                  <Link
                    to={meta.path}
                    className={`block border-l-4 ${borderColors[meta.color as keyof typeof borderColors] || 'border-l-primary-500'} bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-lg ${bgClasses[meta.color as keyof typeof bgClasses] || 'bg-primary-50 text-primary-600'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-text-primary">
                          {item.count} Logs
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-text-primary">
                          {meta.label}
                        </h4>
                        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed line-clamp-2">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-secondary-100 dark:border-secondary-800 text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                      <span>Open Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collection and Daily Trend Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Milk Collection Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_quantity"
                  stroke="#2563EB"
                  strokeWidth={2}
                  name="Quantity (L)"
                  dot={{ fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Daily Records</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="records" fill="#14B8A6" name="Records" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
