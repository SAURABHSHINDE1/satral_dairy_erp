import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Check, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { CreateTankRecordModal } from '../components/CreateTankRecordModal';
import { formatDate, getStatusColor, getStatusLabel } from '../lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tankService } from '../services/tank.service';
import { useAuthStore } from '../store/auth.store';
import type { TankRecord } from '../types';

export default function TankRecordsPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editRecord, setEditRecord] = useState<TankRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<TankRecord | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [milkTypeFilter, setMilkTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: records, isLoading } = useQuery({
    queryKey: ['tankRecords', statusFilter, currentPage, pageSize],
    queryFn: () => tankService.getAll({
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }),
  });

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tankRecords'] });
    setEditRecord(null);
  };

  const handleEditClick = (record: TankRecord) => {
    setEditRecord(record);
    setShowCreateModal(true);
  };

  const handleViewClick = (record: TankRecord) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleDeleteClick = (record: TankRecord) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;
    
    setProcessing(true);
    try {
      await tankService.delete(selectedRecord.id);
      queryClient.invalidateQueries({ queryKey: ['tankRecords'] });
      setShowDeleteModal(false);
      setSelectedRecord(null);
    } catch (error: any) {
      console.error('Delete error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const canApproveOrReject = (record: TankRecord) => {
    if (!user) return false;
    
    if (user.role === 'lab_incharge' && record.status === 'pending_lab') {
      return true;
    }
    
    if (user.role === 'admin' && record.status === 'pending_admin') {
      return true;
    }
    
    return false;
  };

  const handleApprovalClick = (record: TankRecord, action: 'approve' | 'reject') => {
    setSelectedRecord(record);
    setApprovalAction(action);
    setApprovalRemarks('');
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedRecord) return;
    
    setProcessing(true);
    try {
      if (user?.role === 'lab_incharge') {
        if (approvalAction === 'approve') {
          await tankService.approveByLab(selectedRecord.id, approvalRemarks);
        } else {
          await tankService.rejectByLab(selectedRecord.id, approvalRemarks);
        }
      } else if (user?.role === 'admin') {
        if (approvalAction === 'approve') {
          await tankService.approveByAdmin(selectedRecord.id, approvalRemarks);
        } else {
          await tankService.rejectByAdmin(selectedRecord.id, approvalRemarks);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tankRecords'] });
      setShowApprovalModal(false);
      setSelectedRecord(null);
    } catch (error: any) {
      console.error('Approval error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = () => {
    const escapeCSVField = (val: any) => {
      const str = val === null || val === undefined ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      ['Date', 'Tank Number', 'Batch Number', 'Quantity (L)', 'FAT %', 'SNF %', 'Temperature', 'Milk Type', 'Sample Time', 'Packing Machine Detail', 'Tank Release Time', 'Status'],
      ...filteredRecords.map((record: TankRecord) => [
        formatDate(record.date),
        record.tank_number,
        record.batch_number,
        record.milk_quantity.toFixed(2),
        record.fat_percentage.toFixed(2),
        record.snf_percentage.toFixed(2),
        record.temperature?.toFixed(1) || 'N/A',
        record.milk_type || 'N/A',
        record.tank_release_time || 'N/A',
        record.packing_machine_detail || 'N/A',
        record.release_time || 'N/A',
        getStatusLabel(record.status),
      ]),
    ]
      .map((row) => row.map(escapeCSVField).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tank_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records?.data?.filter((record: TankRecord) => {
    const matchesSearch =
      record.tank_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    const matchesMilkType = milkTypeFilter === 'all' || record.milk_type === milkTypeFilter;
    
    const matchesDateRange =
      (!dateFrom || new Date(record.date) >= new Date(dateFrom)) &&
      (!dateTo || new Date(record.date) <= new Date(dateTo));
    
    return matchesSearch && matchesStatus && matchesMilkType && matchesDateRange;
  }) || [];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_lab', label: 'Pending Lab' },
    { value: 'pending_admin', label: 'Pending Admin' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const milkTypeOptions = [
    { value: 'all', label: 'All Milk Types' },
    { value: 'cow', label: 'Cow Milk' },
    { value: 'buffalo', label: 'Buffalo Milk' },
    { value: 'mixed', label: 'Mixed Milk' },
  ];

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMilkTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // When server-side paging, use total from API; here we use client-side count for filtered
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Tank Records</h1>
          <p className="text-text-secondary mt-1">Manage milk tank release records</p>
        </div>
        <Button onClick={() => { setEditRecord(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Record
        </Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <Input
                placeholder="Search by tank or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              options={statusOptions}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {showFilters && (
          <div className="bg-secondary-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Select
                label="Milk Type"
                value={milkTypeFilter}
                onChange={(e) => setMilkTypeFilter(e.target.value)}
                options={milkTypeOptions}
              />
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">Loading records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Tank No.</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Batch No.</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Quantity (L)</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">FAT %</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">SNF %</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-secondary">
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record: TankRecord, index: number) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-text-primary">{formatDate(record.date)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-text-primary">{record.tank_number}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{record.batch_number}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{record.milk_quantity.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{record.fat_percentage.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{record.snf_percentage.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewClick(record)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canApproveOrReject(record) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-success-600 hover:text-success-700 hover:bg-success-50"
                                onClick={() => handleApprovalClick(record, 'approve')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                                onClick={() => handleApprovalClick(record, 'reject')}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(record)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-danger-600 hover:text-danger-700" onClick={() => handleDeleteClick(record)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filteredRecords.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </Card>

      <CreateTankRecordModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditRecord(null); }}
        onSuccess={handleCreateSuccess}
        editRecord={editRecord}
      />

      {showApprovalModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {approvalAction === 'approve' ? 'Approve Record' : 'Reject Record'}
            </h2>
            <p className="text-text-secondary mb-4">
              {approvalAction === 'approve'
                ? `Are you sure you want to approve tank record ${selectedRecord.tank_number}?`
                : `Are you sure you want to reject tank record ${selectedRecord.tank_number}?`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Remarks (optional)
              </label>
              <textarea
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-secondary-300 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Add any notes..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRecord(null);
                  setApprovalRemarks('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprovalSubmit}
                disabled={processing}
                className={approvalAction === 'approve' ? 'bg-success-600 hover:bg-success-700' : 'bg-danger-600 hover:bg-danger-700'}
              >
                {processing ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Tank Record Details</h2>
              <button
                onClick={() => { setShowViewModal(false); setSelectedRecord(null); }}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
              <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Date</p>
                  <p className="font-medium text-text-primary">{formatDate(selectedRecord.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tank Number</p>
                  <p className="font-medium text-text-primary">{selectedRecord.tank_number}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Batch Number</p>
                  <p className="font-medium text-text-primary">{selectedRecord.batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Milk Type</p>
                  <p className="font-medium text-text-primary capitalize">{selectedRecord.milk_type}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Quantity (L)</p>
                  <p className="font-medium text-text-primary">{selectedRecord.milk_quantity.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">FAT %</p>
                  <p className="font-medium text-text-primary">{selectedRecord.fat_percentage.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">SNF %</p>
                  <p className="font-medium text-text-primary">{selectedRecord.snf_percentage.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Temperature (°C)</p>
                  <p className="font-medium text-text-primary">{selectedRecord.temperature?.toFixed(1) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Sample Time</p>
                  <p className="font-medium text-text-primary">{selectedRecord.tank_release_time || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Packing Machine Detail</p>
                  <p className="font-medium text-text-primary">{selectedRecord.packing_machine_detail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tank Release Time (Actual)</p>
                  <p className="font-medium text-text-primary">{selectedRecord.release_time || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Status</p>
                <Badge className={getStatusColor(selectedRecord.status)}>
                  {getStatusLabel(selectedRecord.status)}
                </Badge>
              </div>
              {selectedRecord.remarks && (
                <div>
                  <p className="text-sm text-text-secondary">Remarks</p>
                  <p className="font-medium text-text-primary">{selectedRecord.remarks}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => { setShowViewModal(false); setSelectedRecord(null); }}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Delete Record</h2>
            <p className="text-text-secondary mb-4">
              Are you sure you want to delete tank record {selectedRecord.tank_number}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={processing}
                className="bg-danger-600 hover:bg-danger-700"
              >
                {processing ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
