import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { formatDateTime } from '../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activity.service';
import type { ActivityLog } from '../types';

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const activeFilterCount = [actionFilter, dateFrom, dateTo].filter(Boolean).length;

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activityLogs', actionFilter, dateFrom, dateTo],
    queryFn: () =>
      activityService.getAll({
        action: actionFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 200,
      }),
  });

  const activities = activitiesData?.data || [];

  const filteredActivities = activities.filter(
    (activity: ActivityLog) =>
      !searchTerm ||
      (activity.username && activity.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (activity.full_name && activity.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const paginatedActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
  ];

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      login: 'bg-success-100 text-success-700',
      logout: 'bg-secondary-100 text-secondary-700',
      create: 'bg-primary-100 text-primary-700',
      update: 'bg-warning-100 text-warning-700',
      delete: 'bg-danger-100 text-danger-700',
      approve: 'bg-success-100 text-success-700',
      reject: 'bg-danger-100 text-danger-700',
    };
    return colors[action] || 'bg-secondary-100 text-secondary-700';
  };

  const getActionDot = (action: string) => {
    const dots: Record<string, string> = {
      login: 'bg-success-500',
      logout: 'bg-secondary-400',
      create: 'bg-primary-500',
      update: 'bg-warning-500',
      delete: 'bg-danger-500',
      approve: 'bg-success-500',
      reject: 'bg-danger-500',
    };
    return dots[action] || 'bg-secondary-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Activity Logs</h1>
        <p className="text-text-secondary mt-1">Track system activities and user actions</p>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <Input
                placeholder="Search by user or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    label="Action Type"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    options={actionOptions}
                  />
                  <Input
                    label="Date From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <Input
                    label="Date To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">Loading activities...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 text-text-secondary">
                No activity logs found
              </div>
            ) : (
              paginatedActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  className="flex items-start gap-4 p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {(activity.full_name || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getActionDot(activity.action)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-text-primary">{activity.full_name || 'System'}</p>
                      <Badge className={getActionBadgeColor(activity.action)}>{activity.action}</Badge>
                      {activity.entity_type && (
                        <span className="text-xs text-text-secondary capitalize">{activity.entity_type.replace('_', ' ')}</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{activity.details}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-text-secondary">{formatDateTime(activity.created_at)}</p>
                      {activity.username && (
                        <p className="text-xs text-text-secondary">@{activity.username}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-secondary-100 text-sm text-text-secondary">
          Showing {filteredActivities.length} {filteredActivities.length === 1 ? 'record' : 'records'}
          {activeFilterCount > 0 && ' (filtered)'}
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredActivities.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          pageSizeOptions={[10, 20, 50]}
        />
      </Card>
    </div>
  );
}
