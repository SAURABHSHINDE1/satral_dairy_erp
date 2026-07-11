import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, UserCheck, UserX } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { useAuthStore } from '../store/auth.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { UserModal } from '../components/UserModal';
import type { User } from '../types';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });

  const users = usersData?.data || [];

  const filteredUsers = users.filter(
    (user: User) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEditClick = (user: User) => {
    setEditUser(user);
    setShowUserModal(true);
  };

  const handleAddClick = () => {
    setEditUser(null);
    setShowUserModal(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setDeletingUser(true);
    try {
      await userService.delete(selectedUser.id);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setEditUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin:            'bg-primary-100 text-primary-700',
      lab_incharge:     'bg-accent-100 text-accent-700',
      quality_incharge: 'bg-teal-100 text-teal-700',
      qc_manager:       'bg-orange-100 text-orange-700',
      operator:         'bg-secondary-100 text-secondary-700',
    };
    return colors[role as keyof typeof colors] || 'bg-secondary-100 text-secondary-700';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin:            'Admin',
      lab_incharge:     'Lab Incharge',
      quality_incharge: 'Quality Incharge',
      qc_manager:       'QC Manager',
      operator:         'Operator',
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Users</h1>
          <p className="text-text-secondary mt-1">Manage system users and permissions</p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-secondary">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Full Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-text-secondary">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-text-primary">{user.username}</td>
                      <td className="py-3 px-4 text-sm text-text-primary">{user.full_name}</td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <Badge variant="success" className="bg-success-100 text-success-700">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="bg-danger-100 text-danger-700">
                            <UserX className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                            Edit
                          </Button>
                          {user.username !== 'admin' && user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                              onClick={() => handleDeleteClick(user)}
                            >
                              Delete
                            </Button>
                          )}
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
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
        />
      </Card>

      <UserModal
        isOpen={showUserModal}
        onClose={() => { setShowUserModal(false); setEditUser(null); }}
        onSuccess={handleModalSuccess}
        editUser={editUser}
      />

      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Delete User</h2>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete user <span className="font-medium text-text-primary">{selectedUser.full_name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deletingUser}
                className="bg-danger-600 hover:bg-danger-700"
              >
                {deletingUser ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
