import { motion } from 'framer-motion';
import {
  TrendingUp,
  FlaskConical,
  CheckCircle,
  Clock,
  XCircle,
  Droplets,
  Thermometer,
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

  const stats = (statistics?.data || {}) as any;
  const trend = (dailyTrend?.data || []) as any[];

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
      value: `${Number(stats.total_milk_quantity || 0).toFixed(2)} L`,
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            primary: 'bg-primary-100 text-primary-600',
            success: 'bg-success-100 text-success-600',
            warning: 'bg-warning-100 text-warning-600',
            danger: 'bg-danger-100 text-danger-600',
            accent: 'bg-accent-100 text-accent-600',
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            primary: 'bg-primary-100 text-primary-600',
            success: 'bg-success-100 text-success-600',
            warning: 'bg-warning-100 text-warning-600',
            danger: 'bg-danger-100 text-danger-600',
            accent: 'bg-accent-100 text-accent-600',
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover:shadow-medium transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-secondary">{card.title}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{card.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

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
